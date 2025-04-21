import { MainLayout } from "~/components/layout/MainLayout";
import { WikiBrowser } from "~/components/wiki/WikiBrowser";

export default function WikiPagesPage() {
  return (
    <MainLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wiki Pages</h1>
        </div>

        <WikiBrowser />
      </div>
    </MainLayout>
  );
}
