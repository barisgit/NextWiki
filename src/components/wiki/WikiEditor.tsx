"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { trpc } from "~/lib/trpc/client";
import { useNotification } from "~/lib/hooks/useNotification";
import { MarkdownProse } from "./MarkdownProse";
import dynamic from "next/dynamic";
import { HighlightedMarkdown } from "./HighlightedMarkdown";
import Modal from "~/components/ui/modal";
import { Extension } from "@codemirror/state";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";

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
  // Using any[] for editor extensions since we don't have the proper type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorExtensions, setEditorExtensions] = useState<Extension[]>([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const [darkTheme, setDarkTheme] =
    useState<ReactCodeMirrorProps["theme"]>(undefined);

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
  const createPageMutation = trpc.wiki.create.useMutation({
    onSuccess: (data) => {
      notification.success("Page created successfully");
      // Navigate to new page
      router.push(`/${data.path}`);
    },
    onError: (error) => {
      setIsSaving(false);
      notification.error(`Failed to create page: ${error.message}`);
    },
  });

  // Update page mutation
  const updatePageMutation = trpc.wiki.update.useMutation({
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
  });

  // Lock management (only for edit mode)
  const acquireLockMutation = trpc.wiki.acquireLock.useMutation({
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
  });

  const releaseLockMutation = trpc.wiki.releaseLock.useMutation({
    onSuccess: () => {
      notification.success("Lock released successfully");
    },
  });

  // Add refresh lock mutation
  const refreshLockMutation = trpc.wiki.refreshLock.useMutation({
    onError: (error) => {
      notification.error(`Lock expired: ${error.message}`);
      // Lock expired, go back to the wiki page
      if (pagePath) {
        router.push(`/${pagePath}`);
      } else {
        router.push("/wiki");
      }
    },
  });

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
  }, [mode, isLocked, pageId]);

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

  // Function to render markdown preview
  const renderMarkdown = () => {
    return (
      <MarkdownProse className="px-6 py-4">
        <HighlightedMarkdown content={content} />
      </MarkdownProse>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 flex items-center justify-between w-full px-4 border-b shadow-sm h-14 bg-slate-50 border-border">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-medium truncate text-slate-800">
            {title || "Untitled"}
          </h2>
          {mode === "edit" && isLocked && (
            <span className="px-2 py-1 ml-2 text-xs font-medium text-green-800 bg-green-100 rounded-full">
              Editing
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowMetaModal(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
          >
            Edit Metadata
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
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
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* Editor and preview area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor side */}
        <div
          className={`${
            showPreview ? "w-1/2" : "w-full"
          } h-full flex flex-col overflow-hidden border-r border-slate-200`}
        >
          {/* Small info bar above editor */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 border-slate-200">
            <span className="text-xs font-medium text-slate-500">
              Editing in Markdown
            </span>
            <span className="text-xs text-slate-400">{title}</span>
          </div>

          {/* CodeMirror editor */}
          {extensionsLoaded ? (
            <CodeMirror
              value={content}
              height="100%"
              width="100%"
              extensions={editorExtensions}
              onChange={(value) => setContent(value)}
              className="h-full overflow-hidden"
              placeholder="Write your content using Markdown..."
              theme={darkTheme}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              Loading editor...
            </div>
          )}
        </div>

        {/* Preview side */}
        {showPreview && (
          <div className="w-1/2 h-full overflow-auto bg-white">
            {/* Preview header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b bg-slate-50 border-slate-200">
              <span className="text-xs font-medium text-slate-500">
                Preview
              </span>
            </div>
            {renderMarkdown()}
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      {showMetaModal && (
        <Modal
          onClose={() => setShowMetaModal(false)}
          size="lg"
          backgroundClass="bg-white"
          closeOnEscape={true}
          showCloseButton={true}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Edit Document Metadata
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Page title"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="block mb-1 text-sm font-medium text-slate-700"
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
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 ml-2 transition-colors rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center px-2 py-1 text-sm text-blue-700 rounded-full bg-blue-50"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-400 hover:text-blue-600"
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMetaModal(false)}
                className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-slate-800 hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
