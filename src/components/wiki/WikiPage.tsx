import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ReactNode } from "react";
import { WikiLockInfo } from "./WikiLockInfo";

interface WikiPageProps {
  id: number;
  title: string;
  content: ReactNode;
  createdBy?: { name: string; id: number };
  updatedBy?: { name: string; id: number };
  lockedBy?: { name: string; id: number } | null;
  lockedAt?: Date | null;
  lockExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: { id: number; name: string }[];
  path: string;
  currentUserId?: number;
}

export function WikiPage({
  id,
  title,
  content,
  createdBy,
  updatedBy,
  lockedBy,
  lockExpiresAt,
  createdAt,
  updatedAt,
  tags = [],
  path,
  currentUserId,
}: WikiPageProps) {
  // Determine if the page is currently locked
  const isLocked = Boolean(
    lockedBy && lockExpiresAt && new Date(lockExpiresAt) > new Date()
  );

  // Determine if the current user is the lock owner
  const isCurrentUserLockOwner = Boolean(
    currentUserId && lockedBy && lockedBy.id === currentUserId
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 mb-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{title}</h1>

          {/* Lock status and edit controls */}
          <WikiLockInfo
            pageId={id}
            isLocked={isLocked}
            lockedByName={lockedBy?.name || null}
            lockedUntil={lockExpiresAt?.toISOString() || null}
            isCurrentUserLockOwner={isCurrentUserLockOwner}
            editPath={`/${path}?edit=true`}
          />
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
            {updatedBy ? ` by ${updatedBy.name}` : ""}
          </div>
          <div>
            Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            {createdBy ? ` by ${createdBy.name}` : ""}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex items-center mt-3 space-x-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.name}`}
                className="px-2 py-0.5 bg-muted text-xs rounded-full hover:bg-muted/80"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>{content}</div>
    </div>
  );
}
