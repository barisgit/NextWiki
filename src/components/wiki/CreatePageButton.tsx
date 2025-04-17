"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequirePermission } from "~/lib/hooks/usePermissions";
import { Button } from "../ui/button";

export const CreatePageButton = () => {
  const pathname = usePathname();

  return (
    <RequirePermission permission="wiki:page:create">
      <Link href={`/create?path=${pathname.replace("/", "")}`}>
        <Button>Create This Page</Button>
      </Link>
    </RequirePermission>
  );
};
