import { Suspense } from "react";
import DemoCheckoutClient from "./DemoCheckoutClient";

export default function DemoCheckoutPage() {
  return (
    <Suspense fallback={<div className="section">…</div>}>
      <DemoCheckoutClient />
    </Suspense>
  );
}
