import { MainLayout } from '~/components/layout/MainLayout';
import { WikiPageList } from '~/components/wiki/WikiPageList';

export default function TagPage({ params }: { params: { tag: string } }) {
  const { tag } = params;
  
  // This would be fetched from your API in a real implementation
  // Here we're just filtering mock data based on the tag
  const mockPages = [
    {
      id: 1,
      title: 'Getting Started',
      path: '/getting-started',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      updatedBy: { name: 'John Doe', id: 1 },
      tags: [
        { id: 1, name: 'guide' },
        { id: 2, name: 'beginner' },
      ],
    },
    {
      id: 2,
      title: 'API Documentation',
      path: '/api-documentation',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      updatedBy: { name: 'Jane Smith', id: 2 },
      tags: [
        { id: 3, name: 'api' },
        { id: 4, name: 'reference' },
      ],
    },
    {
      id: 3,
      title: 'Installation Guide',
      path: '/installation',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      updatedBy: { name: 'John Doe', id: 1 },
      tags: [
        { id: 2, name: 'beginner' },
        { id: 5, name: 'setup' },
      ],
    },
    {
      id: 4,
      title: 'Markdown Reference',
      path: '/markdown-reference',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      updatedBy: { name: 'Jane Smith', id: 2 },
      tags: [
        { id: 4, name: 'reference' },
      ],
    },
  ];

  const filteredPages = mockPages.filter(
    (page) => page.tags.some((pageTag) => pageTag.name === tag)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              Pages tagged: 
              <span className="ml-2 px-3 py-1 bg-muted rounded-full text-sm">
                {tag}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Found {filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'} with this tag.
            </p>
          </div>
        </div>
        
        <WikiPageList pages={filteredPages} />
      </div>
    </MainLayout>
  );
} 