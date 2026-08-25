import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductIcon, ActionIcon } from "@/components/AgIcons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PlotActions, TaskDoneButton } from "@/components/PlotActions";
import { effectiveTons } from "@/lib/yield";
import { fetchMarzWeather } from "@/lib/weather";
import { resolveTaskCopy } from "@/lib/task-copy";
import { VillageLink } from "@/components/VillageLink";

export default async function PlotDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/plots/${id}`);
  }

  const plot = await prisma.plot.findFirst({
    where: { id, userId: session.user.id },
    include: {
      cropProduct: true,
      marz: true,
      village: true,
      yieldEstimate: true,
      tasks: { orderBy: [{ status: "asc" }, { priority: "desc" }] },
      futureHarvests: {
        include: {
          preOffers: {
            include: { fromUser: { select: { name: true } } },
            where: { status: { in: ["SENT", "RESERVED"] } },
          },
        },
      },
    },
  });
  if (!plot) notFound();

  const weather = await fetchMarzWeather(plot.marzId, locale);
  const tons = plot.yieldEstimate ? effectiveTons(plot.yieldEstimate) : null;
  const photos: string[] = JSON.parse(plot.photoUrls || "[]");

  const matchingDemand = await prisma.demand.findMany({
    where: { status: "ACTIVE", productId: plot.cropProductId },
    include: { user: { select: { name: true } } },
    take: 6,
  });

  const approaching =
    plot.harvestFrom &&
    plot.harvestFrom.getTime() - Date.now() < 45 * 86400000 &&
    plot.harvestFrom.getTime() + 30 * 86400000 > Date.now();

  return (
    <div className="section detail-page plot-detail">
      <Breadcrumbs
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/plots", label: t("plots.title") },
          { label: plot.name },
        ]}
      />
      <h1>{plot.name}</h1>
      <p className="detail-product icon-label">
        <ProductIcon slugOrKey={plot.cropProduct.slug} size={18} />
        {t(plot.cropProduct.nameKey as "products.tomato")} · {plot.hectares} հա ·{" "}
        {t(`marzes.${plot.marz.slug}` as "marzes.Yerevan")}
        {plot.village ? (
          <>
            {" · "}
            <VillageLink village={plot.village} locale={locale} />
          </>
        ) : null}
      </p>

      <div className="detail-stats">
        <div>
          <span>{t("plots.fields.plantDate")}</span>
          <strong>{plot.plantDate.toISOString().slice(0, 10)}</strong>
        </div>
        <div>
          <span>{t("plots.yieldPreview")}</span>
          <strong>
            {plot.yieldEstimate
              ? `${plot.yieldEstimate.tonsMin}–${plot.yieldEstimate.tonsMax} ${t("units.ton")}`
              : "—"}
            {tons != null && plot.yieldEstimate?.farmerOverrideTons != null
              ? ` (${t("plots.overrideShort")}: ${tons})`
              : ""}
          </strong>
        </div>
        <div>
          <span>{t("plots.fields.harvestFrom")}</span>
          <strong>
            {plot.harvestFrom?.toISOString().slice(0, 10) || "—"}
            {plot.harvestTo ? ` → ${plot.harvestTo.toISOString().slice(0, 10)}` : ""}
          </strong>
        </div>
      </div>

      {plot.yieldEstimate ? (
        <p className="muted small assumption">{plot.yieldEstimate.assumptionNote}</p>
      ) : null}

      <section className="match-section weather-block">
        <h2>{t("today.weather")}</h2>
        <p>{weather.summary}</p>
        <p className="muted small">{weather.caveat}</p>
      </section>

      <section className="match-section">
        <h2>{t("today.title")}</h2>
        <ul className="match-list">
          {plot.tasks.filter((x) => x.status === "OPEN").length === 0 ? (
            <li className="match-row">
              <p className="muted">{t("today.noTasks")}</p>
            </li>
          ) : (
            plot.tasks
              .filter((x) => x.status === "OPEN")
              .map((task) => (
                <li key={task.id} className="match-row">
                  <div>
                    <strong>{resolveTaskCopy(t, task.title)}</strong>
                    <p className="muted">{resolveTaskCopy(t, task.detail)}</p>
                  </div>
                  <TaskDoneButton plotId={plot.id} taskId={task.id} />
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="match-section">
        <h2>{t("plots.matchingDemand")}</h2>
        {matchingDemand.length === 0 ? (
          <p className="muted">{t("plots.noDemand")}</p>
        ) : (
          <ul className="match-list">
            {matchingDemand.map((d, i) => (
              <li key={d.id} className="match-row">
                <div>
                  <strong>
                    {t("plots.buyerLabel", { letter: String.fromCharCode(65 + i) })} — {d.user.name}
                  </strong>
                  <p>
                    {d.title} · {d.qtyMin}
                    {d.qtyMax ? `–${d.qtyMax}` : "+"} {t(`units.${d.unit}` as "units.kg")}
                  </p>
                </div>
                <Link href={`/demand/${d.id}`} className="btn secondary dark">
                  {t("common.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {plot.futureHarvests.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.futureListings")}</h2>
          <ul className="match-list">
            {plot.futureHarvests.map((h) => (
              <li key={h.id} className="match-row">
                <div>
                  <Link href={`/forward/${h.id}`}>
                    <strong>{h.title}</strong>
                  </Link>
                  <p>
                    {h.qtyExpected} {t(`units.${h.unit}` as "units.kg")} ·{" "}
                    {t("plots.preOfferCount", { n: h.preOffers.length })}
                  </p>
                  {h.preOffers.map((o) => (
                    <p key={o.id} className="muted small">
                      {o.fromUser.name}: {o.qtyWanted}
                    </p>
                  ))}
                </div>
                <Link href={`/forward/${h.id}`} className="btn secondary dark">
                  {t("common.open")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {approaching ? (
        <section className="match-section farm-context-actions">
          <h2>{t("plots.contextActions")}</h2>
          <div className="action-grid compact">
            <Link
              href={`/jobs/new?jobType=HARVEST&hectares=${plot.hectares}&marzId=${plot.marzId}&title=${encodeURIComponent(`${plot.hectares} հա ${t(plot.cropProduct.nameKey as "products.tomato")} — բերքահավաք`)}`}
              className="action-main soft"
            >
              <ActionIcon action="orderJob" size={20} />
              <h3>{t("plots.needWorkers")}</h3>
              <p>{t("plots.needWorkersDesc")}</p>
            </Link>
            <Link href="/jobs/new" className="action-main soft">
              <ActionIcon action="doJob" size={20} />
              <h3>{t("plots.needEquipment")}</h3>
              <p>{t("plots.needEquipmentDesc")}</p>
            </Link>
            <Link href="/group-buy" className="action-main soft">
              <ActionIcon action="groupBuy" size={20} />
              <h3>{t("plots.needFertilizer")}</h3>
              <p>{t("plots.needFertilizerDesc")}</p>
            </Link>
            <Link href="#publish" className="action-main soft">
              <ActionIcon action="forward" size={20} />
              <h3>{t("plots.needSell")}</h3>
              <p>{t("plots.needSellDesc")}</p>
            </Link>
          </div>
        </section>
      ) : null}

      {photos.length > 0 ? (
        <section className="match-section">
          <h2>{t("plots.photos")}</h2>
          <div className="plot-photos">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="plot-photo" />
            ))}
          </div>
          {plot.photoNote ? (
            <p className="disclaimer muted small">{t("plots.photoDisclaimer")}</p>
          ) : null}
        </section>
      ) : null}

      <div id="publish">
        <PlotActions
          plotId={plot.id}
          defaultTitle={`${plot.name} — ապագա բերք`}
          defaultQtyTons={tons ?? 1}
        />
      </div>

      {plot.irrigationNotes || plot.lastFertilizer ? (
        <section className="match-section">
          <h2>{t("plots.notes")}</h2>
          {plot.irrigationNotes ? <p className="pre-wrap">{plot.irrigationNotes}</p> : null}
          {plot.lastFertilizer ? (
            <p>
              {t("plots.fields.lastFertilizer")}: {plot.lastFertilizer}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
