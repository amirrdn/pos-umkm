import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../../hooks/pos/useFocusTrap';
import { useBodyScrollLock } from '../../../hooks/pos/useBodyScrollLock';
import { useRef, type ReactNode } from 'react';

interface ModalShellProps {
  isOpen: boolean;
  onClose?: () => void;
  label: string;
  children: ReactNode;
  variant?: 'modal' | 'drawer';
}

export function ModalShell({ isOpen, onClose, label, children, variant = 'modal' }: ModalShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, { isActive: isOpen, onEscape: onClose });
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  if (variant === 'drawer') {
    return createPortal(
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed inset-0 z-50 flex items-center justify-end"
      >
        <button
          type="button"
          aria-label="Tutup panel"
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        />
        <div className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-sm h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4"
    >
      {children}
    </div>,
    document.body
  );
}

export function FocusTrap({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, { isActive: true });

  return <div ref={containerRef} className="contents">{children}</div>;
}
