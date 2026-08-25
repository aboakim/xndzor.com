import { Link } from "@/i18n/navigation";

type EmptyStateProps = {
  message: string;
  actionHref: string;
  actionLabel: string;
};

export function EmptyState({ message, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="empty-state empty-state-cta">
      <p>{message}</p>
      <Link href={actionHref} className="btn primary">
        {actionLabel}
      </Link>
    </div>
  );
}
