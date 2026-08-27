import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page">
      <p className="eyebrow">404</p>
      <h1>Էջը չի գտնվել</h1>
      <p className="lede muted">Հասցեն սխալ է կամ էջը հեռացվել է։</p>
      <Link href="/hy" className="btn primary">
        Գլխավոր էջ
      </Link>
    </div>
  );
}
