import { z } from "zod";
import { MARZES } from "./locations";
import { JOB_TYPES } from "./matching";
import {
  ANIMAL_AGE_UNITS,
  ANIMAL_PRICE_MODES,
  ANIMAL_PURPOSES,
  ANIMAL_SEXES,
  ANIMAL_TYPES,
} from "./animals";
import {
  CATALOG_CATEGORIES,
  CATALOG_PRICE_UNITS,
  CATALOG_UNITS,
  COMMENT_TARGET_TYPES,
} from "./catalog";
import { MACHINERY_CONDITIONS, MACHINERY_TYPES } from "./machinery";

export const UNITS = ["kg", "ton", "liter", "piece", "box"] as const;

export const BUYER_KINDS = [
  "FACTORY",
  "SHOP_CHAIN",
  "RESTAURANT",
  "WHOLESALE",
  "EXPORTER",
  "OTHER",
] as const;

/** Legacy resource listing stubs (routes redirect to jobs) */
export const RESOURCE_TYPES = [
  "TRACTOR",
  "COMBINE",
  "SPRAYER",
  "TRANSPORT",
  "OTHER",
] as const;
export const RESOURCE_PRICE_UNITS = ["hour", "day", "ha", "job"] as const;

export const MAX_LISTING_IMAGES = 15;
/**
 * Server / post-compress limit. Must stay under Vercel serverless body (~4.5 MB)
 * with multipart overhead — one file per request.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
/** Client picker allows large phone photos; they are compressed before upload. */
export const MAX_IMAGE_PICK_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_TOTAL_BYTES = MAX_LISTING_IMAGES * MAX_IMAGE_BYTES;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
/** JPEG/PNG/WebP only — matches server magic-byte check (no HEIC). */
export const ALLOWED_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const imageUrlsField = z
  .array(z.string().min(1))
  .max(MAX_LISTING_IMAGES)
  .optional()
  .default([]);

/** Armenian (+374…) or international phone; digits, spaces, +, -, () allowed. */
const phoneField = z
  .string()
  .trim()
  .max(20)
  .refine(
    (v) => v === "" || /^[+]?[\d\s\-()]{8,20}$/.test(v),
    { message: "INVALID_PHONE" }
  );

export const registerSchema = z
  .object({
    email: z.string().trim().email({ message: "INVALID_EMAIL" }),
    password: z
      .string()
      .min(10, { message: "PASSWORD_TOO_SHORT" })
      .max(128, { message: "PASSWORD_TOO_LONG" }),
    name: z
      .string()
      .trim()
      .min(2, { message: "INVALID_NAME" })
      .max(80, { message: "INVALID_NAME" }),
    phone: phoneField.optional().or(z.literal("")),
    marz: z.enum(MARZES, { message: "INVALID_MARZ" }),
    /** Optional for Yerevan (city = marz). Required for other marzes. */
    villageId: z.string().trim().optional().or(z.literal("")),
    role: z
      .enum(["FARMER", "BUYER", "PROVIDER", "BOTH"])
      .optional()
      .default("BOTH"),
  })
  .superRefine((data, ctx) => {
    const villageId = (data.villageId || "").trim();
    if (data.marz !== "Yerevan" && !villageId) {
      ctx.addIssue({
        code: "custom",
        message: "VILLAGE_REQUIRED",
        path: ["villageId"],
      });
    }
  });

export type RegisterErrorCode =
  | "INVALID_EMAIL"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "INVALID_NAME"
  | "INVALID_PHONE"
  | "INVALID_MARZ"
  | "MARZ_REQUIRED"
  | "VILLAGE_REQUIRED"
  | "INVALID_VILLAGE"
  | "EMAIL_TAKEN"
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "SERVER_ERROR";

function refineVillageForMarz(
  data: { marzId: string; villageId?: string },
  ctx: z.RefinementCtx,
) {
  const villageId = (data.villageId || "").trim();
  /** Yerevan is the city itself — district/village is optional. */
  if (data.marzId !== "Yerevan" && !villageId) {
    ctx.addIssue({
      code: "custom",
      message: "VILLAGE_REQUIRED",
      path: ["villageId"],
    });
  }
}

