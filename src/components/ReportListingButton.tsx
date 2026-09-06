import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { reportListingContactQuery } from "@/lib/contact";

export async function ReportListingButton({
  listingPath,
  listingTitle,
}: {
  listingPath: string;
  listingTitle: string;
}) {
  const t = await getTranslations("reportListing");

  return (
    <div className="report-listing-wrap">
      <Link
        href={{
          pathname: "/contact",
          query: reportListingContactQuery(listingPath, listingTitle),
        }}
        className="btn ghost report-listing-btn"
      >
        {t("button")}
      </Link>
    </div>
  );
}
