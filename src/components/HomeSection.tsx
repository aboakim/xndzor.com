import type { ReactNode } from "react";
import { ActionIcon } from "@/components/AgIcons";
import { PrefetchLink } from "@/components/PrefetchLink";
import { Reveal } from "@/components/Reveal";

/** Home feed block with icon heading, optional centered layout, and see-all link. */
export function HomeSection({
  action,
  title,
  href,
  seeAllLabel,
  count,
  children,
  id,
  centered = false,
  subtitle,
  cue,
}: {
  action: string;
  title: string;
  href: string;
  seeAllLabel: string;
  count?: number;
  children: ReactNode;
  id?: string;
  centered?: boolean;
  subtitle?: string;
  /** Subtle “what next” line under the section head. */
  cue?: string;
}) {
  return (
    <Reveal
      as="section"
      className={`section home-feed-section${centered ? " home-feed-section-centered" : ""}`}
      id={id}
    >
      <div className={`home-feed-head${centered ? " home-feed-head-centered" : ""}`}>
        {centered ? (
          <>
            <span className={`home-feed-icon action-${action}`} aria-hidden>
              <ActionIcon action={action} size={22} />
            </span>
            <div className="home-feed-head-text">
              <h2>
                {title}
                {count ? <span className="home-feed-count">{count}</span> : null}
              </h2>
              {subtitle ? <p className="home-feed-subtitle muted">{subtitle}</p> : null}
            </div>
          </>
        ) : (
          <h2>
            <span className={`home-feed-icon action-${action}`} aria-hidden>
              <ActionIcon action={action} size={20} />
            </span>
            {title}
            {count ? <span className="home-feed-count">{count}</span> : null}
          </h2>
        )}
        <PrefetchLink href={href} className="text-link home-feed-more" pressable>
          {seeAllLabel} →
        </PrefetchLink>
      </div>
      {cue ? <p className="home-section-cue">{cue}</p> : null}
      {children}
    </Reveal>
  );
}
