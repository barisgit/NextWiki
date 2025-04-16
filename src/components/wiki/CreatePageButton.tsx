"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequirePermission } from "~/lib/hooks/usePermissions";

export const CreatePageButton = () => {
  const pathname = usePathname();

  return (
    <RequirePermission permission="wiki:page:create">
      <Link
        href={`/create?path=${pathname.replace("/", "")}`}
        className="px-4 py-2 text-sm border rounded-md border-input"
      >
        Create This Page
      </Link>
    </RequirePermission>
  );
};
