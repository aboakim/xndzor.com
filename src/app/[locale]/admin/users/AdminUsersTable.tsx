"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  updateUserRole,
  updateUserSuspended,
  updateUserVerified,
} from "@/app/actions/admin";
import { USER_ROLES } from "@/lib/admin";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  farmId: string | null;
  farmVerified: boolean;
  suspended: boolean;
  isPro: boolean;
  createdAt: string;
};

export function AdminUsersTable({
  users,
  locale,
  query,
  recent = "",
  earlyBird = "",
}: {
  users: AdminUserRow[];
  locale: string;
  query: string;
  recent?: string;
  earlyBird?: string;
}) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(() => {
      void action().catch(() => {});
    });
  }

  return (
    <>
      <form className="admin-search-form" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("searchUsers")}
          className="admin-search-input"
        />
        {recent ? <input type="hidden" name="recent" value={recent} /> : null}
        {earlyBird ? <input type="hidden" name="earlyBird" value={earlyBird} /> : null}
        <button type="submit" className="btn ghost" disabled={pending}>
          {t("search")}
        </button>
      </form>

      <div className="admin-table-wrap admin-responsive-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("col.name")}</th>
              <th>{t("col.email")}</th>
              <th>{t("col.role")}</th>
              <th>{t("col.verified")}</th>
              <th>{t("col.status")}</th>
              <th>{t("col.joined")}</th>
              <th>{t("col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={u.suspended ? "admin-row-muted" : undefined}>
                  <td data-label={t("col.name")}>
                    {u.farmId ? (
                      <Link href={`/farms/${u.farmId}`} className="linkish">
                        {u.name}
                      </Link>
                    ) : (
                      u.name
                    )}
                    {u.isPro ? <span className="admin-badge">Pro</span> : null}
                  </td>
                  <td data-label={t("col.email")}>{u.email}</td>
                  <td data-label={t("col.role")}>
                    <select
                      defaultValue={u.role}
                      disabled={pending}
                      onChange={(e) =>
                        run(() => updateUserRole(u.id, e.target.value))
                      }
                      className="admin-select"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label={t("col.verified")}>
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        defaultChecked={u.farmVerified}
                        disabled={pending}
                        onChange={(e) =>
                          run(() => updateUserVerified(u.id, e.target.checked))
                        }
                      />
                      {u.farmVerified ? t("verified") : t("unverified")}
                    </label>
                  </td>
                  <td data-label={t("col.status")}>
                    {u.suspended ? (
                      <span className="admin-status admin-status-bad">{t("suspended")}</span>
                    ) : (
                      <span className="admin-status admin-status-ok">{t("active")}</span>
                    )}
                  </td>
                  <td data-label={t("col.joined")}>
                    <time dateTime={u.createdAt}>
                      {new Date(u.createdAt).toLocaleDateString(locale)}
                    </time>
                  </td>
                  <td data-label={t("col.actions")}>
                    <button
                      type="button"
                      className="btn ghost tiny"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateUserSuspended(u.id, !u.suspended))
                      }
                    >
                      {u.suspended ? t("unsuspend") : t("suspend")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
