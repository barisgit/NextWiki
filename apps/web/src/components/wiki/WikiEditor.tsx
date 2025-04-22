"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTRPC } from "~/server/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { MarkdownProse } from "./MarkdownProse";
import CodeMirror, {
  EditorView,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { xcodeLight, xcodeDark } from "@uiw/codemirror-theme-xcode";
import { HighlightedMarkdown } from "~/lib/markdown/client";
import { AssetManager } from "./AssetManager";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@repo/ui";
import { Input } from "@repo/ui";
import { Label } from "@repo/ui";
import { ThemeToggle } from "../layout/theme-toggle";
import {
  X,
  ChevronDown,
  Image,
  File,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Command, CommandList, CommandItem, CommandEmpty } from "@repo/ui";
import { logger } from "~/lib/utils/logger";

const MAX_VIEWABLE_FILE_SIZE_MB = 10;

// Basic debounce hook implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom highlight style for markdown
// TODO: Try to use nested styles
const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "bold", color: "var(--color-primary)" },
  { tag: tags.heading1, fontSize: "1.6em", color: "var(--color-accent)" },
  { tag: tags.heading2, fontSize: "1.4em", color: "var(--color-accent)" },
  { tag: tags.heading3, fontSize: "1.2em", color: "var(--color-secondary)" },
  { tag: tags.strong, fontWeight: "bold", color: "var(--color-complementary)" },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
    color: "var(--color-text-secondary)",
  },
  { tag: tags.link, color: "var(--color-complementary)" },
  { tag: tags.url, color: "var(--color-complementary)" },
  { tag: tags.escape, color: "var(--color-complementary)" },
  { tag: tags.list, color: "var(--color-text-secondary)" },
  { tag: tags.quote, color: "var(--color-primary)" },
  { tag: tags.comment, color: "var(--color-accent)" },
  {
    tag: tags.monospace,
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-background-level3)",
  },
  { tag: tags.meta, color: "var(--color-text-secondary)" },
]);

// Enhanced extensions for better markdown handling
const editorExtensions = [
  markdown({
    base: markdownLanguage,
    codeLanguages: languages,
  }),
  syntaxHighlighting(markdownHighlightStyle),
  syntaxHighlighting(defaultHighlightStyle),
];

interface WikiEditorProps {
  mode: "create" | "edit";
  pageId?: number;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  pagePath?: string;
}

