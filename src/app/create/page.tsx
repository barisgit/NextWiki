"use client";

import { WikiEditor } from "~/components/wiki/WikiEditor";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PageLocationEditor } from "~/components/wiki/PageLocationEditor";
import { useRouter } from "next/navigation";
import { ClientPermissionGate } from "~/components/auth/permission/client";
import { BackButton } from "~/components/wiki/BackButton";

export default function CreateWikiPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [pagePath, setPagePath] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if path was provided in URL (from the location editor)
  useEffect(() => {
    const pathParam = searchParams.get("path");
    if (pathParam) {
      setPagePath(decodeURIComponent(pathParam));
      setShowEditor(true);
    }
  }, [searchParams]);

  // // Render editor if path is set
  // if (showEditor && pagePath) {
  //   return <WikiEditor mode="create" pagePath={pagePath.toLowerCase()} />;
  // }

  // Otherwise show the location picker
  return (
    <ClientPermissionGate permission="wiki:page:create">
      <ClientPermissionGate.Authorized>
        <WikiEditor mode="create" pagePath={pagePath.toLowerCase()} />
        <PageLocationEditor
          mode="create"
          isOpen={!(showEditor && pagePath)}
          onClose={() => {
            router.back();
          }}
        />
      </ClientPermissionGate.Authorized>
      <ClientPermissionGate.Unauthorized>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-text-secondary">
            You do not have permission to create pages
          </p>
          <BackButton variant="outlined" />
        </div>
      </ClientPermissionGate.Unauthorized>
      <ClientPermissionGate.NotLoggedIn>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-text-secondary">
            You must be logged in to create pages
          </p>
          <BackButton variant="outlined" />
        </div>
      </ClientPermissionGate.NotLoggedIn>
    </ClientPermissionGate>
  );
}
