import { useEffect } from 'react';

export interface PosKeyboardHandlers {
  onFocusSearch: () => void;
  onCloseCart: () => void;
  onOpenCart: () => void;
  onCheckout: () => void;
  onIncrementLastItem: () => void;
  onDecrementLastItem: () => void;
}

export function usePosKeyboard(handlers: PosKeyboardHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      if (event.key === 'Escape') {
        handlers.onCloseCart();
        return;
      }

      if (isTyping) return;

      if (event.key === 'F2') {
        event.preventDefault();
        handlers.onOpenCart();
      } else if (event.key === 'F9') {
        event.preventDefault();
        handlers.onCheckout();
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handlers.onIncrementLastItem();
      } else if (event.key === '-') {
        event.preventDefault();
        handlers.onDecrementLastItem();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers]);
}
