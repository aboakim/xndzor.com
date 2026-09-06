"use client";

import { useEffect } from "react";
import {
  pushRecentView,
  type RecentViewItem,
  type RecentViewKind,
} from "@/lib/recently-viewed";

type Props = {
  id: string;
  href: string;
  title: string;
  kind: RecentViewKind;
  thumb?: string | null;
  subtitle?: string | null;
};

/** Records a listing open into localStorage for the homepage recently-viewed strip. */
export function TrackRecentView({ id, href, title, kind, thumb, subtitle }: Props) {
  useEffect(() => {
    const item: Omit<RecentViewItem, "viewedAt"> = {
      id,
      href,
      title,
      kind,
      thumb: thumb ?? null,
      subtitle: subtitle ?? null,
    };
    pushRecentView(item);
  }, [id, href, title, kind, thumb, subtitle]);

  return null;
}
