import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { MachineryTypeIcon } from "@/components/AgIcons";
import { MachineryListingActions } from "@/components/MachineryListingActions";
import { formatAmd, parseImageUrls } from "@/lib/utils";

export default async function MyMachineryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/my/machinery`);
  }

  const listings = await prisma.machineryListing.findMany({
    where: { userId: session.user.id },
    include: { marz: true, village: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/machinery", label: t("machineryBoard.title") },
          { label: t("myMachinery.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("myMachinery.title")}</h1>
          <p className="lede">{t("myMachinery.lede")}</p>
        </div>
        <Link href="/machinery/new" className="btn primary">
          {t("common.add")}
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          message={t("myMachinery.empty")}
          actionHref="/machinery/new"
          actionLabel={t("common.add")}
        />
      ) : (
        <ul className="my-machinery-list">
          {listings.map((m) => {
            const thumb = parseImageUrls(m.imageUrls)[0];
            return (
              <li key={m.id} className="my-machinery-row">
                <Link href={`/machinery/${m.id}`} className="my-machinery-main">
                  <span className="my-machinery-thumb" aria-hidden>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : (
                      <MachineryTypeIcon type={m.machineryType} size={28} />
                    )}
                  </span>
                  <span>
                    <strong>{m.title}</strong>
                    <span className="muted">
                      {m.make} {m.model} · {m.year} ·{" "}
                      {t(`machinery.status.${m.status}` as "machinery.status.ACTIVE")}
                      {m.priceAmd != null ? ` · ${formatAmd(m.priceAmd)} ֏` : ""}
                    </span>
                  </span>
                </Link>
                <MachineryListingActions id={m.id} status={m.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
