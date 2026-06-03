import { useLayoutEffect } from 'react';

const LIST_SCROLL_KEY = 'belca_list_scroll';

function getScrollY(): number {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function scrollToY(y: number): void {
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

/** Вызывать при уходе со списка (клик по событию / «создать»). */
export function saveListScrollPosition(): void {
  const y = Math.max(0, Math.round(getScrollY()));
  sessionStorage.setItem(LIST_SCROLL_KEY, String(y));
}

function readSavedScrollY(): number {
  const raw = sessionStorage.getItem(LIST_SCROLL_KEY);
  if (raw === null) return 0;

  const y = Number(raw);
  return Number.isFinite(y) && y >= 0 ? y : 0;
}

export function useListScrollRestoration(contentReady: boolean, restoreKey: string): void {
  useLayoutEffect(() => {
    if (!contentReady) return;

    const y = readSavedScrollY();
    const restore = () => scrollToY(y);

    restore();
    requestAnimationFrame(restore);

    const timeoutId = window.setTimeout(restore, 50);
    const retryId = window.setTimeout(restore, 150);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(retryId);
    };
  }, [contentReady, restoreKey]);
}
