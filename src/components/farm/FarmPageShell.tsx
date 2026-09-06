import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function FarmPageShell({
  title,
  lede,
  breadcrumbs,
  children,
  actions,
}: {
  title: string;
  lede?: string;
  breadcrumbs: { href?: string; label: string }[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="section page-board farm-os farm-page-shell farm-page-shell--depth">
      <Breadcrumbs items={breadcrumbs} />
      <div className="section-head">
        <div>
          <p className="farm-eyebrow">
            <Link href="/farm">Farm OS</Link>
          </p>
          <h1>{title}</h1>
          {lede ? <p className="lede">{lede}</p> : null}
        </div>
        {actions ? <div className="farm-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