export function WikiEditor({
  mode = "create",
  pageId,
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  pagePath = "",
}: WikiEditorProps) {
  const router = useRouter();
  const notification = useNotification();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isLocked, setIsLocked] = useState(mode === "create");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const lockAcquiredRef = useRef(false);
  const isDarkMode =
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false;
  const trpc = useTRPC();

  const debouncedTagInput = useDebounce(tagInput, 300);

  const queryClient = useQueryClient();
  const assetsQueryKey = trpc.assets.getPaginated.queryKey();

  // TRPC mutation for uploading assets
  const uploadAssetMutation = useMutation(
    trpc.assets.upload.mutationOptions({
      onSuccess: () => {
        // Logic moved to notification.promise success handler
        // We might still need some non-notification logic here in the future,
        // but for now, it's handled by the promise.
      },
      onError: (error) => {
        // Error handling is now primarily managed by notification.promise
        logger.error("Error uploading asset:", error);
      },
    })
  );

  // Upload file to server using TRPC mutation
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;

          // Use notification.promise
          notification.promise(
            uploadAssetMutation.mutateAsync({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              data: base64Data, // Pass the base64 data URI
              pageId: pageId || null, // Ensure pageId is number or null
            }),
            {
              loading: `Uploading ${file.name}...`,
              success: (asset) => {
                // Insert markdown link for the uploaded asset
                const isViewable =
                  asset.fileType.startsWith("image/") ||
                  asset.fileType.startsWith("video/");
                const fileSizeMB = asset.fileSize / (1024 * 1024);

                let assetMarkdown = "";
                if (isViewable) {
                  if (fileSizeMB <= MAX_VIEWABLE_FILE_SIZE_MB) {
                    assetMarkdown = `![${asset.fileName}](/api/assets/${asset.id})`; // Image link
                  } else {
                    notification.info(
                      `Asset ${asset.fileName} is too large to view inline. We will display a link instead.`
                    );
                    assetMarkdown = `[${asset.fileName}](/api/assets/${asset.id})`; // Standard link
                  }
                } else {
                  assetMarkdown = `[${asset.fileName}](/api/assets/${asset.id})`; // Standard link
                }

                // Insert at current cursor position or append to content
                // TODO: Implement inserting at cursor position using editorRef
                setContent((current) => current + "\n" + assetMarkdown + "\n");
                setUnsavedChanges(true);
                return `Asset ${asset.fileName} uploaded successfully`; // Return success message
              },
              error: (error) => {
                logger.error("Error uploading asset:", error);
                return `Failed to upload asset: ${error.message}`; // Return error message
              },
            }
          );
        };
        reader.readAsDataURL(file); // Read as data URL
      } catch (error) {
        logger.error("Error uploading image:", error);
        notification.error("Failed to upload image");
      } finally {
        queryClient.invalidateQueries({ queryKey: assetsQueryKey });
      }
    },
    [pageId, notification, uploadAssetMutation, queryClient, assetsQueryKey] // Added dependencies
  );

  // CodeMirror event handler extension for paste and drop
  const cmEventHandlers = EditorView.domEventHandlers({
    paste: (event: ClipboardEvent, view: EditorView) => {
      logger.debug("CodeMirror paste event triggered");
      logger.debug("Pasted into view:", view); // Example use of view to satisfy linter
      const files = Array.from(event.clipboardData?.files || []);
      const items = Array.from(event.clipboardData?.items || []);

      // Optional: Log detected items for debugging
      logger.debug(
        "CM Clipboard Files:",
        files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
      logger.debug(
        "CM Clipboard Items:",
        items.map((item) => ({ kind: item.kind, type: item.type }))
      );

      // Prioritize actual files
      if (files.length > 0) {
        // Check if the first file is suitable (could be image or other type)
        const fileToUpload = files[0];
        if (fileToUpload) {
          logger.log("CM: Found file in files:", fileToUpload.name);
          event.preventDefault();
          handleFileUpload(fileToUpload);
          return true; // Indicate we handled the event
        }
      }

      // Fallback: check items
      const imageItem = items.find(
        (item) => item.kind === "file" // Find any file item, regardless of type
      );

      if (imageItem) {
        logger.log("CM: Found file item (kind=file)", imageItem.type);
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          logger.log("CM: Got file from image item:", file.name);
          handleFileUpload(file); // Use the renamed file upload handler
          return true; // Indicate we handled the event
        }
      }
      logger.log(
        "CM: No suitable file found in clipboard data, allowing default paste."
      );
      return false; // Allow default paste if no image found/handled
    },
    drop: (event: DragEvent, view: EditorView) => {
      logger.log("CodeMirror drop event triggered");
      logger.log("Dropped onto view:", view); // Example use of view to satisfy linter
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      // Handle any dropped file type
      if (file) {
        logger.log("CM: Handling dropped image:", file.name);
        handleFileUpload(file); // Use the renamed file upload handler
        return true; // Indicate we handled the event
      }
      return false; // Allow default drop if not handled
    },
  });

  // Content change tracking
  useEffect(() => {
    if (content !== initialContent) {
      setUnsavedChanges(true);
    }
  }, [content, initialContent]);

  // Create page mutation
  const createPageMutation = useMutation(
    trpc.wiki.create.mutationOptions({
      onSuccess: (data) => {
        notification.success("Page created successfully");
        setUnsavedChanges(false);
        // Navigate to new page
        router.push(`/${data.path}`);
      },
      onError: (error) => {
        setIsSaving(false);
        notification.error(`Failed to create page: ${error.message}`);
      },
    })
  );

  // Update page mutation
  const updatePageMutation = useMutation(
    trpc.wiki.update.mutationOptions({
      onSuccess: () => {
        notification.success("Page updated successfully");
        setUnsavedChanges(false);
        if (pagePath) {
          router.push(`/${pagePath}`);
        } else {
          router.push("/wiki");
        }
      },
      onError: (error) => {
        setIsSaving(false);
        notification.error(`Failed to update page: ${error.message}`);
      },
    })
  );

  // Lock management (only for edit mode)
  const acquireLockMutation = useMutation(
    trpc.wiki.acquireLock.mutationOptions({
      onSuccess: (data) => {
        if (data && "success" in data && data.success) {
          setIsLocked(true);
          notification.success("You now have edit access to this page");
        } else if (data && "page" in data && data.page?.lockedById) {
          // Lock acquisition failed because someone else has the lock
          notification.error("This page is being edited by another user");
          // Navigate back
          navigateBack();
        } else {
          // Generic failure
          notification.error(
            "Could not acquire edit lock. Please try again later."
          );
          // Navigate back
          navigateBack();
        }
      },
      onError: (error) => {
        notification.error(`Failed to acquire edit lock: ${error.message}`);
        // If we can't get the lock, go back to the page
        navigateBack();
      },
    })
  );

  const releaseLockMutation = useMutation(
    trpc.wiki.releaseLock.mutationOptions({
      onSuccess: () => {
        notification.success("Lock released successfully");
      },
    })
  );

  // Add refresh lock mutation
  const refreshLockMutation = useMutation(
    trpc.wiki.refreshLock.mutationOptions({
      onError: (error) => {
        notification.error(`Lock expired: ${error.message}`);
        // Lock expired, go back to the wiki page
        navigateBack();
      },
    })
  );

  // Navigate back helper
  const navigateBack = useCallback(() => {
    router.refresh();
    if (pagePath) {
      router.push(`/${pagePath}`);
    } else {
      router.push("/wiki");
    }
  }, [router, pagePath]);

  // Acquire lock on component mount (only in edit mode)
  useEffect(() => {
    if (mode === "edit" && pageId && !lockAcquiredRef.current) {
      lockAcquiredRef.current = true;
      acquireLockMutation.mutate({ id: pageId });
    }

    // Release lock when component unmounts
    return () => {
      if (isLocked && pageId) {
        releaseLockMutation.mutate({ id: pageId });
      }
    };
  }, [mode, pageId, isLocked]);

  // Add lock refresh interval (only in edit mode)
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | undefined;

    if (mode === "edit" && isLocked && pageId) {
      // Refresh the lock every 5 minutes to prevent timeout
      refreshInterval = setInterval(
        () => {
          refreshLockMutation.mutate({ id: pageId });
        },
        5 * 60 * 1000
      ); // 5 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [mode, isLocked, pageId]);

  // Fetch tag suggestions when debounced input changes
  const { data: fetchedSuggestions } = useQuery({
    ...trpc.tags.search.queryOptions({
      query: debouncedTagInput,
      limit: 3, // Limit suggestions on the backend,
    }),
    enabled: debouncedTagInput.length > 0 && showSuggestions, // Other options merged here
  });

  // Update suggestions state when fetched data changes
  useEffect(() => {
    if (fetchedSuggestions) {
      // Define expected tag type for suggestions
      type TagSuggestion = { id: number; name: string };

      // Filter out tags already added
      setTagSuggestions(
        (fetchedSuggestions as TagSuggestion[])
          .map((tag: TagSuggestion) => tag.name)
          .filter((name: string) => !tags.includes(name))
      );
    } else {
      // Clear suggestions if fetched data is undefined (e.g., query disabled or loading)
      setTagSuggestions([]);
    }
  }, [fetchedSuggestions, tags]);

  // Focus title input when editing title
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);

  // Tag management
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      setTagSuggestions([]);
      setShowSuggestions(false);
      setUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setUnsavedChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Title management
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setEditingTitle(false);
    } else if (e.key === "Escape") {
      setEditingTitle(false);
    }
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setUnsavedChanges(true);
  };

  // Save & cancel handlers
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notification.error("Please enter a title for the page");
      return;
    }

    setIsSaving(true);

    if (mode === "create") {
      createPageMutation.mutate({
        title,
        content,
        path: pagePath,
        isPublished: true,
        tags,
      });
    } else if (mode === "edit" && pageId) {
      updatePageMutation.mutate({
        id: pageId,
        path: pagePath,
        title,
        content,
        isPublished: true,
        tags,
      });
    }
  };

  const handleCancel = () => {
    // Ask for confirmation if there are unsaved changes
    if (unsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        return;
      }
    }

    // Release the lock if in edit mode
    if (mode === "edit" && isLocked && pageId) {
      releaseLockMutation.mutate(
        { id: pageId },
        {
          onSuccess: () => {
            navigateBack();
          },
        }
      );
    } else {
      // If no lock to release, just navigate back
      navigateBack();
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (!files[0]) {
        throw new Error("File is undefined");
      }
      void handleFileUpload(files[0]); // Use the renamed file upload handler
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle asset selection from asset manager
  const handleAssetSelect = (
    assetUrl: string,
    assetName: string,
    fileType: string
  ) => {
    // Format for image vs other assets
    const isImage = fileType.startsWith("image/");
    const markdownLink = isImage
      ? `![${assetName}](${assetUrl})`
      : `[${assetName}](${assetUrl})`;

    // Insert at cursor position or append to content
    setContent((current) => current + "\n" + markdownLink + "\n");
    setUnsavedChanges(true);

    // Close the asset manager
    setShowAssetManager(false);
  };

  const getEditorTheme = () => {
    return isDarkMode ? xcodeDark : xcodeLight;
  };

  // If we're waiting for lock acquisition in edit mode, show loading
  if (mode === "edit" && !isLocked) {
    return (
      <div className="bg-background flex h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4 p-8 text-center">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
          <h2 className="text-text-primary text-xl font-medium">
            Acquiring edit lock...
          </h2>
          <p className="text-text-secondary">
            Please wait while we secure exclusive access to edit this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header Bar */}
      <header className="bg-card border-border sticky top-0 z-10 border-b">
        <div className="flex h-16 items-center justify-between px-6 py-2">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={handleCancel}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            {editingTitle ? (
              <Input
                ref={titleInputRef}
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Enter page title"
                className="w-72 px-2 py-1 text-xl font-medium"
                autoFocus
              />
            ) : (
              <h2
                className="text-text-primary hover:text-primary max-w-md cursor-pointer truncate text-xl font-medium"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {title || "Untitled"}
              </h2>
            )}

            {mode === "edit" && isLocked && (
              <Badge variant="default" color="success">
                Editing
              </Badge>
            )}

            {pagePath && (
              <Badge variant="secondary" color="neutral" className="text-xs">
                {pagePath}
              </Badge>
            )}

            {unsavedChanges && (
              <Badge variant="secondary" color="warning">
                Unsaved Changes
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Asset Management Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="soft"
                  color="accent"
                  className="flex items-center gap-1"
                >
                  <span>Assets</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    color="primary"
                    onClick={triggerFileUpload}
                    disabled={uploadAssetMutation.isPending}
                    className="flex items-center justify-start gap-2"
                  >
                    <Image className="h-4 w-4" />
                    <span>Upload Image</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="accent"
                    onClick={() => setShowAssetManager(true)}
                    className="flex items-center justify-start gap-2"
                  >
                    <File className="h-4 w-4" />
                    <span>Asset Manager</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Hidden File Input - Kept for triggerFileUpload functionality */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />

            <Button
              size="sm"
              variant={isSaving ? "soft" : "solid"}
              color="success"
              type="button"
              onClick={handleSave}
              disabled={isSaving || !unsavedChanges}
              className="flex min-w-20 items-center gap-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Metadata Section */}
      <div className="bg-background-level1 border-border border-b px-6 py-4">
        <div className="mb-2 flex flex-wrap gap-3">
          <Label className="text-text-secondary flex items-center text-sm font-medium">
            Tags:
          </Label>

          <div className="flex items-center">
            {/* Tag Input with Suggestions Popover */}
            <div className="relative">
              <Popover
                open={
                  showSuggestions &&
                  tagInput.length > 0 &&
                  tagSuggestions.length > 0
                }
                onOpenChange={setShowSuggestions}
              >
                {/* Anchor the popover to the input field */}
                <PopoverAnchor asChild>
                  <Input
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowSuggestions(true); // Try to show suggestions on input change
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)} // Show on focus
                    onBlur={(event) => {
                      // Check if focus moved to the popover content
                      const relatedTarget =
                        event.relatedTarget as HTMLElement | null;
                      if (popoverContentRef.current?.contains(relatedTarget)) {
                        return; // Don't hide if focus is inside popover
                      }
                      // Hide after delay if focus moves elsewhere
                      setTimeout(() => setShowSuggestions(false), 150);
                    }}
                    placeholder="Add tag..."
                    className="h-7 w-40 text-xs"
                    aria-autocomplete="list"
                    aria-controls="tag-suggestions"
                  />
                </PopoverAnchor>

                <PopoverContent
                  ref={popoverContentRef}
                  className="mt-1 w-48 p-0"
                  align="start"
                  side="bottom"
                  id="tag-suggestions"
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>No matching tags found.</CommandEmpty>
                      {tagSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion}
                          value={suggestion}
                          onSelect={() => {
                            // Use the suggestion value directly
                            if (suggestion && !tags.includes(suggestion)) {
                              setTags([...tags, suggestion]);
                              setTagInput("");
                              setTagSuggestions([]);
                              setShowSuggestions(false);
                              setUnsavedChanges(true);
                            }
                          }}
                        >
                          {suggestion}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type="button"
              onClick={handleAddTag}
              variant="ghost"
              color="primary"
              size="sm"
              className="ml-1 h-7 text-xs"
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  color="primary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-primary-100 hover:text-primary-700 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-text-tertiary text-sm">No tags</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Tabs and Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-border bg-card border-b">
            <TabsList className="ml-4 mt-1 bg-transparent p-0">
              <TabsTrigger value="editor" className="px-4 py-2">
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="px-4 py-2">
                Preview
              </TabsTrigger>
              <TabsTrigger value="split" className="px-4 py-2">
                Split View
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Editor Tab */}
          <TabsContent
            value="editor"
            className="m-0 flex-1 overflow-hidden p-0"
          >
            <div className="h-full">
              <CodeMirror
                ref={editorRef}
                value={content}
                height="100%"
                width="100%"
                extensions={[...editorExtensions, cmEventHandlers]}
                onChange={(value) => setContent(value)}
                className="h-full overflow-hidden"
                placeholder="Write your content using Markdown..."
                theme={getEditorTheme()}
                lang="markdown"
              />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="m-0 flex-1 overflow-auto p-0">
            <div className="bg-background-level1 h-full overflow-auto p-6">
              <MarkdownProse>
                <HighlightedMarkdown
                  content={content || "*No content to preview*"}
                />
              </MarkdownProse>
            </div>
          </TabsContent>

          {/* Split View Tab */}
          <TabsContent
            value="split"
            className="m-0 flex flex-1 overflow-hidden p-0"
          >
            <div className="flex h-full flex-1 overflow-hidden">
              {/* Editor Panel */}
              <div className="border-border h-full w-1/2 overflow-hidden border-r">
                <CodeMirror
                  value={content}
                  height="100%"
                  width="100%"
                  extensions={[...editorExtensions, cmEventHandlers]}
                  onChange={(value) => setContent(value)}
                  className="h-full overflow-hidden"
                  placeholder="Write your content using Markdown..."
                  theme={getEditorTheme()}
                />
              </div>

              {/* Preview Panel */}
              <div className="bg-background-level1 h-full w-1/2 overflow-auto">
                <div className="p-6">
                  <MarkdownProse>
                    <HighlightedMarkdown
                      content={content || "*No content to preview*"}
                    />
                  </MarkdownProse>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Asset Manager Modal */}
      <AssetManager
        isOpen={showAssetManager}
        onClose={() => setShowAssetManager(false)}
        onSelectAsset={(assetUrl, assetName, fileType) =>
          handleAssetSelect(assetUrl, assetName, fileType)
        }
        pageId={pageId}
      />
    </div>
  );
}
