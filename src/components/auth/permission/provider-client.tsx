"use client";

import { ReactNode } from "react";
import { PermissionContext } from "./context";

export interface PermissionProviderProps {
  isLoggedIn: boolean;
  isAuthorized: boolean;
  isGuest: boolean;
  publicPaths?: string[];
  children: ReactNode;
}

/**
 * Client component responsible for providing the Permission context.
 * This is separated from the server component that fetches the data.
 */
export function PermissionProvider({
  isLoggedIn,
  isAuthorized,
  isGuest,
  publicPaths,
  children,
}: PermissionProviderProps) {
  return (
    <PermissionContext.Provider
      value={{ isLoggedIn, isAuthorized, isGuest, publicPaths }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
