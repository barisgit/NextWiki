"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTRPC } from "~/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { MarkdownProse } from "./MarkdownProse";
import CodeMirror, {
  EditorView,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { xcodeLight, xcodeDark } from "@uiw/codemirror-theme-xcode";
import { HighlightedMarkdown } from "~/lib/markdown/client";
import { AssetManager } from "./AssetManager";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  X,
  ChevronDown,
  Image,
  File,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Enhanced extensions for better markdown handling
const editorExtensions = [markdown()];

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
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lockAcquiredRef = useRef(false);
  const isDarkMode =
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false;
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const assetsQueryKey = trpc.assets.getPaginated.queryKey();

  // TRPC mutation for uploading assets
  const uploadAssetMutation = useMutation(
    trpc.assets.upload.mutationOptions({
      onSuccess: (asset) => {
        // Insert markdown link for the uploaded asset
        const isImage = asset.fileType.startsWith("image/");
        const assetMarkdown = isImage
          ? `![${asset.fileName}](${`/api/assets/${asset.id}`})` // Image link
          : `[${asset.fileName}](${`/api/assets/${asset.id}`})`; // Standard link

        // Insert at current cursor position or append to content
        // TODO: Implement inserting at cursor position using editorRef
        setContent((current) => current + "\n" + assetMarkdown + "\n");
        setUnsavedChanges(true);

        notification.success("Asset uploaded successfully");
      },
      onError: (error) => {
        console.error("Error uploading asset:", error);
        notification.error(`Failed to upload asset: ${error.message}`);
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
          uploadAssetMutation.mutateAsync({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            data: base64Data, // Pass the base64 data URI
            pageId: pageId || null, // Ensure pageId is number or null
          });
        };
        reader.readAsDataURL(file); // Read as data URL
      } catch (error) {
        console.error("Error uploading image:", error);
        notification.error("Failed to upload image");
      } finally {
        queryClient.invalidateQueries({ queryKey: assetsQueryKey });
      }
    },
    [pageId, notification, uploadAssetMutation]
  );

  // CodeMirror event handler extension for paste and drop
  const cmEventHandlers = EditorView.domEventHandlers({
    paste: (event: ClipboardEvent, view: EditorView) => {
      console.log("CodeMirror paste event triggered");
      console.log("Pasted into view:", view); // Example use of view to satisfy linter
      const files = Array.from(event.clipboardData?.files || []);
      const items = Array.from(event.clipboardData?.items || []);

      // Optional: Log detected items for debugging
      console.log(
        "CM Clipboard Files:",
        files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
      );
      console.log(
        "CM Clipboard Items:",
        items.map((item) => ({ kind: item.kind, type: item.type }))
      );

      // Prioritize actual files
      if (files.length > 0) {
        // Check if the first file is suitable (could be image or other type)
        const fileToUpload = files[0];
        if (fileToUpload) {
          console.log("CM: Found file in files:", fileToUpload.name);
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
        console.log("CM: Found file item (kind=file)", imageItem.type);
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          console.log("CM: Got file from image item:", file.name);
          handleFileUpload(file); // Use the renamed file upload handler
          return true; // Indicate we handled the event
        }
      }
      console.log(
        "CM: No suitable file found in clipboard data, allowing default paste."
      );
      return false; // Allow default paste if no image found/handled
    },
    drop: (event: DragEvent, view: EditorView) => {
      console.log("CodeMirror drop event triggered");
      console.log("Dropped onto view:", view); // Example use of view to satisfy linter
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      // Handle any dropped file type
      if (file) {
        console.log("CM: Handling dropped image:", file.name);
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
      refreshInterval = setInterval(() => {
        refreshLockMutation.mutate({ id: pageId });
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [mode, isLocked, pageId]);

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
      });
    } else if (mode === "edit" && pageId) {
      updatePageMutation.mutate({
        id: pageId,
        path: pagePath,
        title,
        content,
        isPublished: true,
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
  const handleAssetSelect = (assetUrl: string, assetName: string) => {
    // Format for image vs other assets
    const isImage = assetName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
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
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center p-8 space-y-4 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <h2 className="text-xl font-medium text-text-primary">
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 border-b bg-card border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              color="secondary"
              onClick={handleCancel}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
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
                className="px-2 py-1 text-xl font-medium w-72"
                autoFocus
              />
            ) : (
              <h2
                className="max-w-md text-xl font-medium truncate cursor-pointer text-text-primary hover:text-primary"
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
                  <ChevronDown className="w-4 h-4" />
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
                    <Image className="w-4 h-4" />
                    <span>Upload Image</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="accent"
                    onClick={() => setShowAssetManager(true)}
                    className="flex items-center justify-start gap-2"
                  >
                    <File className="w-4 h-4" />
                    <span>Asset Manager</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            <Button
              size="sm"
              variant={isSaving ? "soft" : "solid"}
              color="success"
              type="button"
              onClick={handleSave}
              disabled={isSaving || !unsavedChanges}
              className="flex items-center gap-1 min-w-20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Metadata Section */}
      <div className="px-4 py-3 border-b bg-background-level1 border-border">
        <div className="flex flex-wrap gap-3 mb-2">
          <Label className="flex items-center text-sm font-medium text-text-secondary">
            Tags:
          </Label>

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
                    className="rounded-full hover:bg-primary-100 hover:text-primary-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-text-secondary">No tags</span>
          )}

          <div className="flex items-center">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tag..."
              className="w-32 text-xs h-7"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              variant="ghost"
              color="primary"
              size="sm"
              className="ml-1 text-xs h-7"
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Tabs and Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="border-b border-border bg-card">
            <TabsList className="p-0 mt-1 ml-4 bg-transparent">
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
            className="flex-1 p-0 m-0 overflow-hidden"
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
          <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-auto">
            <div className="h-full p-6 overflow-auto bg-background-level1">
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
            className="flex flex-1 p-0 m-0 overflow-hidden"
          >
            <div className="flex flex-1 h-full overflow-hidden">
              {/* Editor Panel */}
              <div className="w-1/2 h-full overflow-hidden border-r border-border">
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
              <div className="w-1/2 h-full overflow-auto bg-background-level1">
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
        onSelectAsset={handleAssetSelect}
        pageId={pageId}
      />
    </div>
  );
}
