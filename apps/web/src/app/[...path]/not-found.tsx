import Link from "next/link";
import { MainLayout } from "~/components/layout/MainLayout";
import { Button } from "@repo/ui";
import { CreatePageButton } from "~/components/wiki/CreatePageButton";

export default function WikiNotFound() {
  return (
    <MainLayout>
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="text-text-secondary mb-4 text-5xl font-bold">404</div>
        <h1 className="mb-2 text-2xl font-bold">Wiki Page Not Found</h1>
        <p className="text-text-secondary mb-8 max-w-md">
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
