"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { togglePlanActive } from "@/app/actions/admin";
import { formatAmd } from "@/lib/utils";

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
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("col.code")}</th>
            <th>{t("col.kind")}</th>
            <th>{t("col.price")}</th>
            <th>{t("col.interval")}</th>
            <th>{t("col.active")}</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.kind}</td>
              <td>{formatAmd(p.amountAmd, locale)} ֏</td>
              <td>{p.interval}</td>
              <td>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
