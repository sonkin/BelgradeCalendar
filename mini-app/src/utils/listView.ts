export type ListViewMode = 'full' | 'compact' | 'monthly';

const VIEW_MODE_KEY = 'belca_list_view_mode';
const MONTH_KEY = 'belca_list_month_key';

export function readListViewMode(): ListViewMode {
  try {
    const raw = sessionStorage.getItem(VIEW_MODE_KEY);
    if (raw === 'full' || raw === 'compact' || raw === 'monthly') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return 'full';
}

export function writeListViewMode(mode: ListViewMode): void {
  sessionStorage.setItem(VIEW_MODE_KEY, mode);
}

export function readSelectedMonthKey(fallback: string): string {
  try {
    const raw = sessionStorage.getItem(MONTH_KEY);
    if (raw) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeSelectedMonthKey(monthKey: string): void {
  sessionStorage.setItem(MONTH_KEY, monthKey);
}
