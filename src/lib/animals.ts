/** Livestock / domestic animals marketplace constants. */

export const ANIMAL_TYPES = [
  "CATTLE",
  "COW",
  "BULL",
  "SHEEP",
  "GOAT",
  "PIG",
  "HORSE",
  "CHICKEN",
  "TURKEY",
  "BEE_COLONY",
  "DOG",
  "OTHER",
] as const;

export type AnimalType = (typeof ANIMAL_TYPES)[number];

export const ANIMAL_SEXES = ["MALE", "FEMALE", "MIXED"] as const;
export type AnimalSex = (typeof ANIMAL_SEXES)[number];

export const ANIMAL_PURPOSES = ["MEAT", "DAIRY", "BREEDING", "WORK", "PET", "OTHER"] as const;
export type AnimalPurpose = (typeof ANIMAL_PURPOSES)[number];

export const ANIMAL_AGE_UNITS = ["MONTHS", "YEARS"] as const;
export type AnimalAgeUnit = (typeof ANIMAL_AGE_UNITS)[number];

export const ANIMAL_PRICE_MODES = ["PER_HEAD", "LOT"] as const;
export type AnimalPriceMode = (typeof ANIMAL_PRICE_MODES)[number];

export const ANIMAL_STATUSES = ["ACTIVE", "SOLD", "HIDDEN"] as const;
