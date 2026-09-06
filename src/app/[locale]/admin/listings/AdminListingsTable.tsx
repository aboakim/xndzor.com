"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { deleteListing, updateListingStatus } from "@/app/actions/admin";
import type { ListingKind } from "@/lib/admin";

export type AdminListingRow = {
  id: string;
  kind: ListingKind;
  title: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  href: string;
};

const STATUS_OPTIONS = ["ACTIVE", "HIDDEN", "SOLD", "FILLED", "RESERVED", "OPEN", "CLOSED", "BUSY"];

export function AdminListingsTable({
  rows,
  locale,
  tab,
}: {
  rows: AdminListingRow[];
  locale: string;
  tab: ListingKind;
}) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(() => {
      void action().catch(() => {});
    });
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("col.title")}</th>
            <th>{t("col.owner")}</th>
            <th>{t("col.status")}</th>
            <th>{t("col.created")}</th>
            <th>{t("col.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">
                {t("noResults")}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row.kind}-${row.id}`}>
                <td>
                  <Link href={row.href} className="linkish">
                    {row.title}
                  </Link>
                </td>
                <td>
                  {row.ownerName}
                  <span className="tiny muted block">{row.ownerEmail}</span>
                </td>
                <td>
                  <select
                    defaultValue={row.status}
                    disabled={pending}
                    className="admin-select"
                    onChange={(e) =>
                      run(() => updateListingStatus(row.kind, row.id, e.target.value))
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <time dateTime={row.createdAt}>
                    {new Date(row.createdAt).toLocaleDateString(locale)}
                  </time>
                </td>
                <td className="admin-actions-cell">
                  <button
                    type="button"
                    className="btn ghost tiny"
                    disabled={pending}
                    onClick={() =>
                      run(() => updateListingStatus(row.kind, row.id, "HIDDEN"))
                    }
                  >
                    {t("hide")}
                  </button>
                  <button
                    type="button"
                    className="btn ghost tiny admin-btn-danger"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(t("confirmDelete"))) return;
                      run(() => deleteListing(row.kind, row.id));
                    }}
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <input type="hidden" name="tab" value={tab} />
    </div>
  );
}
