import { getTranslations } from "next-intl/server";
import {
  buildPageMetadata,
  truncateMeta,
  type BuildPageMetadataInput,
} from "@/lib/seo";
import { parseImageUrls } from "@/lib/utils";

type ListingMetaInput = {
  locale: string;
  path: string;
  title: string;
  descriptionKey:
    | "listing.supplyDesc"
    | "listing.demandDesc"
    | "listing.animalDesc"
    | "listing.machineryDesc"
    | "listing.jobDesc"
    | "listing.forwardDesc"
    | "listing.catalogDesc";
  priceLabel: string;
  region: string;
  imageUrlsJson?: string | null;
  body?: string | null;
  noIndex?: boolean;
};

/** Dynamic listing detail metadata from DB fields + seo.listing.* copy. */
export async function listingPageMetadata({
  locale,
  path,
  title,
  descriptionKey,
  priceLabel,
  region,
  imageUrlsJson,
  body,
  noIndex,
}: ListingMetaInput) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const images = parseImageUrls(imageUrlsJson ?? "[]");
  const description = truncateMeta(
    t(descriptionKey, { title, price: priceLabel, region }) +
      (body ? ` ${truncateMeta(body, 80)}` : ""),
    160,
  );

  return buildPageMetadata({
    locale,
    path,
    title: truncateMeta(title, 70),
    description,
    images: images[0] ?? null,
    noIndex,
    ogType: "article",
  } satisfies BuildPageMetadataInput);
}

export function productJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  image?: string | null;
  priceAmd?: number | null;
  region?: string;
}) {
  const offer =
    opts.priceAmd != null && opts.priceAmd > 0
      ? {
          "@type": "Offer",
          priceCurrency: "AMD",
          price: String(opts.priceAmd),
          availability: "https://schema.org/InStock",
          url: opts.url,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: truncateMeta(opts.description, 300),
    ...(opts.image ? { image: [opts.image] } : {}),
    ...(opts.region
      ? {
          areaServed: {
            "@type": "AdministrativeArea",
            name: opts.region,
          },
        }
      : {}),
    ...(offer ? { offers: offer } : {}),
  };
}
