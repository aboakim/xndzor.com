"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { deleteListing, updateListingStatus } from "@/app/actions/admin";
import type { ListingKind } from "@/lib/admin";
import {
  AdminEmpty,
  AdminField,
  AdminRecord,
  AdminRecordList,
} from "@/components/AdminRecord";

export type AdminListingRow = {
  id: string;
  kind: ListingKind;
  title: string;
  status: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  href: string;
  /** Set on supply rows that appear on the future-harvest board. */
  readyInDays?: number | null;
};

const STATUS_OPTIONS = [
  "ACTIVE",
  "HIDDEN",
  "SOLD",
  "FILLED",
  "RESERVED",
  "OPEN",
  "CLOSED",
  "BUSY",
  "BOOKED",
];

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
    <div>
      {rows.length === 0 ? (
        <AdminEmpty>{t("noResults")}</AdminEmpty>
      ) : (
        <AdminRecordList>
          {rows.map((row) => (
            <AdminRecord
              key={`${row.kind}-${row.id}`}
              title={
                <>
                  <Link href={row.href} className="linkish">
                    {row.title}
                  </Link>
                  {row.kind === "futureHarvest" ? (
                    <span className="admin-badge">{t("sourceHarvest")}</span>
                  ) : null}
                  {row.kind === "supply" && row.readyInDays != null ? (
                    <span className="admin-badge admin-badge-earth">
                      {t("sourceSupply", { days: row.readyInDays })}
                    </span>
                  ) : null}
                </>
              }
              subtitle={row.ownerEmail}
              actions={
                <>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={pending}
                    onClick={() => run(() => updateListingStatus(row.kind, row.id, "HIDDEN"))}
                  >
                    {t("hide")}
                  </button>
                  <button
                    type="button"
                    className="btn ghost admin-btn-danger"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(t("confirmDelete"))) return;
                      run(() => deleteListing(row.kind, row.id));
                    }}
                  >
                    {t("delete")}
                  </button>
                </>
              }
            >
              <AdminField label={t("col.owner")}>{row.ownerName}</AdminField>
              <AdminField label={t("col.status")}>
                <select
                  defaultValue={row.status}
                  disabled={pending}
                  className="admin-select"
                  aria-label={t("col.status")}
                  onChange={(e) =>
                    run(() => updateListingStatus(row.kind, row.id, e.target.value))
                  }
                >
                  {(STATUS_OPTIONS.includes(row.status)
                    ? STATUS_OPTIONS
                    : [row.status, ...STATUS_OPTIONS]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label={t("col.created")}>
                <time dateTime={row.createdAt}>
                  {new Date(row.createdAt).toLocaleDateString(locale)}
                </time>
              </AdminField>
            </AdminRecord>
          ))}
        </AdminRecordList>
      )}
      <input type="hidden" name="tab" value={tab} />
    </div>
  );
}
