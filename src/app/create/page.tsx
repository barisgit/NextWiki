"use client";

import { WikiEditor } from "~/components/wiki/WikiEditor";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { PageLocationEditor } from "~/components/wiki/PageLocationEditor";
import { useRouter } from "next/navigation";

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
    <>
      <WikiEditor mode="create" pagePath={pagePath.toLowerCase()} />
      <PageLocationEditor
        mode="create"
        isOpen={!(showEditor && pagePath)}
        onClose={() => {
          router.back();
        }}
      />
    </>
  );
}
