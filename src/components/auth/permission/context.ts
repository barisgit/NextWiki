"use client";

import { createContext, useContext } from "react";

export interface PermissionContextValue {
  isLoggedIn: boolean;
  isAuthorized: boolean;
  isGuest: boolean;
  publicPaths?: string[];
}

export const PermissionContext = createContext<
  PermissionContextValue | undefined
>(undefined);

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error(
      "usePermissionContext must be used within a Permission.Root component"
    );
  }
  return context;
}
