"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { formatLocaleDate } from "@/lib/content-locale";
import type { CommentTargetType } from "@/lib/catalog";

type CommentRow = {
  id: string;
  body: string;
  rating: number | null;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
};

export function CommentSection({
  targetType,
  targetId,
}: {
  targetType: CommentTargetType;
  targetId: string;
}) {
  const t = useTranslations("comments");
  const locale = useLocale();
  const { data: session } = useSession();
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(
      `/api/comments?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
    );
    if (res.ok) setRows(await res.json());
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        body,
        rating: rating || "",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setBody("");
    setRating("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <section className="comments-section">
      <h2>{t("title")}</h2>
      <p className="muted">{t("lede")}</p>

      {rows.length === 0 ? <p className="muted">{t("empty")}</p> : null}

      <ul className="comment-list">
        {rows.map((c) => (
          <li key={c.id} className="comment-row">
            <div className="comment-head">
              <strong>{c.user.name}</strong>
              <span className="muted">
                {formatLocaleDate(new Date(c.createdAt), locale)}
                {c.rating != null ? ` · ${t("stars", { n: c.rating })}` : ""}
              </span>
            </div>
            <p className="pre-wrap">{c.body}</p>
            {(session?.user as { id?: string } | undefined)?.id === c.userId ? (
              <button type="button" className="btn tiny danger" onClick={() => remove(c.id)}>
                {t("delete")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {session?.user ? (
        <form className="stack-form comment-form" onSubmit={onSubmit}>
          <label>
            <span>{t("yourComment")}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={2}
              maxLength={2000}
              rows={4}
              placeholder={t("placeholder")}
            />
          </label>
          <label>
            <span>{t("ratingOptional")}</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">{t("noRating")}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {t("stars", { n })}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={busy || body.trim().length < 2}>
            {busy ? t("sending") : t("submit")}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link href="/auth/login">{t("loginToComment")}</Link>
        </p>
      )}
    </section>
  );
}
