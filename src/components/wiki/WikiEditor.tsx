"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { trpc } from "~/lib/trpc/client";
import { toast } from "sonner";

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
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [path, setPath] = useState(pagePath);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Create page mutation
  const createPageMutation = trpc.wiki.create.useMutation({
    onSuccess: (data) => {
      toast.success("Page created successfully");
      // Navigate to new page
      router.push(`/${data.path}`);
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`Failed to create page: ${error.message}`);
    },
  });

  // Update page mutation
  const updatePageMutation = trpc.wiki.update.useMutation({
    onSuccess: () => {
      toast.success("Page updated successfully");
      if (pagePath) {
        router.push(`/${pagePath}`);
      } else {
        router.push("/wiki");
      }
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`Failed to update page: ${error.message}`);
    },
  });

  // Lock management (only for edit mode)
  const acquireLockMutation = trpc.wiki.acquireLock.useMutation({
    onSuccess: () => {
      setIsLocked(true);
      // Start a refresh interval
      startLockRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
      // If we can't get the lock, go back to the page
      if (pagePath) {
        router.push(`/${pagePath}`);
      } else {
        router.push("/wiki");
      }
    },
  });

  const releaseLockMutation = trpc.wiki.releaseLock.useMutation();

  const refreshLockMutation = trpc.wiki.refreshLock.useMutation({
    onError: (error) => {
      toast.error(`Lost lock: ${error.message}`);
      if (pagePath) {
        router.push(`/${pagePath}`);
      } else {
        router.push("/wiki");
      }
    },
  });

  // Start lock refresh interval
  const startLockRefresh = () => {
    const intervalId = setInterval(() => {
      if (pageId) {
        refreshLockMutation.mutate({ id: pageId });
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  };

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
        path: path || "root",
        isPublished: true,
      });
    } else if (mode === "edit" && pageId) {
      updatePageMutation.mutate({
        id: pageId,
        path: pagePath || path,
        title,
        content,
        isPublished: true,
      });
    }
  };

  const handleCancel = () => {
    // Release the lock if in edit mode
    if (mode === "edit" && isLocked && pageId) {
      releaseLockMutation.mutate({ id: pageId });
    }

    // Navigate back
    if (pagePath) {
      router.push(`/${pagePath}`);
    } else {
      router.push("/wiki");
    }
  };

  // If we're waiting for lock acquisition in edit mode, show loading
  if (mode === "edit" && acquireLockMutation.isPending) {
    return (
      <div className="flex justify-center p-10">Acquiring edit lock...</div>
    );
  }

  return (
    <div>
      {mode === "edit" && isLocked && (
        <div className="px-4 py-2 mb-4 text-green-700 border border-green-200 rounded bg-green-50">
          You are currently editing this page. The lock will automatically
          refresh while you&apos;re editing.
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div>
          <label htmlFor="title" className="block mb-1 text-sm font-medium">
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
          <label htmlFor="path" className="block mb-1 text-sm font-medium">
            Path
          </label>
          <input
            id="path"
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., docs/getting-started"
            required
            disabled={mode === "edit"}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The URL path where this page will be accessible
          </p>
        </div>

        <div>
          <label htmlFor="content" className="block mb-1 text-sm font-medium">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[300px] font-mono"
            placeholder="Write your content using Markdown..."
            required
          />
        </div>

        <div>
          <label htmlFor="tags" className="block mb-1 text-sm font-medium">
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
              className="px-3 py-2 ml-2 rounded-md bg-secondary text-secondary-foreground"
            >
              Add
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center px-2 py-1 text-sm rounded-full bg-muted"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
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

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm border rounded-md border-input"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground"
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
      </form>
    </div>
  );
}
