import { toast, ToasterProps } from "sonner";

export function useNotification() {
  const defaultOptions = {
    position: "bottom-right" as const,
    closeButton: true,
    duration: 4000,
  };

  const success = (
    message: string | React.ReactNode,
    options?: ToasterProps
  ) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const error = (message: string | React.ReactNode, options?: ToasterProps) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const warning = (
    message: string | React.ReactNode,
    options?: ToasterProps
  ) => {
    return toast(message, {
      ...defaultOptions,
      icon: "⚠️",
      ...options,
    });
  };

  const info = (message: string | React.ReactNode, options?: ToasterProps) => {
    return toast.info(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const loading = (
    message: string | React.ReactNode,
    options?: ToasterProps
  ) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const custom = (
    message: string | React.ReactNode,
    options?: ToasterProps
  ) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const promise = <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string | React.ReactNode;
      success:
        | string
        | React.ReactNode
        | ((data: T) => React.ReactNode | string);
      error:
        | string
        | React.ReactNode
        | ((error: Error) => React.ReactNode | string);
    },
    options?: ToasterProps
  ) => {
    return toast.promise(promise, {
      ...defaultOptions,
      ...messages,
      ...options,
    });
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    custom,
    promise,
    dismiss: toast.dismiss,
  };
}
