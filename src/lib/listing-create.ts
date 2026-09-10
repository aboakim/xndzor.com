/** Shared helpers for supply / demand / forward create flows. */

export function isVillageOptionalForMarz(marzId: string): boolean {
  return marzId === "Yerevan";
}

export function locationReadyForSubmit(
  marzId: string,
  villageId: string,
): boolean {
  if (!marzId) return false;
  if (isVillageOptionalForMarz(marzId)) return true;
  return Boolean(villageId);
}

export type ListingField =
  | "product"
  | "marz"
  | "village"
  | "phone"
  | "title"
  | "description"
  | "qty"
  | "other";

export type ResolvedListingError = {
  /** i18n key under listingErrors.* or images.* */
  key: string;
  values?: Record<string, string | number>;
  field?: ListingField;
};

const FIELD_TO_KEY: Record<string, ResolvedListingError> = {
  productId: { key: "listingErrors.invalidProduct", field: "product" },
  marzId: { key: "listingErrors.invalidMarz", field: "marz" },
  villageId: { key: "listingErrors.villageRequired", field: "village" },
  phone: { key: "listingErrors.phoneInvalid", field: "phone" },
  whatsapp: { key: "listingErrors.phoneInvalid", field: "phone" },
  title: { key: "listingErrors.titleInvalid", field: "title" },
  description: { key: "listingErrors.descriptionInvalid", field: "description" },
  qtyAvailable: { key: "listingErrors.qtyInvalid", field: "qty" },
  qtyMin: { key: "listingErrors.qtyInvalid", field: "qty" },
  qtyExpected: { key: "listingErrors.qtyInvalid", field: "qty" },
};

function mapFieldName(field: string | undefined | null): ResolvedListingError | null {
  if (!field) return null;
  return FIELD_TO_KEY[field] ?? null;
}

function mapExactString(trimmed: string): ResolvedListingError | null {
  const byExact: Record<string, ResolvedListingError> = {
    Unauthorized: { key: "listingErrors.unauthorized" },
    "Village required": { key: "listingErrors.villageRequired", field: "village" },
    "Invalid product": { key: "listingErrors.invalidProduct", field: "product" },
    "Invalid marz": { key: "listingErrors.invalidMarz", field: "marz" },
    "Village must belong to marz": {
      key: "listingErrors.invalidVillage",
      field: "village",
    },
    VALIDATION: { key: "listingErrors.invalidInput" },
    INVALID_INPUT: { key: "listingErrors.invalidInput" },
    IMAGE_TOO_LARGE: { key: "listingErrors.imageTooLarge" },
    UPLOAD_FAILED: { key: "images.uploadError" },
    NETWORK_ERROR: { key: "listingErrors.network" },
    STORAGE_ERROR: { key: "listingErrors.storageUnavailable" },
    RATE_LIMITED: { key: "listingErrors.uploadRateLimited" },
    INVALID_TYPE: { key: "images.invalidType" },
  };
  if (byExact[trimmed]) return byExact[trimmed];

  if (/could not publish/i.test(trimmed)) {
    return { key: "listingErrors.publishFailed" };
  }
  if (/image too large|under \d+ MB|exceeds limit|413/i.test(trimmed)) {
    return { key: "listingErrors.imageTooLarge" };
  }
  if (/BLOB_READ_WRITE_TOKEN|not configured|Image storage/i.test(trimmed)) {
    return { key: "listingErrors.storageUnavailable" };
  }
  if (/too many uploads|rate.?limit/i.test(trimmed)) {
    return { key: "listingErrors.uploadRateLimited" };
  }
  if (/Only JPEG|PNG, or WebP|invalid type/i.test(trimmed)) {
    return { key: "images.invalidType" };
  }
  if (/upload failed|No files|Invalid form data|Invalid filename/i.test(trimmed)) {
    return { key: "images.uploadError" };
  }
  if (/network|failed to fetch|Load failed|NetworkError/i.test(trimmed)) {
    return { key: "listingErrors.network" };
  }
  if (/Unauthorized|sign in|login/i.test(trimmed)) {
    return { key: "listingErrors.unauthorized" };
  }
  return null;
}

/**
 * Map API / upload errors (string codes, English server text, or `{ error, field }`)
 * to i18n keys under `listingErrors.*` or `images.*`.
 */
