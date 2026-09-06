import { Link } from "@/i18n/navigation";

type EmptyStateProps = {
  message: string;
  actionHref: string;
  actionLabel: string;
  /** Optional “what next” cue under the CTA. */
  cue?: string;
};

export function EmptyState({ message, actionHref, actionLabel, cue }: EmptyStateProps) {
  return (
    <div className="empty-state empty-state-cta empty-state--polished">
      <span className="empty-state-motif" aria-hidden />
      <p>{message}</p>
      <Link href={actionHref} className="btn primary">
        {actionLabel}
      </Link>
      {cue ? <p className="empty-state-cue">{cue}</p> : null}
    </div>
  );
}
