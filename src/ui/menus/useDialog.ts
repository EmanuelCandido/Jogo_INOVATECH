import { useEffect, useRef } from 'react';

export function useDialog(close: () => void) {
  const panel = useRef<HTMLElement>(null);
  const restoreFocus = useRef(document.activeElement as HTMLElement | null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const previous = restoreFocus.current;
    const element = panel.current;
    element?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (!element || element.closest('[inert]') || event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose.current(); }
      if (event.key !== 'Tab' || !element) return;
      const scope=element.querySelector('[role="alertdialog"]')??element;
      const controls = [...scope.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')].filter(item => item.getClientRects().length && !item.closest('[inert]'));
      const first=controls[0], last=controls.at(-1);
      if (!first) { event.preventDefault(); element.focus(); }
      else if (!scope.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey?last:first)?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    // A claim can disable the focused button and move focus to the document.
    // Escape and the focus trap must still belong to the visible dialog.
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      requestAnimationFrame(() => { if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true }); });
    };
  }, []);
  return panel;
}