export const demandSchema = z
  .object({
    title: z.string().min(5).max(120),
    description: z.string().min(10).max(8000),
    productId: z.string().min(1),
    qtyMin: z.coerce.number().int().positive().max(10_000_000),
    qtyMax: z.coerce.number().int().positive().max(10_000_000).optional().or(z.literal("")),
    unit: z.enum(UNITS),
    priceMinAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
    priceMaxAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
    buyerKind: z.enum(BUYER_KINDS).optional().default("WHOLESALE"),
    timingNote: z.string().max(200).optional().or(z.literal("")),
    marzId: z.enum(MARZES),
    villageId: z.string().optional().or(z.literal("")),
    phone: z.string().min(8).max(20),
    whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
    imageUrls: imageUrlsField,
  })
  .superRefine(refineVillageForMarz);

export const supplySchema = z
  .object({
    title: z.string().min(5).max(120),
    description: z.string().min(10).max(8000),
    productId: z.string().min(1),
    qtyAvailable: z.coerce.number().int().positive().max(10_000_000),
    unit: z.enum(UNITS),
    priceAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
    readyInDays: z.coerce.number().int().nonnegative().max(365).default(0),
    marzId: z.enum(MARZES),
    villageId: z.string().optional().or(z.literal("")),
    phone: z.string().min(8).max(20),
    whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
    imageUrls: imageUrlsField,
  })
  .superRefine(refineVillageForMarz);
export const offerSchema = z.object({
  supplyId: z.string().min(1),
  demandId: z.string().min(1),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const jobRequestSchema = z.object({
  jobType: z.enum(JOB_TYPES),
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(4000),
  hectares: z.coerce.number().positive().max(100_000).optional().or(z.literal("")),
  areaNote: z.string().max(200).optional().or(z.literal("")),
  workDate: z.string().optional().or(z.literal("")),
  budgetAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
});

export const providerSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(4000),
  jobTypes: z.array(z.enum(JOB_TYPES)).min(1),
  coverageNote: z.string().max(200).optional().or(z.literal("")),
  hectaresMax: z.coerce.number().positive().max(100_000).optional().or(z.literal("")),
  rateAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  rateUnit: z.enum(["ha", "day", "job"]).optional().default("ha"),
  availableFrom: z.string().optional().or(z.literal("")),
  availableTo: z.string().optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
});

export const jobApplicationSchema = z.object({
  jobRequestId: z.string().min(1),
  providerId: z.string().min(1),
  message: z.string().max(1000).optional().or(z.literal("")),
  proposedPriceAmd: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
});

export const futureHarvestSchema = z.object({
  productId: z.string().min(1),
  plotId: z.string().optional().or(z.literal("")),
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(4000),
  qtyExpected: z.coerce.number().int().positive().max(10_000_000),
  unit: z.enum(UNITS),
  harvestDate: z.string().min(4),
  priceAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
  imageUrls: imageUrlsField,
});

/** @deprecated alias */
export const forwardCropSchema = futureHarvestSchema;

export const preOfferSchema = z.object({
  futureHarvestId: z.string().min(1),
  qtyWanted: z.coerce.number().int().positive(),
  message: z.string().max(1000).optional().or(z.literal("")),
});

/** Accept legacy forwardCropId from older clients */
export const forwardInterestSchema = z
  .object({
    futureHarvestId: z.string().min(1).optional(),
    forwardCropId: z.string().min(1).optional(),
    qtyWanted: z.coerce.number().int().positive(),
    message: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => d.futureHarvestId || d.forwardCropId, {
    message: "futureHarvestId required",
  });

export const plotSchema = z.object({
  name: z.string().min(2).max(120),
  hectares: z.coerce.number().positive().max(100_000),
  cropProductId: z.string().min(1),
  plantDate: z.string().min(4),
  irrigationNotes: z.string().max(2000).optional().or(z.literal("")),
  lastFertilizer: z.string().max(500).optional().or(z.literal("")),
  lastIrrigationAt: z.string().optional().or(z.literal("")),
  harvestFrom: z.string().optional().or(z.literal("")),
  harvestTo: z.string().optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  farmerOverrideTons: z.coerce.number().positive().max(1_000_000).optional().or(z.literal("")),
});

export const yieldOverrideSchema = z.object({
  plotId: z.string().min(1),
  farmerOverrideTons: z.coerce.number().positive().max(1_000_000),
});

export const plotTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["OPEN", "DONE", "SKIPPED"]),
});

export const plotPhotoSchema = z.object({
  plotId: z.string().min(1),
  imageUrl: z.string().min(1),
});
export const groupBuySchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(4000),
  targetQty: z.coerce.number().int().positive().max(10_000_000),
  unit: z.enum(UNITS),
  pricePerUnitAmd: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  marzId: z.enum(MARZES).optional().or(z.literal("")),
});

