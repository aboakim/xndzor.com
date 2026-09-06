import { Link } from "@/i18n/navigation";
import { getFooterPaymentMethods, type PaymentMethod } from "@/lib/payment-providers";

type Props = {
  /** Show only methods that are active today (checkout truth) */
  activeOnly?: boolean;
  className?: string;
  /** Optional label from parent (i18n) */
  label?: string;
  /** i18n "coming soon" for inactive badges */
  comingSoonLabel?: string;
  /** Local dev demo mode — show all methods as available (no grayed-out state) */
  demoMode?: boolean;
  /** Link badges to pricing in demo mode */
  linkToPricing?: boolean;
  /** i18n demo badge label */
  demoBadgeLabel?: string;
};

function PaymentBadge({
  method,
  comingSoonLabel,
  demoMode,
  demoBadgeLabel,
}: {
  method: PaymentMethod;
  comingSoonLabel?: string;
  demoMode?: boolean;
  demoBadgeLabel?: string;
}) {
  const active = method.active || demoMode;
  return (
    <span
      className={`pay-badge pay-badge-${method.variant}${active ? "" : " pay-badge-soon"}${demoMode && !method.active ? " pay-badge-demo" : ""}`}
      title={
        demoMode && !method.active
          ? `${method.label} — ${demoBadgeLabel || "Demo"}`
          : active
            ? method.label
            : `${method.label}${comingSoonLabel ? ` — ${comingSoonLabel}` : ""}`
      }
      aria-label={
        demoMode && !method.active
          ? `${method.label} — ${demoBadgeLabel || "Demo"}`
          : active
            ? method.label
            : `${method.label}${comingSoonLabel ? ` — ${comingSoonLabel}` : ""}`
      }
    >
      {method.badge}
    </span>
  );
}

export function PaymentBadges({
  activeOnly = false,
  className = "",
  label,
  comingSoonLabel,
  demoMode = false,
  linkToPricing = false,
  demoBadgeLabel,
}: Props) {
  const methods = getFooterPaymentMethods().filter(
    (m) => !activeOnly || m.active || demoMode,
  );

  const badges = (
    <div className="pay-badges-list" role="list">
      {methods.map((m) => (
        <PaymentBadge
          key={m.id}
          method={m}
          comingSoonLabel={comingSoonLabel}
          demoMode={demoMode}
          demoBadgeLabel={demoBadgeLabel}
        />
      ))}
    </div>
  );

  return (
    <div className={`pay-badges-row ${className}`.trim()}>
      {label ? <span className="pay-badges-label">{label}</span> : null}
      {demoMode && linkToPricing ? (
        <Link href="/pricing" className="pay-badges-link">
          {badges}
        </Link>
      ) : (
        badges
      )}
      {demoMode ? (
        <span className="pay-badges-demo-tag">{demoBadgeLabel || "Demo"}</span>
      ) : null}
    </div>
  );
}
