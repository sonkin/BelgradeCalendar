export type ListViewMode = 'full' | 'compact' | 'monthly';

function viewModeKey(userId: string): string {
  return `belca_list_view_mode:${userId}`;
}

function monthKey(userId: string): string {
  return `belca_list_month_key:${userId}`;
}

function isListViewMode(raw: string | null): raw is ListViewMode {
  return raw === 'full' || raw === 'compact' || raw === 'monthly';
}

export function readListViewMode(userId: string | null): ListViewMode {
  if (!userId) {
    return 'full';
  }
  try {
    const raw = localStorage.getItem(viewModeKey(userId));
    if (isListViewMode(raw)) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return 'full';
}

export function writeListViewMode(userId: string, mode: ListViewMode): void {
  try {
    localStorage.setItem(viewModeKey(userId), mode);
  } catch {
    /* ignore */
  }
}

export function readSelectedMonthKey(userId: string | null, fallback: string): string {
  if (!userId) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(monthKey(userId));
    if (raw) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeSelectedMonthKey(userId: string, monthKeyValue: string): void {
  try {
    localStorage.setItem(monthKey(userId), monthKeyValue);
  } catch {
    /* ignore */
  }
}
