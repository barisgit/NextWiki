"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTRPC } from "~/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { MarkdownProse } from "./MarkdownProse";
import dynamic from "next/dynamic";
import { HighlightedMarkdown } from "./HighlightedMarkdown";
import Modal from "~/components/ui/modal";
import { Extension } from "@codemirror/state";
import type {
  ReactCodeMirrorProps,
  ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { AssetManager } from "./AssetManager";
import { Button } from "../ui/button";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full p-4 border rounded">
        Loading editor...
      </div>
    ),
  }
);

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
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorExtensions, setEditorExtensions] = useState<Extension[]>([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const [darkTheme, setDarkTheme] =
    useState<ReactCodeMirrorProps["theme"]>(undefined);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  // Load extensions and theme
  useEffect(() => {
    let mounted = true;
    async function loadExtensionsAndTheme() {
      try {
        const markdown = await import("@codemirror/lang-markdown");
        const { tokyoNightStorm } = await import(
          "@uiw/codemirror-theme-tokyo-night-storm"
        );
        if (mounted) {
          setEditorExtensions([markdown.markdown()]);
          setDarkTheme(tokyoNightStorm);
          setExtensionsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load CodeMirror extensions or theme:", err);
      }
    }

    loadExtensionsAndTheme();

    return () => {
      mounted = false;
    };
  }, []);

  // Create page mutation
  const createPageMutation = useMutation(
    trpc.wiki.create.mutationOptions({
      onSuccess: (data) => {
        notification.success("Page created successfully");
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
          notification.success("You have acquired the edit lock for this page");
        } else if (data && "page" in data && data.page?.lockedById) {
          // Lock acquisition failed because someone else has the lock
          notification.error("This page is being edited by another user");
          // Navigate back
          if (pagePath) {
            router.push(`/${pagePath}`);
          } else {
            router.push("/wiki");
          }
        } else {
          // Generic failure
          notification.error(
            "Could not acquire edit lock. Please try again later."
          );
          // Navigate back
          if (pagePath) {
            router.push(`/${pagePath}`);
          } else {
            router.push("/wiki");
          }
        }
      },
      onError: (error) => {
        notification.error(`Failed to acquire edit lock: ${error.message}`);
        // If we can't get the lock, go back to the page
        if (pagePath) {
          router.push(`/${pagePath}`);
        } else {
          router.push("/wiki");
        }
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
        if (pagePath) {
          router.push(`/${pagePath}`);
        } else {
          router.push("/wiki");
        }
      },
    })
  );

  // Acquire lock on component mount (only in edit mode)
  useEffect(() => {
    if (mode === "edit" && pageId) {
      acquireLockMutation.mutate({ id: pageId });

      // Release lock when component unmounts
      return () => {
        if (isLocked && pageId) {
          releaseLockMutation.mutate({ id: pageId });
        }
      };
    }
  }, [mode, pageId]);

  // Add lock refresh interval (only in edit mode)
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

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
  }, [mode, isLocked, pageId, refreshLockMutation]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    // Release the lock if in edit mode
    if (mode === "edit" && isLocked && pageId) {
      releaseLockMutation.mutate(
        {
          id: pageId,
        },
        {
          onSuccess: () => {
            // Refresh router data and then navigate back
            router.refresh();
            if (pagePath) {
              router.push(`/${pagePath}`);
            } else {
              router.push("/wiki");
            }
          },
        }
      );
    } else {
      // If no lock to release, just navigate back
      if (pagePath) {
        router.push(`/${pagePath}`);
      } else {
        router.push("/wiki");
      }
    }
  };

  // If we're waiting for lock acquisition in edit mode, show loading
  if (mode === "edit" && acquireLockMutation.isPending) {
    return (
      <div className="flex justify-center p-10">Acquiring edit lock...</div>
    );
  }

  // Upload image to server
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      if (pageId) {
        formData.append("pageId", pageId.toString());
      }

      // Upload to server
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      if (data.success && data.asset) {
        // Insert markdown for image at cursor position
        const imageMarkdown = `![${data.asset.fileName}](/api/assets/${data.asset.id})`;

        // Insert at current cursor position or append to content
        setContent((current) => current + "\n" + imageMarkdown + "\n");

        notification.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      notification.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void handleImageUpload(files[0]);
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedImage = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/")
    );
    if (pastedImage) {
      const file = pastedImage.getAsFile();
      if (file) {
        handleImageUpload(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Render markdown preview
  const renderMarkdown = () => {
    return (
      <MarkdownProse className="px-6 py-4">
        <HighlightedMarkdown content={content} />
      </MarkdownProse>
    );
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

    // Close the asset manager
    setShowAssetManager(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 border-b bg-card border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium truncate text-text-primary">
              {title || "Untitled"}
            </h2>
            {mode === "edit" && isLocked && (
              <span className="px-2 py-1 text-xs font-medium rounded-full text-success-50 bg-success-500">
                Editing
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {pagePath && `Path: ${pagePath}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="soft"
              color="primary"
              onClick={triggerFileUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>

            <Button
              size="sm"
              variant="soft"
              color="accent"
              onClick={() => setShowAssetManager(true)}
            >
              Asset Manager
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            <Button
              size="sm"
              variant="ghost"
              color="secondary"
              onClick={() => setShowMetaModal(true)}
            >
              Edit Metadata
            </Button>

            <Button
              size="sm"
              variant="outlined"
              color="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>

            <div className="h-6 mx-1 border-l border-border"></div>

            <Button
              size="sm"
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              variant="solid"
              color="success"
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="min-w-20"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Editor and Preview Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div
          className={`${
            showPreview ? "w-1/2" : "w-full"
          } h-full flex flex-col overflow-hidden border-r border-border`}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b shadow-md bg-background-level1 border-border">
            <span className="text-xs font-medium text-text-secondary">
              Editing in Markdown
            </span>
            <div className="flex items-center gap-2">
              {isUploading && (
                <span className="text-xs font-medium text-warning-500">
                  Uploading image...
                </span>
              )}
            </div>
          </div>

          {/* CodeMirror editor */}
          {extensionsLoaded ? (
            <CodeMirror
              ref={editorRef}
              value={content}
              height="100%"
              width="100%"
              extensions={editorExtensions}
              onChange={(value) => setContent(value)}
              className="h-full overflow-hidden"
              placeholder="Write your content using Markdown... Use the 'Upload Image' button to add images"
              theme={darkTheme}
              onPaste={handlePaste}
              onDrop={handleDrop}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-code-lighter">
              <div className="flex flex-col items-center gap-2 p-4">
                <svg
                  className="w-6 h-6 animate-spin text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium text-text-primary">
                  Loading editor...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 h-full overflow-auto bg-background-level1">
            {/* Preview header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b shadow-md bg-background-level1 border-border">
              <span className="text-xs font-medium text-text-secondary">
                Preview
              </span>
            </div>
            <div className="overflow-auto">{renderMarkdown()}</div>
          </div>
        )}
      </div>

      {/* Asset Manager Modal */}
      <AssetManager
        isOpen={showAssetManager}
        onClose={() => setShowAssetManager(false)}
        onAssetSelect={handleAssetSelect}
        pageId={pageId}
      />

      {/* Metadata Modal */}
      {showMetaModal && (
        <Modal
          onClose={() => setShowMetaModal(false)}
          size="lg"
          backgroundClass="bg-card dark:bg-card"
          closeOnEscape={true}
          showCloseButton={true}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Edit Document Metadata
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block mb-1 text-sm font-medium text-text-primary"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary border-input"
                  placeholder="Page title"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block mb-1 text-sm font-medium text-text-primary"
                >
                  Tags
                </label>
                <div className="flex items-center">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary border-input"
                    placeholder="Add a tag and press Enter"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="soft"
                    color="accent"
                    size="sm"
                    className="ml-2"
                  >
                    Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center px-2 py-1 text-sm rounded-full bg-primary-100 text-primary-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-primary-400 hover:text-primary-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => setShowMetaModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="solid"
                color="primary"
                onClick={() => setShowMetaModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
