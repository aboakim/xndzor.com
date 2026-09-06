import { Link } from "@/i18n/navigation";
import { ActionIcon } from "@/components/AgIcons";

type PromoBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  badge?: string;
  variant?: "grow" | "passport" | "pricing";
};

/** Full-width farm-themed promo slot (grow spotlight / passport / pricing). */
export function PromoBanner({
  eyebrow,
  title,
  description,
  ctaLabel,
  href,
  badge,
  variant = "grow",
}: PromoBannerProps) {
  return (
    <div className={`promo-banner promo-banner-${variant}`}>
      <div className="promo-banner-icon" aria-hidden>
        <ActionIcon
          action={variant === "passport" ? "plot" : variant === "pricing" ? "groupBuy" : "grow"}
          size={36}
        />
      </div>
      <div className="promo-banner-copy">
        <p className="promo-banner-eyebrow">
          {eyebrow}
          {badge ? <span className="promo-banner-badge">{badge}</span> : null}
        </p>
        <strong className="promo-banner-title">{title}</strong>
        <p className="promo-banner-desc">{description}</p>
      </div>
      <Link href={href} className="promo-banner-cta">
        {ctaLabel} →
      </Link>
    </div>
  );
}