export function resolveListingError(payload: unknown): ResolvedListingError {
  if (payload == null) {
    return { key: "listingErrors.publishFailed" };
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return mapExactString(trimmed) ?? { key: "listingErrors.publishFailed" };
  }

  if (typeof payload === "object") {
    const obj = payload as {
      error?: unknown;
      field?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };

    const fromField = mapFieldName(obj.field);
    if (fromField) return fromField;

    if (obj.fieldErrors) {
      for (const field of Object.keys(obj.fieldErrors)) {
        const mapped = mapFieldName(field);
        if (mapped) return mapped;
      }
      return { key: "listingErrors.invalidInput" };
    }

    if (typeof obj.error === "string") {
      if (obj.error === "INVALID_INPUT" || obj.error === "VALIDATION") {
        return mapFieldName(obj.field) ?? { key: "listingErrors.invalidInput" };
      }
      return mapExactString(obj.error.trim()) ?? {
        key: "listingErrors.publishFailed",
      };
    }

    if (obj.error && typeof obj.error === "object") {
      const nested = obj.error as {
        fieldErrors?: Record<string, string[] | undefined>;
        field?: string;
      };
      if (nested.fieldErrors) {
        for (const field of Object.keys(nested.fieldErrors)) {
          const mapped = mapFieldName(field);
          if (mapped) return mapped;
        }
      }
      return mapFieldName(nested.field) ?? { key: "listingErrors.invalidInput" };
    }

    return { key: "listingErrors.invalidInput" };
  }

  return { key: "listingErrors.publishFailed" };
}

/** @deprecated Prefer resolveListingError — kept for callers that only need a key. */
export function listingErrorI18nKey(error: unknown): string {
  return resolveListingError(error).key;
}

export function firstZodField(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const flat = error as {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
  if (flat.fieldErrors) {
    for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs && msgs.length > 0) return field;
    }
  }
  return null;
}

export type UploadFailure = {
  /** 0-based index within the batch that was just uploaded */
  index: number;
  file: File;
  code: string;
};

export type UploadBatchResult = {
  urls: string[];
  failedFiles: File[];
  errors: string[];
  failures: UploadFailure[];
};

/** Classify a raw upload error code/message into a stable reason key. */
export function uploadFailureReasonKey(
  code: string,
): "tooLarge" | "network" | "unauthorized" | "storage" | "rateLimited" | "invalidType" | "generic" {
  const c = code.trim();
  if (c === "IMAGE_TOO_LARGE" || /too large|413|under \d+ MB/i.test(c)) {
    return "tooLarge";
  }
  if (c === "NETWORK_ERROR" || /network/i.test(c)) return "network";
  if (c === "Unauthorized" || /Unauthorized/i.test(c)) return "unauthorized";
  if (c === "STORAGE_ERROR" || /BLOB|not configured|storage/i.test(c)) {
    return "storage";
  }
  if (c === "RATE_LIMITED" || /too many uploads/i.test(c)) return "rateLimited";
  if (c === "INVALID_TYPE" || /JPEG|WebP|PNG/i.test(c)) return "invalidType";
  return "generic";
}

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * Build a clear form-level message for partial / total image upload failures.
 * Photo numbers are 1-based in the overall listing (existing OK + batch index).
 */
export function formatUploadBatchError(
  t: TranslateFn,
  result: Pick<UploadBatchResult, "urls" | "failures">,
  alreadyOkCount: number,
): string {
  const ok = alreadyOkCount + result.urls.length;
  const failures = result.failures;
  if (failures.length === 0) {
    return t("images.uploadError");
  }

  const reasonKey = uploadFailureReasonKey(failures[0].code);
  const reason = t(`images.failReason.${reasonKey}`);
  const nums = failures
    .map((f) => alreadyOkCount + f.index + 1)
    .join(", ");
  const continueHint =
    ok > 0 ? t("images.continueHint") : t("images.retryHint");

  if (failures.length === 1) {
    return t("images.photoFailOne", {
      n: alreadyOkCount + failures[0].index + 1,
      reason,
      hint: continueHint,
    });
  }

  return t("images.photoFailMany", {
    nums,
    failed: failures.length,
    ok,
    reason,
    hint: continueHint,
  });
}
