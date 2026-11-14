"use client";

import { apiMutation } from "@/lib/fetch-with-csrf";
import { useState } from "react";

export function TogetherJoinButton({
  goalId,
  label,
}: {
  goalId: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function join() {
    setBusy(true);
    const qty = Number(prompt("Qty to contribute?", "10") || "0");
    if (!qty || qty <= 0) {
      setBusy(false);
      return;
    }
    const res = await apiMutation("/api/farm/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      json: { action: "join", goalId, qty },
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      window.location.reload();
    }
  }

  return (
    <button type="button" className="btn" disabled={busy || done} onClick={join}>
      {done ? "✓" : label}
    </button>
  );
}
