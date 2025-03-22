import Link from 'next/link';
import { MainLayout } from '~/components/layout/MainLayout';

export default function TagsPage() {
  // This would be fetched from your API in a real implementation
  const tags = [
    { id: 1, name: 'guide', count: 2 },
    { id: 2, name: 'beginner', count: 3 },
    { id: 3, name: 'api', count: 1 },
    { id: 4, name: 'reference', count: 2 },
    { id: 5, name: 'setup', count: 1 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Browse wiki pages by tags.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.name}`}
              className="block border rounded-lg p-4 hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{tag.name}</span>
                <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded-full">
                  {tag.count} {tag.count === 1 ? 'page' : 'pages'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 