"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { togglePlanActive } from "@/app/actions/admin";
import { formatAmd } from "@/lib/utils";
import { AdminField, AdminRecord, AdminRecordList } from "@/components/AdminRecord";

export type AdminPlanRow = {
  id: string;
  code: string;
  kind: string;
  nameKey: string;
  amountAmd: number;
  interval: string;
  active: boolean;
  sortOrder: number;
};

export function AdminPlansTable({
  plans,
  locale,
}: {
  plans: AdminPlanRow[];
  locale: string;
}) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  return (
    <AdminRecordList>
      {plans.map((p) => (
        <AdminRecord key={p.id} title={p.code} subtitle={p.kind}>
          <AdminField label={t("col.price")}>
            {formatAmd(p.amountAmd, locale)} ֏
          </AdminField>
          <AdminField label={t("col.interval")}>{p.interval}</AdminField>
          <AdminField label={t("col.active")}>
            <label className="admin-check">
              <input
                type="checkbox"
                defaultChecked={p.active}
                disabled={pending}
                onChange={(e) =>
                  startTransition(() => {
                    void togglePlanActive(p.id, e.target.checked);
                  })
                }
              />
              {p.active ? t("active") : t("inactive")}
            </label>
          </AdminField>
        </AdminRecord>
      ))}
    </AdminRecordList>
  );
}
