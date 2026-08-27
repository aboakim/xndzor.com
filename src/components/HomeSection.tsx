import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { ActionIcon } from "@/components/AgIcons";
import { Reveal } from "@/components/Reveal";

/** Home feed block: icon + heading + count, a grid of cards, and a "see all" link. */
export function HomeSection({
  action,
  title,
  href,
  seeAllLabel,
  count,
  children,
  id,
}: {
  action: string;
  title: string;
  href: string;
  seeAllLabel: string;
  count?: number;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Reveal as="section" className="section home-feed-section" id={id}>
      <div className="home-feed-head">
        <h2>
          <span className={`home-feed-icon action-${action}`} aria-hidden>
            <ActionIcon action={action} size={20} />
          </span>
          {title}
          {count ? <span className="home-feed-count">{count}</span> : null}
        </h2>
        <Link href={href} className="text-link home-feed-more">
          {seeAllLabel} →
        </Link>
      </div>
      {children}
    </Reveal>
  );
}
