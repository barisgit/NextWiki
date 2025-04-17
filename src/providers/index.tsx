"use client";

import { ReactNode } from "react";
import { TRPCClientProvider } from "~/lib/trpc/providers";
import { ThemeProvider } from "~/providers/theme-provider";
import { ModalProvider } from "~/components/ui/modal-provider";
import { PermissionProvider } from "~/lib/hooks/usePermissions";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <TRPCClientProvider>
        <PermissionProvider>
          <ModalProvider>
            {children}
            <Toaster
              position="top-center"
              closeButton
              expand
              visibleToasts={3}
              richColors
              toastOptions={{
                duration: 3000,
                style: {
                  border: "0px",
                },
              }}
            />
          </ModalProvider>
        </PermissionProvider>
      </TRPCClientProvider>
    </ThemeProvider>
  );
}
