type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Valid JSON-LD script for Organization, Product, BreadcrumbList, etc. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
