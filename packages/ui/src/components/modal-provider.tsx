"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Modal } from "./modal";

interface ModalContextType {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
}

interface ModalOptions {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  onClose?: () => void;
  backgroundClass?: string;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});

  const openModal = (content: ReactNode, options: ModalOptions = {}) => {
    setModalContent(content);
    setModalOptions(options);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    if (modalOptions.onClose) {
      modalOptions.onClose();
    }
    // Clear content after animation would finish
    setTimeout(() => setModalContent(null), 300);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && modalContent && (
        <Modal
          onClose={closeModal}
          size={modalOptions.size}
          backgroundClass={modalOptions.backgroundClass}
          closeOnEscape={modalOptions.closeOnEscape}
          showCloseButton={modalOptions.showCloseButton}
          className={modalOptions.className}
          overlayClassName={modalOptions.overlayClassName}
        >
          {modalContent}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
