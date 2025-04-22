"use client";

import { signOut } from "next-auth/react";
import { Button } from "@repo/ui";

export function LogOutButton() {
  return (
    <Button onClick={() => signOut()} variant="outlined_simple" color="error">
      Log Out
    </Button>
  );
}
