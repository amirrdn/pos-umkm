import { useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../../../hooks/pos/useFocusTrap';

interface AccessibleModalLayerProps {
  isOpen: boolean;
  trapFocus: boolean;
  label: string;
  onEscape?: () => void;
  children: ReactNode;
}

export function AccessibleModalLayer({
  isOpen,
  trapFocus,
  label,
  onEscape,
  children,
}: AccessibleModalLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, {
    isActive: isOpen && trapFocus,
    onEscape: trapFocus ? onEscape : undefined,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="contents"
    >
      {children}
    </div>
  );
}
