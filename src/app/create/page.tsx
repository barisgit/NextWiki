import { MainLayout } from "~/components/layout/MainLayout";
import { WikiEditor } from "~/components/wiki/WikiEditor";

export default function CreateWikiPage() {
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
          <WikiEditor mode="create" />
        </div>
      </div>
    </MainLayout>
  );
}
