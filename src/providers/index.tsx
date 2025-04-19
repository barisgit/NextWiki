"use client";

import { ReactNode } from "react";
import { TRPCClientProvider } from "~/lib/trpc/providers";
import { ThemeProvider } from "~/providers/theme-provider";
import { ModalProvider } from "~/components/ui/modal-provider";
import { PermissionProvider } from "~/lib/hooks/usePermissions";
import { Toaster } from "sonner";
import { useTheme } from "~/providers/theme-provider";

interface ProvidersProps {
  children: ReactNode;
}

// Create an inner component to render the Toaster and use the theme hook
function ToasterWithTheme() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      closeButton
      expand
      visibleToasts={3}
      theme={theme}
      richColors
      toastOptions={{
        duration: 3000,
      }}
    />
  );
}

export function Providers({ children }: ProvidersProps) {
  // Removed useTheme() call from here
  return (
    <ThemeProvider>
      <TRPCClientProvider>
        <PermissionProvider>
          <ModalProvider>
            {children}
            <ToasterWithTheme />
          </ModalProvider>
        </PermissionProvider>
      </TRPCClientProvider>
    </ThemeProvider>
  );
}