export const groupBuyJoinSchema = z.object({
  campaignId: z.string().min(1),
  qty: z.coerce.number().int().positive(),
});

export const machineryListingSchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(12000),
  machineryType: z.enum(MACHINERY_TYPES),
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  year: z.coerce.number().int().min(1950).max(2100),
  engineHours: z.coerce.number().int().nonnegative().max(100_000).optional().or(z.literal("")),
  mileageKm: z.coerce.number().int().nonnegative().max(10_000_000).optional().or(z.literal("")),
  condition: z.enum(MACHINERY_CONDITIONS),
  priceAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  priceNegotiable: z.boolean().optional().default(false),
  powerHp: z.coerce.number().int().positive().max(2000).optional().or(z.literal("")),
  transmission: z.string().max(80).optional().or(z.literal("")),
  driveType: z.string().max(80).optional().or(z.literal("")),
  fuel: z.string().max(80).optional().or(z.literal("")),
  workingWidth: z.string().max(80).optional().or(z.literal("")),
  capacity: z.string().max(120).optional().or(z.literal("")),
  attachments: z.string().max(500).optional().or(z.literal("")),
  documentsNote: z.string().max(500).optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
  imageUrls: imageUrlsField,
});

export const machineryStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]),
});

export const animalListingSchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(12000),
  animalType: z.enum(ANIMAL_TYPES),
  breed: z.string().min(1).max(80),
  sex: z.enum(ANIMAL_SEXES),
  ageValue: z.coerce.number().int().nonnegative().max(600).optional().or(z.literal("")),
  ageUnit: z.enum(ANIMAL_AGE_UNITS).optional().default("MONTHS"),
  weightKg: z.coerce.number().positive().max(10_000).optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive().max(100_000).default(1),
  purpose: z.enum(ANIMAL_PURPOSES),
  vaccinated: z.boolean().optional().default(false),
  healthNotes: z.string().max(2000).optional().or(z.literal("")),
  documentsNote: z.string().max(500).optional().or(z.literal("")),
  pedigreeNote: z.string().max(500).optional().or(z.literal("")),
  priceAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  priceNegotiable: z.boolean().optional().default(false),
  priceMode: z.enum(ANIMAL_PRICE_MODES).optional().default("LOT"),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
  imageUrls: imageUrlsField,
});

export const animalStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]),
});

export const supplyStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]),
});

export const demandStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]),
});

export const jobStatusSchema = z.object({
  status: z.enum(["ACTIVE", "FILLED", "HIDDEN"]),
});

export const forwardStatusSchema = z.object({
  status: z.enum(["ACTIVE", "RESERVED", "SOLD", "HIDDEN"]),
});

export const catalogListingSchema = z.object({
  category: z.enum(CATALOG_CATEGORIES),
  subtype: z.string().min(1).max(40),
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(12000),
  brand: z.string().max(80).optional().or(z.literal("")),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
  quantity: z.coerce.number().positive().max(10_000_000).optional().or(z.literal("")),
  unit: z.enum(CATALOG_UNITS).optional().or(z.literal("")),
  packageSize: z.string().max(80).optional().or(z.literal("")),
  priceAmd: z.coerce.number().int().nonnegative().max(10_000_000_000).optional().or(z.literal("")),
  priceNegotiable: z.boolean().optional().default(false),
  priceUnit: z.enum(CATALOG_PRICE_UNITS).optional().default("LOT"),
  expiryDate: z.string().optional().or(z.literal("")),
  marzId: z.enum(MARZES),
  villageId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().min(8).max(20).optional().or(z.literal("")),
  imageUrls: imageUrlsField,
});

export const catalogStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SOLD", "HIDDEN"]),
});

export const commentSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES),
  targetId: z.string().min(1).max(40),
  body: z.string().min(2).max(2000),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "INVALID_NAME" })
    .max(80, { message: "INVALID_NAME" })
    .optional(),
  phone: phoneField.optional().or(z.literal("")),
  marzId: z.enum(MARZES).optional().or(z.literal("")),
  villageId: z.string().trim().optional().or(z.literal("")),
  avatarUrl: z.string().max(500).optional().or(z.literal("")),
  profileVisibility: z.enum(["PUBLIC", "REGISTERED", "HIDDEN"]).optional(),
  showPhonePublic: z.boolean().optional(),
  showAvatarPublic: z.boolean().optional(),
  showMarzPublic: z.boolean().optional(),
  showVillagePublic: z.boolean().optional(),
});
