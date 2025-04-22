"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClientRequirePermission } from "~/components/auth/permission/client";
import { Button } from "@repo/ui";

export const CreatePageButton = () => {
  const pathname = usePathname();

  return (
    <ClientRequirePermission permission="wiki:page:create">
      <Link href={`/create?path=${pathname.replace("/", "")}`}>
        <Button>Create This Page</Button>
      </Link>
    </ClientRequirePermission>
  );
};
