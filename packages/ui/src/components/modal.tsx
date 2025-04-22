"use client";

import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils";
import { X } from "lucide-react";
import { useScrollLock } from "../hooks/useScrollLock";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  backgroundClass?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  position?: "center" | "top" | "bottom";
  animation?: "fade" | "slide" | "scale" | "none";
}

const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  backgroundClass = "bg-background-paper",
  size = "md",
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  position = "center",
  animation = "fade",
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
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-3xl",
    full: "max-w-[95vw] md:max-w-[90vw]",
  };

  const positionClasses = {
    center: "items-center",
    top: "items-start pt-20",
    bottom: "items-end pb-20",
  };

  const animationClasses = {
    fade: "animate-fadeIn",
    slide: "animate-slideInUp",
    scale: "animate-scaleIn",
    none: "",
  };

  return typeof window === "undefined"
    ? null
    : createPortal(
        <div
          className={cn(
            "fixed inset-0 z-[60] flex min-h-screen justify-center bg-black/40 backdrop-blur-sm transition-opacity",
            positionClasses[position],
            overlayClassName
          )}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className={cn(
              "border-border-default relative max-h-[90vh] overflow-y-auto rounded-lg border shadow-xl",
              backgroundClass,
              sizeClasses[size],
              "p-5",
              animationClasses[animation],
              className
            )}
          >
            {showCloseButton && (
              <button
                className="bg-background-level1 text-text-secondary hover:bg-background-level2 hover:text-text-primary absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </div>
        </div>,
        document.body
      );
};

export { Modal };
