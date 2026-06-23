import { useEffect, useRef } from 'react';

export interface PosKeyboardHandlers {
  onFocusSearch: () => void;
  onCloseCart: () => void;
  onOpenCart: () => void;
  onCheckout: () => void;
  onIncrementLastItem: () => void;
  onDecrementLastItem: () => void;
}

export function usePosKeyboard(handlers: PosKeyboardHandlers, enabled = true) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

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
        handlersRef.current.onFocusSearch();
        return;
      }

      if (event.key === 'Escape') {
        handlersRef.current.onCloseCart();
        return;
      }

      if (isTyping) return;

      if (event.key === 'F2') {
        event.preventDefault();
        handlersRef.current.onOpenCart();
      } else if (event.key === 'F9') {
        event.preventDefault();
        handlersRef.current.onCheckout();
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handlersRef.current.onIncrementLastItem();
      } else if (event.key === '-') {
        event.preventDefault();
        handlersRef.current.onDecrementLastItem();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
