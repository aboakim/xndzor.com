import { Suspense } from "react";
import BankCheckoutClient from "./BankCheckoutClient";

export default function BankCheckoutPage() {
  return (
    <Suspense fallback={<div className="section">…</div>}>
      <BankCheckoutClient />
    </Suspense>
  );
}
