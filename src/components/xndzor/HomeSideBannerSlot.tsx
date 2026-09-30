import type { HomeSideBannerConfig } from "@/lib/side-banners";
import { ManagerAmSideAd } from "@/components/xndzor/ManagerAmSideAd";

type Props = {
  side: "left" | "right";
  config: HomeSideBannerConfig;
  label: string;
  sizeLabel: string;
  ariaLabel: string;
  altFallback: string;
};

export function HomeSideBannerSlot({ side, config, label, sizeLabel, ariaLabel, altFallback }: Props) {
  const managerSlot = config.managerAdSlot;
  const hasManagerAd = typeof managerSlot === "number" && managerSlot > 0;
  const hasImage = Boolean(config.imageUrl?.trim());
  const href = config.href?.trim();
  const alt = config.alt?.trim() || altFallback;

  const frame = (
    <div
      className={`home-trust-side-frame${
        hasManagerAd || hasImage ? " home-trust-side-frame--filled" : ""
      }${hasManagerAd ? " home-trust-side-frame--manager" : ""}`}
    >
      {hasManagerAd ? (
        <ManagerAmSideAd slotId={managerSlot} />
      ) : hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- owner-supplied ad URLs (any host)
        <img src={config.imageUrl.trim()} alt={alt} width={300} height={250} loading="lazy" decoding="async" />
      ) : (
        <div className="home-trust-side-placeholder" aria-hidden>
          <span className="home-trust-side-placeholder-label">{label}</span>
          <span className="home-trust-side-placeholder-size">{sizeLabel}</span>
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`home-trust-side-slot home-trust-side-slot--${side}`}
      aria-label={ariaLabel}
      data-side={side}
      {...(hasManagerAd ? { "data-manager-ad-slot": String(managerSlot) } : {})}
    >
      {hasImage && href ? (
        <a
          href={href}
          className="home-trust-side-link"
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          {frame}
        </a>
      ) : (
        frame
      )}
    </aside>
  );
}
