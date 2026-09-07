import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Focus management for full-screen views that replace the main page (ticket details, seat selection,
 * checkout). On mount the window scrolls to the top and focus moves to the element carrying the
 * returned ref (the view heading), so keyboard and screen-reader users land on the new context instead
 * of on a detached button. On unmount focus returns to the element that opened the view when it is
 * still in the document. These views are pages, not overlays, so no focus trap and no Escape binding.
 */
export function useScreenEntry<T extends HTMLElement = HTMLHeadingElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.scrollTo({ top: 0, left: 0 });
    const target = ref.current;
    if (target) {
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    return () => {
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  return ref;
}
