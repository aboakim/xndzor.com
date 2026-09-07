import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { MyListingActions } from "@/components/MyListingActions";
import { AnimalListingActions } from "@/components/AnimalListingActions";
import { MachineryListingActions } from "@/components/MachineryListingActions";
import { CatalogListingActions } from "@/components/CatalogListingActions";
import { CATALOG_ROUTE, type CatalogCategory } from "@/lib/catalog";
import { tContent } from "@/lib/content-locale";
import { parseImageUrls } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  status: string;
  href: string;
  kind: string;
  updatedAt: Date;
  imageUrls?: string;
  apiBase?: string;
  soldStatus?: string | null;
  actions?: "generic" | "animal" | "machinery" | "catalog";
};

export default async function AccountListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/account/listings`);
  }

  const userId = session.user.id;

  const [supplies, demands, forwards, jobs, animals, machinery, catalog] =
    await Promise.all([
      prisma.supply.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true, imageUrls: true },
      }),
      prisma.demand.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true, imageUrls: true },
      }),
      prisma.futureHarvest.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true, imageUrls: true },
      }),
      prisma.jobRequest.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      prisma.animalListing.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true, imageUrls: true },
      }),
      prisma.machineryListing.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true, imageUrls: true },
      }),
      prisma.catalogListing.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          imageUrls: true,
          category: true,
        },
      }),
    ]);

  const rows: Row[] = [
    ...supplies.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/supply/${r.id}`,
      kind: t("myListings.kinds.supply"),
      updatedAt: r.updatedAt,
      imageUrls: r.imageUrls,
      apiBase: "/api/supply",
      actions: "generic" as const,
    })),
    ...demands.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/demand/${r.id}`,
      kind: t("myListings.kinds.demand"),
      updatedAt: r.updatedAt,
      imageUrls: r.imageUrls,
      apiBase: "/api/demand",
      actions: "generic" as const,
    })),
    ...forwards.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/forward/${r.id}`,
      kind: t("myListings.kinds.forward"),
      updatedAt: r.updatedAt,
      imageUrls: r.imageUrls,
      apiBase: "/api/forward",
      actions: "generic" as const,
    })),
    ...jobs.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/jobs/${r.id}`,
      kind: t("myListings.kinds.jobs"),
      updatedAt: r.updatedAt,
      apiBase: "/api/jobs",
      soldStatus: "FILLED",
      actions: "generic" as const,
    })),
    ...animals.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/animals/${r.id}`,
      kind: t("myListings.kinds.animals"),
      updatedAt: r.updatedAt,
      imageUrls: r.imageUrls,
      actions: "animal" as const,
    })),
    ...machinery.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      href: `/machinery/${r.id}`,
      kind: t("myListings.kinds.machinery"),
      updatedAt: r.updatedAt,
      imageUrls: r.imageUrls,
      actions: "machinery" as const,
    })),
    ...catalog.map((r) => {
      const route = CATALOG_ROUTE[r.category as CatalogCategory] ?? "fertilizers";
      return {
        id: r.id,
        title: r.title,
        status: r.status,
        href: `/shop/${route}/${r.id}`,
        kind: t("myListings.kinds.shop"),
        updatedAt: r.updatedAt,
        imageUrls: r.imageUrls,
        actions: "catalog" as const,
      };
    }),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  function statusLabel(status: string) {
    const fullKey = `myListings.status.${status}` as "myListings.status.ACTIVE";
    return t.has(fullKey) ? t(fullKey) : status;
  }

  return (
    <div className="section page-board">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("myListings.title") },
        ]}
      />
      <div className="section-head">
        <div>
          <h1>{t("myListings.title")}</h1>
          <p className="lede">{t("myListings.lede")}</p>
        </div>
        <Link href="/plots/new" className="btn primary">
          + {t("nav.post")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          message={t("myListings.empty")}
          actionHref="/plots/new"
          actionLabel={t("nav.post")}
        />
      ) : (
        <ul className="my-machinery-list">
          {rows.map((row) => {
            const thumb = row.imageUrls ? parseImageUrls(row.imageUrls)[0] : undefined;
            return (
              <li key={`${row.href}`} className="my-machinery-row">
                <Link href={row.href} className="my-machinery-main">
                  <span className="my-machinery-thumb" aria-hidden>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : (
                      <span className="muted">{row.kind.slice(0, 1)}</span>
                    )}
                  </span>
                  <span>
                    <strong>{tContent(locale, row.title)}</strong>
                    <span className="muted">
                      {row.kind} · {statusLabel(row.status)}
                    </span>
                  </span>
                </Link>
                {row.actions === "generic" && row.apiBase ? (
                  <MyListingActions
                    id={row.id}
                    status={row.status}
                    apiBase={row.apiBase}
                    soldStatus={row.soldStatus}
                  />
                ) : null}
                {row.actions === "animal" ? (
                  <AnimalListingActions id={row.id} status={row.status} />
                ) : null}
                {row.actions === "machinery" ? (
                  <MachineryListingActions id={row.id} status={row.status} />
                ) : null}
                {row.actions === "catalog" ? (
                  <CatalogListingActions id={row.id} status={row.status} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
