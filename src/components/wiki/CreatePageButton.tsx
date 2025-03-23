"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const CreatePageButton = () => {
  const pathname = usePathname();

  return (
    <Link
      href={`/create?path=${pathname.replace("/", "")}`}
      className="px-4 py-2 text-sm border rounded-md border-input"
    >
      Create This Page
    </Link>
  );
};
