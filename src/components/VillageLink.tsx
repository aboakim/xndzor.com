import { Link } from "@/i18n/navigation";
import { localizedPlaceName } from "@/lib/places";

export type VillageRef = {
  slug: string;
  nameHy: string;
  nameEn: string;
  nameRu: string;
  lat?: number | null;
  lng?: number | null;
};

export function IconMapPin({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="ag-icon"
    >
      <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/**
 * Village name rendered as a link to its map page. Used inside list rows, so it stays
 * on top of the row-wide "stretched" link via `.village-link { position: relative }`.
 */
export function VillageLink({
  village,
  locale,
  label,
}: {
  village: VillageRef;
  locale: string;
  label?: string;
}) {
  return (
    <Link
      href={`/villages/${village.slug}`}
      className="village-link"
      title={label ?? localizedPlaceName(village, locale)}
    >
      <IconMapPin />
      <span>{localizedPlaceName(village, locale)}</span>
    </Link>
  );
}
