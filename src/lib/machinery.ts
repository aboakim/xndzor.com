/** Agricultural machinery marketplace constants (sales inventory, not job orders). */

export const MACHINERY_TYPES = [
  "TRACTOR",
  "COMBINE",
  "TRAILER",
  "CULTIVATOR",
  "SPRAYER",
  "TRUCK",
  "SEEDER",
  "OTHER",
] as const;

export type MachineryType = (typeof MACHINERY_TYPES)[number];

export const MACHINERY_CONDITIONS = ["NEW", "USED", "FOR_PARTS"] as const;

export type MachineryCondition = (typeof MACHINERY_CONDITIONS)[number];

export const MACHINERY_STATUSES = ["ACTIVE", "SOLD", "HIDDEN"] as const;

/** Types where mileage (km) is the primary usage metric */
export function prefersMileage(type: string): boolean {
  return type === "TRUCK" || type === "TRAILER";
}

/** Types where engine hours are typical */
export function prefersEngineHours(type: string): boolean {
  return (
    type === "TRACTOR" ||
    type === "COMBINE" ||
    type === "CULTIVATOR" ||
    type === "SPRAYER" ||
    type === "SEEDER"
  );
}
