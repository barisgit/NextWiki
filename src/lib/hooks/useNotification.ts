import { toast } from "sonner";

type NotificationType = "default" | "success" | "error" | "warning" | "info";

export function useNotification() {
  const defaultOptions = {
    position: "top-center" as const,
    closeButton: true,
    duration: 4000,
  };

  const success = (message: string | React.ReactNode, options?: any) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const error = (message: string | React.ReactNode, options?: any) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const warning = (message: string | React.ReactNode, options?: any) => {
    return toast(message, {
      ...defaultOptions,
      icon: "⚠️",
      ...options,
    });
  };

  const info = (message: string | React.ReactNode, options?: any) => {
    return toast.info(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const loading = (message: string | React.ReactNode, options?: any) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss: toast.dismiss,
  };
}
