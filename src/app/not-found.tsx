import Link from "next/link";

/** Root 404 — must include html/body when app/layout is a passthrough. */
export default function NotFound() {
  return (
    <html lang="hy">
      <body>
        <div className="error-page">
          <p className="eyebrow">404</p>
          <h1>Էջը չի գտնվել</h1>
          <p className="lede muted">Հասցեն սխալ է կամ էջը հեռացվել է։</p>
          <Link href="/hy" className="btn primary">
            Գլխավոր էջ
          </Link>
        </div>
      </body>
    </html>
  );
}
