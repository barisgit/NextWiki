"use client";

import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "~/lib/utils";
import { X } from "lucide-react";
import { useScrollLock } from "~/hooks/useScrollLock";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  backgroundClass?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  backgroundClass = "bg-background",
  size = "md",
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(true);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    // Check if the click was directly on the overlay
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  };

  return typeof window === "undefined"
    ? null
    : createPortal(
        <div
          className={cn(
            "fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-black/50 backdrop-blur-sm",
            overlayClassName
          )}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className={cn(
              "relative max-h-[85vh] overflow-y-auto rounded-lg border border-border shadow-lg",
              backgroundClass,
              sizeClasses[size],
              "p-6",
              className
            )}
          >
            {showCloseButton && (
              <button
                className="absolute inline-flex items-center justify-center w-8 h-8 border rounded-md right-4 top-4 border-input hover:bg-muted"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {children}
          </div>
        </div>,
        document.body
      );
};

export default Modal;
