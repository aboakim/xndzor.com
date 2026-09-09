import Image from "next/image";

type BrandLogoProps = {
  /** Pixel size for width/height (square). */
  size?: number;
  className?: string;
  /** Decorative marks should hide from AT; keep false when the image is the sole brand label. */
  decorative?: boolean;
  priority?: boolean;
};

/**
 * Shared Xndzor brand mark — light-green bitten-X apple (`/logo-xndzor.png`).
 * Use for chrome/brand surfaces only; keep AgIcons product fruit icons separate.
 */
export function BrandLogo({
  size = 40,
  className,
  decorative = true,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo-xndzor.png"
      alt={decorative ? "" : "Խնձոր"}
      width={size}
      height={size}
      className={className ?? "brand-logo-img"}
      priority={priority}
      aria-hidden={decorative || undefined}
    />
  );
}
