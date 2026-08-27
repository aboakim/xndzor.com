import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  return (
    <div className="error-page">
      <p className="eyebrow">404</p>
      <h1>Էջը չի գտնվել</h1>
      <p className="lede muted">Հասցեն սխալ է կամ էջը հեռացվել է։</p>
      <Link href="/" className="btn primary">
        Գլխավոր էջ
      </Link>
    </div>
  );
}
