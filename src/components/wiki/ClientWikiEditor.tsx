'use client';

import { useRouter } from 'next/navigation';
import { WikiEditor } from './WikiEditor';

interface ClientWikiEditorProps {
  initialTitle: string;
  initialContent: string;
  initialTags: string[];
  pagePath: string;
}

export function ClientWikiEditor({
  initialTitle,
  initialContent,
  initialTags,
  pagePath,
}: ClientWikiEditorProps) {
  const router = useRouter();

  const handleSave = (data: { title: string; content: string; tags: string[] }) => {
    console.log('Updating page:', data);
    // In a real implementation, this would send data to the server
    // and redirect to the page view after saving
    
    // Navigate back to the page
    router.push(`/wiki${pagePath}`);
  };

  const handleCancel = () => {
    // Navigate back to the page
    router.push(`/wiki${pagePath}`);
  };

  return (
    <WikiEditor 
      initialTitle={initialTitle}
      initialContent={initialContent}
      initialTags={initialTags}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
} 