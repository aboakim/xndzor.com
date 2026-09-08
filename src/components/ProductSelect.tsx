"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { ProductIcon } from "@/components/AgIcons";
import {
  groupProductsByCategory,
  type CatalogProduct,
} from "@/lib/products";

type ProductOption = Pick<
  CatalogProduct,
  "id" | "slug" | "nameKey" | "sortOrder" | "category"
>;

type ProductSelectProps = {
  products: ProductOption[];
  value: string;
  onChange: (next: string) => void;
  /** Forms use DB id; board filters use slug in the URL. */
  valueKey?: "id" | "slug";
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Placeholder when value is empty (e.g. “All products”). */
  emptyLabel?: string;
  allowEmpty?: boolean;
  className?: string;
  id?: string;
};

/**
 * Accessible product picker with category groups, Ա→Ֆ sort, and inline icons.
 * Replaces native `<select>` which cannot render images in options.
 */
export function ProductSelect({
  products,
  value,
  onChange,
  valueKey = "id",
  name,
  required,
  disabled,
  emptyLabel,
  allowEmpty = false,
  className,
  id,
}: ProductSelectProps) {
  const t = useTranslations();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => groupProductsByCategory(products), [products]);

  const selected = products.find((p) => p[valueKey] === value);
  const selectedLabel = selected
    ? t(selected.nameKey as "products.tomato")
    : emptyLabel || t("forms.selectEmpty");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !value || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      `[data-value="${CSS.escape(value)}"]`,
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div
      className={`product-select${className ? ` ${className}` : ""}${open ? " open" : ""}`}
      ref={rootRef}
    >
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        type="button"
        id={id}
        className="product-select-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        {selected ? (
          <ProductIcon slugOrKey={selected.slug} size={18} className="product-select-icon" />
        ) : (
          <span className="product-select-icon-spacer" aria-hidden />
        )}
        <span className="product-select-label">{selectedLabel}</span>
        <svg
          className={`product-select-chevron${open ? " open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          id={listId}
          className="product-select-panel"
          role="listbox"
          aria-label={selectedLabel}
          ref={listRef}
        >
          {allowEmpty ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              data-value=""
              className={`product-select-option${!value ? " active" : ""}`}
              onClick={() => choose("")}
            >
              <span className="product-select-icon-spacer" aria-hidden />
              <span>{emptyLabel || t("board.allProducts")}</span>
            </button>
          ) : null}

          {groups.map((group) => (
            <div key={group.id} className="product-select-group" role="group">
              <div className="product-select-group-label">
                {t(group.nameKey as "productCategories.vegetables")}
              </div>
              {group.products.map((p) => {
                const optValue = p[valueKey];
                const active = optValue === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-value={optValue}
                    className={`product-select-option${active ? " active" : ""}`}
                    onClick={() => choose(optValue)}
                  >
                    <ProductIcon
                      slugOrKey={p.slug}
                      size={16}
                      className="product-select-icon"
                    />
                    <span>{t(p.nameKey as "products.tomato")}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
