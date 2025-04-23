"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLocationEditor } from "./PageLocationEditor";

interface MovePageWrapperProps {
  pageId: number;
  pageTitle: string;
  pagePath: string;
}

export function MovePageWrapper({
  pageId,
  pageTitle,
  pagePath,
}: MovePageWrapperProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push(`/${pagePath}`);
  };

  const initialPath = pagePath.split("/").slice(0, -1).join("/");
  const initialName = pagePath.split("/").pop() || "";

  return (
    <PageLocationEditor
      mode="move"
      isOpen={isOpen}
      onClose={handleClose}
      initialPath={initialPath}
      initialName={initialName}
      pageId={pageId}
      pageTitle={pageTitle}
    />
  );
}
