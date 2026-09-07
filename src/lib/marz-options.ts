import { locationMarzes } from "@/lib/locations";

/** Static marz options for forms (never depends on an empty Neon Marz table). */
export function getMarzOptions(
  labelFor: (slug: string) => string,
): { id: string; slug: string; name: string; label: string }[] {
  return locationMarzes.map((m) => {
    const name = labelFor(m.slug);
    return { id: m.id, slug: m.slug, name, label: name };
  });
}
