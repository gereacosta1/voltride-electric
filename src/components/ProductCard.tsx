// src/components/ProductCard.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCart } from "../context/CartContext";
import type { Product } from "../data/products";

const FALLBACK_IMAGE = "/fallback.png";
const ADDED_FEEDBACK_MS = 1_200;

function safeSrc(src?: string) {
  const value = String(src || "").trim();

  if (!value) {
    return FALLBACK_IMAGE;
  }

  try {
    return encodeURI(value);
  } catch {
    return FALLBACK_IMAGE;
  }
}

function safeText(
  value: unknown,
  fallback = ""
) {
  const text = String(
    value ?? ""
  ).trim();

  return text || fallback;
}

function formatUsd(value: number) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(
    Number.isFinite(numericValue)
      ? Math.max(0, numericValue)
      : 0
  );
}

function categoryLabel(
  category: Product["category"]
) {
  if (category === "scooters") {
    return "Scooter";
  }

  if (category === "ebikes") {
    return "E-Bike";
  }

  return "Audio";
}

function handleImageError(
  event: React.SyntheticEvent<
    HTMLImageElement
  >
) {
  const image =
    event.currentTarget;

  const currentSrc =
    image.getAttribute("src") || "";

  if (
    currentSrc.endsWith(
      FALLBACK_IMAGE
    )
  ) {
    return;
  }

  image.onerror = null;
  image.src = FALLBACK_IMAGE;
}

export default function ProductCard({
  p,
}: {
  p: Product;
}) {
  const { addItem } = useCart();

  const [activeImage, setActiveImage] =
    useState(
      safeText(
        p.image,
        FALLBACK_IMAGE
      )
    );

  const [added, setAdded] =
    useState(false);

  const addedTimerRef =
    useRef<number | null>(null);

  const images = useMemo(() => {
    const candidates = [
      p.image,
      ...(Array.isArray(p.gallery)
        ? p.gallery
        : []),
    ];

    const normalized =
      candidates
        .map((image) =>
          safeText(image)
        )
        .filter(
          (image): image is string =>
            Boolean(image)
        );

    return Array.from(
      new Set(normalized)
    );
  }, [p.image, p.gallery]);

  useEffect(() => {
    const primaryImage =
      safeText(
        p.image,
        FALLBACK_IMAGE
      );

    setActiveImage(
      images.includes(primaryImage)
        ? primaryImage
        : images[0] ||
            FALLBACK_IMAGE
    );
  }, [p.image, images]);

  useEffect(() => {
    return () => {
      if (
        typeof window !==
          "undefined" &&
        addedTimerRef.current !==
          null
      ) {
        window.clearTimeout(
          addedTimerRef.current
        );
      }
    };
  }, []);

  const label = categoryLabel(
    p.category
  );

  const numericPrice =
    Number(p.price);

  const price =
    Number.isFinite(numericPrice)
      ? Math.max(
          0,
          numericPrice
        )
      : 0;

  const title = safeText(
    p.name,
    "Unnamed product"
  );

  const image = safeText(
    p.image
  );

  const description =
    safeText(p.description);

  function handleAddToCart() {
    addItem({
      id: String(p.id),
      name: title,
      price,
      qty: 1,
      sku: String(p.id),
      image,
      url: "#catalog",
    });

    setAdded(true);

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    if (
      addedTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        addedTimerRef.current
      );
    }

    addedTimerRef.current =
      window.setTimeout(() => {
        setAdded(false);
        addedTimerRef.current =
          null;
      }, ADDED_FEEDBACK_MS);
  }

  function handleAsk() {
    if (
      typeof document ===
      "undefined"
    ) {
      return;
    }

    document
      .getElementById("contact")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_18px_60px_rgba(0,0,0,.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_26px_90px_rgba(0,0,0,.35)]">
      <div className="relative overflow-hidden">
        <img
          className="h-60 w-full object-cover transition duration-700 group-hover:scale-[1.06]"
          src={safeSrc(activeImage)}
          alt={title}
          loading="lazy"
          onError={
            handleImageError
          }
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
          aria-hidden="true"
        >
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime-300/20 blur-3xl" />

          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
        </div>

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            {label}
          </span>

          {p.featured ? (
            <span className="rounded-full border border-lime-300/35 bg-lime-300/15 px-3 py-1 text-xs font-bold text-lime-100 backdrop-blur-md">
              Featured
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-black text-white drop-shadow">
              {title}
            </div>

            <div className="truncate text-xs font-medium text-white/65">
              {safeText(
                p.brand,
                "Brand"
              )}{" "}
              •{" "}
              {safeText(
                p.model,
                "Model"
              )}{" "}
              •{" "}
              {safeText(
                p.year,
                "-"
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-right backdrop-blur-md">
            <div className="text-sm font-black text-white">
              {formatUsd(price)}
            </div>

            <div className="text-[10px] uppercase tracking-wide text-white/50">
              {safeText(
                p.condition,
                "Available"
              )}
            </div>
          </div>
        </div>

        {images.length > 1 ? (
          <div
            className="absolute bottom-[86px] left-4 right-4 flex gap-2 overflow-x-auto pb-1"
            aria-label={`${title} images`}
          >
            {images
              .slice(0, 5)
              .map(
                (
                  imageSrc,
                  index
                ) => {
                  const selected =
                    activeImage ===
                    imageSrc;

                  return (
                    <button
                      key={imageSrc}
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          imageSrc
                        )
                      }
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-2xl border bg-black/40 p-0.5 transition hover:scale-105 ${
                        selected
                          ? "border-lime-300 shadow-[0_0_0_2px_rgba(190,242,100,.2)]"
                          : "border-white/15 hover:border-white/45"
                      }`}
                      aria-label={`View ${title} image ${
                        index +
                        1
                      }`}
                      aria-pressed={
                        selected
                      }
                    >
                      <img
                        src={safeSrc(
                          imageSrc
                        )}
                        alt=""
                        className="h-full w-full rounded-[14px] object-cover"
                        loading="lazy"
                        onError={
                          handleImageError
                        }
                      />
                    </button>
                  );
                }
              )}
          </div>
        ) : null}
      </div>

      <div className="p-5">
        {description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Ask us for
            availability, pickup
            options, and current
            product details.
          </p>
        )}

        {Array.isArray(
          p.features
        ) &&
        p.features.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.features
              .slice(0, 3)
              .map((feature) => {
                const text =
                  safeText(
                    feature
                  );

                if (!text) {
                  return null;
                }

                return (
                  <span
                    key={text}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/60 transition group-hover:border-white/15 group-hover:text-white/75"
                  >
                    {text}
                  </span>
                );
              })}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-4 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[.98]"
            onClick={
              handleAddToCart
            }
            type="button"
            aria-live="polite"
          >
            {added
              ? "Added"
              : "Add to cart"}
          </button>

          <button
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/85 transition hover:bg-white/[0.1] hover:text-white active:scale-[.98]"
            onClick={handleAsk}
            type="button"
            aria-label={`Ask about ${title}`}
          >
            Ask about it
          </button>
        </div>
      </div>
    </article>
  );
}