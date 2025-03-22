import { MainLayout } from '~/components/layout/MainLayout';
import { WikiPageList } from '~/components/wiki/WikiPageList';

export default function WikiPagesPage() {
  // This would be fetched from your API in a real implementation
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
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Wiki Pages</h1>
          <a 
            href="/wiki/create" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Page
          </a>
        </div>
        
        <WikiPageList pages={mockPages} />
      </div>
    </MainLayout>
  );
} 