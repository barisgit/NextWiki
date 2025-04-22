import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { Button } from "@repo/ui";
import { CreatePageButton } from "~/components/wiki/CreatePageButton";

export default function WikiNotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="mb-4 text-5xl font-bold text-text-secondary">404</div>
        <h1 className="mb-2 text-2xl font-bold">Wiki Page Not Found</h1>
        <p className="max-w-md mb-8 text-text-secondary">
          The wiki page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <div className="space-x-4">
          <Link href="/wiki">
            <Button variant="outlined">Browse All Pages</Button>
          </Link>
          <CreatePageButton />
        </div>
      </div>
    </MainLayout>
  );
}
