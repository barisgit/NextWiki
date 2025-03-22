import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { WikiPageList } from "~/components/wiki/WikiPageList";

export default function WikiPagesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Wiki Pages</h1>
          <Link
            href="/create"
            className="flex items-center px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New Page
          </Link>
        </div>

        <WikiPageList />
      </div>
    </MainLayout>
  );
}
