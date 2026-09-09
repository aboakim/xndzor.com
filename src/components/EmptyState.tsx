import { Link } from "@/i18n/navigation";

type EmptyStateProps = {
  message: string;
  actionHref: string;
  actionLabel: string;
  /** Optional “what next” cue under the CTA. */
  cue?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({
  message,
  actionHref,
  actionLabel,
  cue,
  secondaryHref,
  secondaryLabel,
}: EmptyStateProps) {
  return (
    <div className="empty-state empty-state-cta empty-state--polished">
      <span className="empty-state-motif" aria-hidden />
      <p>{message}</p>
      <div className="empty-state-actions">
        <Link href={actionHref} className="btn primary">
          {actionLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="btn ghost">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {cue ? <p className="empty-state-cue">{cue}</p> : null}
    </div>
  );
}
