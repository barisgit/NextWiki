"use client";

import { ReactNode } from "react";
import { TRPCClientProvider } from "~/server/providers";
import { ThemeProvider } from "~/providers/theme-provider";
import { ModalProvider } from "~/components/ui/modal-provider";
import { PermissionProvider } from "~/components/auth/permission/client";
import { Toaster } from "sonner";
import { useTheme } from "~/providers/theme-provider";
import { AuthProvider } from "~/components/auth/AuthProvider";

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
        duration: 5000,
      }}
    />
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TRPCClientProvider>
          <PermissionProvider>
            <ModalProvider>
              {children}
              <ToasterWithTheme />
            </ModalProvider>
          </PermissionProvider>
        </TRPCClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
