export type RecentViewKind =
  | "machinery"
  | "animals"
  | "supply"
  | "forward"
  | "demand"
  | "jobs";

export type RecentViewItem = {
  id: string;
  href: string;
  title: string;
  kind: RecentViewKind;
  thumb?: string | null;
  subtitle?: string | null;
  viewedAt: number;
};

export const RECENT_VIEWED_KEY = "xndzor:recent-views:v1";
const MAX_ITEMS = 12;

export function readRecentViews(): RecentViewItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentViewItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.href === "string" && typeof x.id === "string");
  } catch {
    return [];
  }
}

export function pushRecentView(item: Omit<RecentViewItem, "viewedAt"> & { viewedAt?: number }) {
  if (typeof window === "undefined") return;
  try {
    const next: RecentViewItem = {
      ...item,
      viewedAt: item.viewedAt ?? Date.now(),
    };
    const prev = readRecentViews().filter((x) => !(x.id === next.id && x.kind === next.kind));
    const merged = [next, ...prev].slice(0, MAX_ITEMS);
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
}
