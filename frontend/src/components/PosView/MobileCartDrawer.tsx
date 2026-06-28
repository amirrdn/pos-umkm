import { useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/pos/useFocusTrap';
import { useBodyScrollLock } from '../../hooks/pos/useBodyScrollLock';

interface MobileCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileCartDrawer({ isOpen, onClose, children }: MobileCartDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, { isActive: isOpen, onEscape: onClose });
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]"
      >
        {children}
      </div>
    </div>
  );
}
