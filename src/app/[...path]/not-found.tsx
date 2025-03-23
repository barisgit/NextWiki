import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { CreatePageButton } from "~/components/wiki/CreatePageButton";

export default function WikiNotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 text-5xl font-bold text-muted-foreground">404</div>
        <h1 className="mb-2 text-2xl font-bold">Wiki Page Not Found</h1>
        <p className="max-w-md mb-8 text-muted-foreground">
          The wiki page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <div className="space-x-4">
          <Link
            href="/wiki"
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground"
          >
            Browse All Pages
          </Link>
          <CreatePageButton />
        </div>
      </div>
    </MainLayout>
  );
}
