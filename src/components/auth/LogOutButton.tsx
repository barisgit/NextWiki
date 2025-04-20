"use client";

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export function LogOutButton() {
  return (
    <Button onClick={() => signOut()} variant="outlined_simple" color="error">
      Log Out
    </Button>
  );
}
