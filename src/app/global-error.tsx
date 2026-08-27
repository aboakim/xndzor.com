"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="hy">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "linear-gradient(180deg, #e8efe9, #ebe8e0)",
          color: "#121a1f",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a6b72" }}>
            500
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0" }}>Ինչ-որ բան սխալ գնաց</h1>
          <p style={{ color: "#5a6b72", maxWidth: "28rem" }}>
            Խնդրում ենք փորձել նորից։ Եթե սխալը շարունակվում է, վերադարձեք գլխավոր էջ։
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#0f4a3c",
                color: "#f7faf6",
                border: 0,
                padding: "0.65rem 1.1rem",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Կրկին փորձել
            </button>
            <Link
              href="/hy"
              style={{
                background: "transparent",
                color: "#0f4a3c",
                border: "1px solid rgba(15,74,60,0.3)",
                padding: "0.65rem 1.1rem",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Գլխավոր
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
