"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
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
  farmVerified: boolean;
  suspended: boolean;
  isPro: boolean;
  createdAt: string;
};

export function AdminUsersTable({
  users,
  locale,
  query,
}: {
  users: AdminUserRow[];
  locale: string;
  query: string;
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
        <button type="submit" className="btn ghost" disabled={pending}>
          {t("search")}
        </button>
      </form>

      <div className="admin-table-wrap">
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
                  <td>
                    {u.name}
                    {u.isPro ? <span className="admin-badge">Pro</span> : null}
                  </td>
                  <td>{u.email}</td>
                  <td>
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
                  <td>
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
                  <td>
                    {u.suspended ? (
                      <span className="admin-status admin-status-bad">{t("suspended")}</span>
                    ) : (
                      <span className="admin-status admin-status-ok">{t("active")}</span>
                    )}
                  </td>
                  <td>
                    <time dateTime={u.createdAt}>
                      {new Date(u.createdAt).toLocaleDateString(locale)}
                    </time>
                  </td>
                  <td>
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
