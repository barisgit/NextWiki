import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ReactNode } from 'react';

interface WikiPageProps {
  title: string;
  content: ReactNode;
  createdBy?: { name: string; id: number };
  updatedBy?: { name: string; id: number };
  createdAt: Date;
  updatedAt: Date;
  tags?: { id: number; name: string }[];
  path: string;
}

export function WikiPage({
  title,
  content,
  createdBy,
  updatedBy,
  createdAt,
  updatedAt,
  tags = [],
  path,
}: WikiPageProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b pb-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/wiki${path}?edit=true`} 
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </Link>
            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
            {updatedBy ? ` by ${updatedBy.name}` : ''}
          </div>
          <div>
            Created {formatDistanceToNow(createdAt, { addSuffix: true })}
            {createdBy ? ` by ${createdBy.name}` : ''}
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
      
      <div>
        {content}
      </div>
    </div>
  );
} 