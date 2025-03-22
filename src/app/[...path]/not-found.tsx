import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";

export default function WikiNotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="text-5xl font-bold text-muted-foreground mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Wiki Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          The wiki page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <div className="space-x-4">
          <Link
            href="/wiki"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Browse All Pages
          </Link>
          <Link
            href="/wiki/create"
            className="px-4 py-2 border border-input rounded-md text-sm"
          >
            Create This Page
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
