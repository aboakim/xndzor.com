import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function otpSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "farmos-dev-otp";
}

export function hashOtp(otp: string, paymentId: string): string {
  return createHash("sha256")
    .update(`${otp}:${paymentId}:${otpSecret()}`)
    .digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const prefix = phone.startsWith("+") ? "+" : "";
  const country = digits.slice(0, 3);
  const last2 = digits.slice(-2);
  return `${prefix}${country}***${last2}`;
}

export function isDemoOtpInResponse(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.DEMO_OTP_IN_RESPONSE !== "true") return false;
  // Only when demo mode is explicitly allowed
  const demoFlag = process.env.DEMO_MODE?.trim().toLowerCase();
  if (demoFlag === "false") return false;
  if (demoFlag === "true") return true;
  return true; // legacy: OTP flag set and demo not explicitly disabled
}

export async function createOtpForPayment(paymentId: string): Promise<{
  otp: string;
  expiresAt: Date;
}> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const otpHash = hashOtp(otp, paymentId);

  await prisma.otpVerification.upsert({
    where: { paymentId },
    create: { paymentId, otpHash, expiresAt, attempts: 0 },
    update: { otpHash, expiresAt, attempts: 0 },
  });

  return { otp, expiresAt };
}

export async function verifyOtpForPayment(
  paymentId: string,
  otp: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const record = await prisma.otpVerification.findUnique({
    where: { paymentId },
  });

  if (!record) {
    return { ok: false, error: "otp_not_found" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "otp_expired" };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, error: "otp_max_attempts" };
  }

  const valid = record.otpHash === hashOtp(otp, paymentId);

  if (!valid) {
    await prisma.otpVerification.update({
      where: { paymentId },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - record.attempts - 1;
    if (remaining <= 0) {
      return { ok: false, error: "otp_max_attempts" };
    }
    return { ok: false, error: "otp_invalid" };
  }

  return { ok: true };
}

export { OTP_EXPIRY_MS, MAX_OTP_ATTEMPTS };
