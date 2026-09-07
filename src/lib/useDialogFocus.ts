import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** Elements a modal dialog cycles focus through (disabled and hidden ones are filtered at runtime). */
export const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Index to focus when Tab (or Shift+Tab) is pressed inside a dialog with `count` focusable elements
 * and `current` focused (-1 when focus is somewhere else). Returns null when the browser's default
 * move already stays inside the dialog.
 */
export function wrapFocusIndex(count: number, current: number, shiftKey: boolean): number | null {
  if (count === 0) return null;
  if (shiftKey) return current <= 0 ? count - 1 : null;
  return current === -1 || current === count - 1 ? 0 : null;
}

function focusableIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.tabIndex >= 0,
  );
}

/**
 * Focus management for a modal dialog that unmounts when closed: moves focus to the first focusable
 * element on open, keeps Tab / Shift+Tab inside, closes on Escape and returns focus to the element
 * that opened it. Attach the returned ref to the dialog container (give it `tabIndex={-1}` as a
 * fallback focus target). `onClose` is read through a ref so re-renders never reset focus.
 */
export function useDialogFocus<T extends HTMLElement = HTMLDivElement>(isOpen: boolean, onClose: () => void): RefObject<T> {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = ref.current;
    const initial = focusableIn(root)[0] ?? root;
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusableIn(ref.current);
      const current = list.indexOf(document.activeElement as HTMLElement);
      const next = wrapFocusIndex(list.length, current, event.shiftKey);
      if (next !== null) {
        event.preventDefault();
        list[next].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [isOpen]);

  return ref;
}
