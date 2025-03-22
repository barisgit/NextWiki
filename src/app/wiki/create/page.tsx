import { MainLayout } from '~/components/layout/MainLayout';
import { ClientCreateWikiEditor } from '~/components/wiki/ClientCreateWikiEditor';

export default function CreateWikiPage() {
  // In a real implementation, this would handle the form submission
  // and create a new wiki page using an API call or trpc mutation
  const handleSave = (data: { title: string; content: string; tags: string[] }) => {
    console.log('Creating new page:', data);
    // Would redirect to the new page after saving
  };

  const handleCancel = () => {
    // In a real implementation, this would redirect back to the wiki pages list
    console.log('Cancelling page creation');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Wiki Page</h1>
          <p className="text-muted-foreground mt-1">
            Add a new page to your wiki knowledge base.
          </p>
        </div>
        
        <div className="mt-6">
          <ClientCreateWikiEditor />
        </div>
      </div>
    </MainLayout>
  );
} 