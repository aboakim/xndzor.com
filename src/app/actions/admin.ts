"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { userIsAdmin } from "@/lib/monetization";
import type { ListingKind } from "@/lib/admin";
import { USER_ROLES } from "@/lib/admin";
import { logSecurityEvent } from "@/lib/security-audit";

async function assertAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("unauthorized");
  const admin = await userIsAdmin(session.user.id);
  if (!admin) throw new Error("forbidden");
  return session.user.id;
}

function auditAdmin(adminId: string, action: string, meta?: Record<string, unknown>) {
  void logSecurityEvent({
    type: "admin_action",
    userId: adminId,
    path: "/hy/admin",
    meta: { action, ...meta },
  });
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
  const adminId = await assertAdmin();
  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    throw new Error("invalid_role");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  auditAdmin(adminId, "updateUserRole", { targetUserId: userId, role });
  revalidateAdmin();
}

export async function updateUserVerified(userId: string, farmVerified: boolean) {
  const adminId = await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { farmVerified } });
  auditAdmin(adminId, "updateUserVerified", { targetUserId: userId, farmVerified });
  revalidateAdmin();
}

export async function updateUserSuspended(userId: string, suspended: boolean) {
  const adminId = await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  auditAdmin(adminId, "updateUserSuspended", { targetUserId: userId, suspended });
  revalidateAdmin();
}

export async function updateListingStatus(
  kind: ListingKind,
  id: string,
  status: string,
) {
  const adminId = await assertAdmin();
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
    case "space":
      await prisma.spaceListing.update({ where: { id }, data });
      break;
    default:
      throw new Error("unknown_kind");
  }
  auditAdmin(adminId, "updateListingStatus", { kind, id, status });
  revalidateAdmin();
}

export async function deleteListing(kind: ListingKind, id: string) {
  const adminId = await assertAdmin();
  switch (kind) {
    case "supply":
      await prisma.offer.deleteMany({ where: { supplyId: id } });
      await prisma.supply.delete({ where: { id } });
      break;
    case "demand":
      await prisma.offer.deleteMany({ where: { demandId: id } });
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
      await prisma.jobApplication.deleteMany({ where: { jobRequestId: id } });
      await prisma.jobRequest.delete({ where: { id } });
      break;
    case "futureHarvest":
      await prisma.preOffer.deleteMany({ where: { futureHarvestId: id } });
      await prisma.productBatch.updateMany({
        where: { futureHarvestId: id },
        data: { futureHarvestId: null },
      });
      await prisma.futureHarvest.delete({ where: { id } });
      break;
    case "space":
      await prisma.spaceListing.delete({ where: { id } });
      break;
    default:
      throw new Error("unknown_kind");
  }
  auditAdmin(adminId, "deleteListing", { kind, id });
  revalidateAdmin();
}

export async function togglePlanActive(planId: string, active: boolean) {
  const adminId = await assertAdmin();
  await prisma.plan.update({ where: { id: planId }, data: { active } });
  auditAdmin(adminId, "togglePlanActive", { planId, active });
  revalidateAdmin();
}

/**
 * Admin confirms a manual bank transfer → activate package (same fulfillPayment path).
 * Does not consume early-bird free slots (paid BANK_TRANSFER provider).
 */
export async function confirmBankPayment(paymentId: string) {
  const adminId = await assertAdmin();
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("not_found");
  if (payment.provider !== "BANK_TRANSFER") throw new Error("invalid_provider");
  if (payment.status === "SUCCEEDED") {
    revalidateAdmin();
    return;
  }
  if (payment.status !== "PENDING") throw new Error("invalid_status");

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(payment.metadataJson || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      metadataJson: JSON.stringify({
        ...meta,
        adminConfirmedAt: new Date().toISOString(),
      }),
    },
  });

  const { fulfillPayment, logPaymentEvent } = await import("@/lib/payments");
  const result = await fulfillPayment(payment.id);
  if (result !== "activated" && result !== "already") {
    throw new Error("fulfill_failed");
  }
  logPaymentEvent("bank_admin_confirmed", {
    paymentId: payment.id,
    userId: payment.userId,
    productCode: payment.productCode,
    amountAmd: payment.amountAmd,
    result,
  });
  auditAdmin(adminId, "confirmBankPayment", { paymentId });
  revalidateAdmin();
}
