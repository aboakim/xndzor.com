import { Suspense } from "react";
import CardCheckoutClient from "./CardCheckoutClient";

export default function CardCheckoutPage() {
  return (
    <Suspense fallback={<div className="section">…</div>}>
      <CardCheckoutClient />
    </Suspense>
  );
}
