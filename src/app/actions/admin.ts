"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { userIsAdmin } from "@/lib/monetization";
import type { ListingKind } from "@/lib/admin";
import { USER_ROLES } from "@/lib/admin";

async function assertAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("unauthorized");
  const admin = await userIsAdmin(session.user.id);
  if (!admin) throw new Error("forbidden");
  return session.user.id;
}

function revalidateAdmin() {
  for (const locale of ["hy", "ru", "en"]) {
    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/users`);
    revalidatePath(`/${locale}/admin/listings`);
    revalidatePath(`/${locale}/admin/payments`);
  }
}

export async function updateUserRole(userId: string, role: string) {
  await assertAdmin();
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    throw new Error("invalid_role");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidateAdmin();
}

export async function updateUserVerified(userId: string, farmVerified: boolean) {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { farmVerified } });
  revalidateAdmin();
}

export async function updateUserSuspended(userId: string, suspended: boolean) {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  revalidateAdmin();
}

export async function updateListingStatus(
  kind: ListingKind,
  id: string,
  status: string,
) {
  await assertAdmin();
  const data = { status };
  switch (kind) {
    case "supply":
      await prisma.supply.update({ where: { id }, data });
      break;
    case "demand":
      await prisma.demand.update({ where: { id }, data });
      break;
    case "animal":
      await prisma.animalListing.update({ where: { id }, data });
      break;
    case "machinery":
      await prisma.machineryListing.update({ where: { id }, data });
      break;
    case "catalog":
      await prisma.catalogListing.update({ where: { id }, data });
      break;
    case "job":
      await prisma.jobRequest.update({ where: { id }, data });
      break;
    case "futureHarvest":
      await prisma.futureHarvest.update({ where: { id }, data });
      break;
    default:
      throw new Error("unknown_kind");
  }
  revalidateAdmin();
}

export async function deleteListing(kind: ListingKind, id: string) {
  await assertAdmin();
  switch (kind) {
    case "supply":
      await prisma.supply.delete({ where: { id } });
      break;
    case "demand":
      await prisma.demand.delete({ where: { id } });
      break;
    case "animal":
      await prisma.animalListing.delete({ where: { id } });
      break;
    case "machinery":
      await prisma.machineryListing.delete({ where: { id } });
      break;
    case "catalog":
      await prisma.catalogListing.delete({ where: { id } });
      break;
    case "job":
      await prisma.jobRequest.delete({ where: { id } });
      break;
    case "futureHarvest":
      await prisma.futureHarvest.delete({ where: { id } });
      break;
    default:
      throw new Error("unknown_kind");
  }
  revalidateAdmin();
}

export async function togglePlanActive(planId: string, active: boolean) {
  await assertAdmin();
  await prisma.plan.update({ where: { id: planId }, data: { active } });
  revalidateAdmin();
}
