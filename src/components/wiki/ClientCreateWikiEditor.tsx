'use client';

import { useRouter } from 'next/navigation';
import { WikiEditor } from './WikiEditor';

export function ClientCreateWikiEditor() {
  const router = useRouter();

  const handleSave = (data: { title: string; content: string; tags: string[] }) => {
    console.log('Creating new page:', data);
    // In a real implementation, this would send data to the server to create the page
    // and then redirect to the newly created page
    
    // For demonstration, we'll just redirect back to the wiki homepage
    router.push('/wiki');
  };

  const handleCancel = () => {
    // Navigate back to wiki pages list
    router.push('/wiki');
  };

  return (
    <WikiEditor 
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
} 