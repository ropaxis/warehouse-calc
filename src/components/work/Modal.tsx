"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
};

/** Reusable portal modal. Put any UI, form, or another component inside children. */
export function Modal({
  open,
  onClose,
  children,
  title,
  contentClassName = "max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 text-gray-900 shadow-2xl sm:rounded-2xl",
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title || "Діалогове вікно"}
        className={contentClassName}
      >
        {(title || showCloseButton) && (
          <header className="mb-4 flex items-center justify-between gap-3">
            {title ? <h2 className="text-xl font-bold">{title}</h2> : <span />}
            {showCloseButton && (
              <button type="button" onClick={onClose} aria-label="Закрити модальне вікно" className="shrink-0 rounded-lg border px-3 py-2">
                ✕
              </button>
            )}
          </header>
        )}
        {children}
      </section>
    </div>,
    document.body,
  );
}
