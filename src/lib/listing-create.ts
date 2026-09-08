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

/**
 * Map API / upload errors to i18n keys under `listingErrors.*` or `images.*`.
 * Falls back to a generic publish-failed key when unknown.
 */
export function listingErrorI18nKey(error: unknown): string {
  if (typeof error === "string") {
    const trimmed = error.trim();
    const byExact: Record<string, string> = {
      Unauthorized: "listingErrors.unauthorized",
      "Village required": "listingErrors.villageRequired",
      "Invalid product": "listingErrors.invalidProduct",
      "Invalid marz": "listingErrors.invalidMarz",
      "Village must belong to marz": "listingErrors.invalidVillage",
      VALIDATION: "listingErrors.invalidInput",
      INVALID_INPUT: "listingErrors.invalidInput",
      IMAGE_TOO_LARGE: "listingErrors.imageTooLarge",
      UPLOAD_FAILED: "images.uploadError",
      NETWORK_ERROR: "listingErrors.network",
    };
    if (byExact[trimmed]) return byExact[trimmed];
    if (/could not publish/i.test(trimmed)) return "listingErrors.publishFailed";
    if (/image too large/i.test(trimmed)) return "listingErrors.imageTooLarge";
    if (/upload failed/i.test(trimmed)) return "images.uploadError";
    if (/network/i.test(trimmed)) return "listingErrors.network";
    // Prefer localized generic over raw English server strings.
    if (/^[A-Za-z]/.test(trimmed) && trimmed.length > 40) {
      return "listingErrors.publishFailed";
    }
    return "listingErrors.publishFailed";
  }
  if (error && typeof error === "object") {
    return "listingErrors.invalidInput";
  }
  return "listingErrors.publishFailed";
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
