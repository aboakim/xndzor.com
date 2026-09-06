import { prisma } from "@/lib/prisma";
import { computeXndzorHealth } from "@/lib/xndzor-health";
import { fetchFarmWeather } from "@/lib/weather";

export async function loadFarmContext(userId: string | undefined, locale: string) {
  if (!userId) {
    const weather = await fetchFarmWeather({ marzId: "Yerevan", placeLabel: "Yerevan" }, locale);
    return {
      user: null,
      plots: [] as Awaited<ReturnType<typeof loadPlots>>,
      weather,
      health: computeXndzorHealth({
        plotCount: 0,
        totalHa: 0,
        openTasks: 0,
        expenseTotalAmd: 0,
        expenseCount: 0,
        diaryCount: 0,
        spaceListingCount: 0,
        activeSupplies: 0,
        activeForward: 0,
        lastIrrigationKnown: false,
      }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { village: true, marz: true },
  });
  const plots = await loadPlots(userId);
  const primary = plots[0];
  const placeLabel =
    primary?.village?.nameEn ||
    user?.village?.nameEn ||
    primary?.marz?.slug ||
    user?.marzId ||
    "Armenia";

  const weather = await fetchFarmWeather(
    {
      marzId: primary?.marzId || user?.marzId || "Yerevan",
      villageLat: primary?.village?.lat ?? user?.village?.lat,
      villageLng: primary?.village?.lng ?? user?.village?.lng,
      placeLabel,
      lastIrrigationAt: primary?.lastIrrigationAt,
      harvestFrom: primary?.harvestFrom,
      harvestTo: primary?.harvestTo,
    },
    locale
  );

  const [
    expenseAgg,
    expenseCount,
    diaryCount,
    spaceListingCount,
    activeSupplies,
    activeForward,
    openTasks,
  ] = await Promise.all([
    prisma.farmExpense.aggregate({
      where: { userId },
      _sum: { amountAmd: true },
    }),
    prisma.farmExpense.count({ where: { userId } }),
    prisma.farmDiaryEntry.count({ where: { userId } }),
    prisma.spaceListing.count({ where: { userId, status: "ACTIVE" } }),
    prisma.supply.count({ where: { userId, status: "ACTIVE" } }),
    prisma.futureHarvest.count({ where: { userId, status: "ACTIVE" } }),
    prisma.plotTask.count({
      where: { status: "OPEN", plot: { userId } },
    }),
  ]);

  const totalHa = plots.reduce((s, p) => s + p.hectares, 0);
  const health = computeXndzorHealth({
    plotCount: plots.length,
    totalHa,
    openTasks,
    expenseTotalAmd: expenseAgg._sum.amountAmd ?? 0,
    expenseCount,
    diaryCount,
    spaceListingCount,
    activeSupplies,
    activeForward,
    lastIrrigationKnown: plots.some((p) => p.lastIrrigationAt != null),
  });

  return { user, plots, weather, health };
}

function loadPlots(userId: string) {
  return prisma.plot.findMany({
    where: { userId, status: "ACTIVE" },
    include: { marz: true, village: true, cropProduct: true },
    orderBy: { updatedAt: "desc" },
  });
}
