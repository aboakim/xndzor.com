import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const farmer = await prisma.user.findUnique({ where: { email: "farmer@demo.am" } });
  if (!farmer) {
    console.log("no farmer@demo.am — run npm run db:seed");
    return;
  }
  const count = await prisma.farmExpense.count({ where: { userId: farmer.id } });
  if (count === 0) {
    const plot = await prisma.plot.findFirst({
      where: { userId: farmer.id },
      orderBy: { createdAt: "asc" },
    });
    await prisma.farmExpense.createMany({
      data: [
        {
          userId: farmer.id,
          plotId: plot?.id,
          category: "diesel",
          amountAmd: 85000,
          note: "Demo diesel",
          date: new Date("2026-08-12"),
        },
        {
          userId: farmer.id,
          plotId: plot?.id,
          category: "labor",
          amountAmd: 120000,
          note: "Demo labor",
          date: new Date("2026-08-18"),
        },
        {
          userId: farmer.id,
          category: "water",
          amountAmd: 42000,
          note: "Demo water",
          date: new Date("2026-08-05"),
        },
        {
          userId: farmer.id,
          category: "seed",
          amountAmd: 95000,
          note: "Demo seed",
          date: new Date("2025-10-15"),
        },
        {
          userId: farmer.id,
          category: "other",
          amountAmd: 28000,
          note: "Demo crates",
          date: new Date("2026-08-22"),
        },
      ],
    });
    console.log("created 5 expenses");
  } else {
    console.log("expenses already", count);
  }

  const spaces = await prisma.spaceListing.count({ where: { userId: farmer.id } });
  if (spaces === 0) {
    const plot = await prisma.plot.findFirst({ where: { userId: farmer.id } });
    if (plot) {
      await prisma.spaceListing.create({
        data: {
          title: "Cold storage demo — Masis",
          description: "Farm OS demo cold space",
          spaceType: "COLD",
          capacityNote: "~40 t",
          availableFrom: new Date("2026-09-01"),
          availableTo: new Date("2026-11-30"),
          priceAmd: 180000,
          marzId: plot.marzId,
          villageId: plot.villageId,
          phone: farmer.phone || "+37400000000",
          userId: farmer.id,
        },
      });
      console.log("created space listing");
    }
  } else {
    console.log("spaces already", spaces);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
