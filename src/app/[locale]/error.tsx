"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface digest in logs for operators; avoid noisy UI.
    if (error?.digest) {
      console.error("[Xndzor]", error.digest);
    }
  }, [error]);

  return (
    <div className="error-page">
      <p className="eyebrow">500</p>
      <h1>Ինչ-որ բան սխալ գնաց</h1>
      <p className="lede muted">Խնդրում ենք փորձել նորից կամ վերադառնալ գլխավոր էջ։</p>
      <div className="error-page-actions">
        <button type="button" className="btn primary" onClick={() => reset()}>
          Կրկին փորձել
        </button>
        <Link href="/" className="btn ghost">
          Գլխավոր
        </Link>
      </div>
    </div>
  );
}
