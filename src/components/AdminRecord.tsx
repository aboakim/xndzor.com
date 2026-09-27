import type { ReactNode } from "react";

export function AdminRecordList({ children }: { children: ReactNode }) {
  return <div className="admin-record-list">{children}</div>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <p className="admin-record admin-record-empty">{children}</p>;
}

export function AdminRecord({
  title,
  subtitle,
  children,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="admin-record">
      <header className="admin-record-head">
        <h3 className="admin-record-title">{title}</h3>
        {subtitle ? <p className="admin-record-sub">{subtitle}</p> : null}
      </header>
      {children ? <dl className="admin-record-fields">{children}</dl> : null}
      {actions ? <div className="admin-record-actions">{actions}</div> : null}
    </article>
  );
}

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-record-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
