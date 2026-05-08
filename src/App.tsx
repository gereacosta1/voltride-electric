// src/App.tsx
import React, { useMemo, useState } from "react";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { products, ProductCategory } from "./data/products";
import { site } from "./config/site";
import { IconBolt } from "./components/icons";

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <div className="text-xs tracking-[.22em] uppercase text-[var(--muted)]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="h-serif mt-2 text-4xl leading-[1.02] md:text-5xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function AffirmReturnPage({ type }: { type: "confirm" | "cancel" }) {
  const isConfirm = type === "confirm";

  return (
    <div id="home" className="anchor min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="section">
          <div className="glass card p-6 md:p-10">
            <div className="badge inline-flex items-center gap-2">
              <IconBolt className="h-4 w-4" />
              {isConfirm ? "Affirm • Confirmation" : "Affirm • Canceled"}
            </div>

            <h1 className="h-serif mt-5 text-4xl leading-[1.02] md:text-5xl">
              {isConfirm
                ? "Thanks, your request was received."
                : "Affirm checkout was canceled."}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
              {isConfirm
                ? "If your financing application was approved, your request has been sent and the charge confirmation is handled by our checkout flow. If you need help, contact us and we’ll verify the order status."
                : "No charges were made. You can return to the store and try again whenever you’re ready."}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <a className="btn btn-primary px-6 py-3 text-center" href="/">
                Return to store
              </a>

              <a className="btn px-6 py-3 text-center" href={`mailto:${site.email}`}>
                Contact support
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="glass card p-4">
                <div className="font-black">Phone</div>
                <div className="mt-1 text-sm">
                  <a
                    className="underline decoration-white/20 hover:decoration-white/60"
                    href={`tel:${site.phoneE164}`}
                  >
                    {site.phonePretty}
                  </a>
                </div>
              </div>

              <div className="glass card p-4">
                <div className="font-black">Email</div>
                <div className="mt-1 text-sm">
                  <a
                    className="underline decoration-white/20 hover:decoration-white/60"
                    href={`mailto:${site.email}`}
                  >
                    {site.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 text-xs text-[var(--muted)]">
              {isConfirm
                ? "Tip: if you don’t see a final confirmation on our side, check Netlify Function logs for /affirm-authorize."
                : "You can also choose card checkout if you prefer."}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

function HomePage() {
  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 6), []);
  const [tab, setTab] = useState<"all" | ProductCategory>("all");

  const storeImages = [
    "/IMG/store-front.jpeg",
    "/IMG/store-inside.jpeg",
    "/IMG/tienda-fisica-voltride.jpeg",
  ];

  const filtered = useMemo(() => {
    if (tab === "all") return products;
    return products.filter((p) => p.category === tab);
  }, [tab]);

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(site.address || "Miami");
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, []);

  const featuredMinPrice = useMemo(() => {
    if (!featured.length) return 0;
    return Math.min(...featured.map((p) => Number(p.price) || 0));
  }, [featured]);

  return (
    <div id="home" className="anchor">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4">
        <section className="section">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="glass card p-6 md:p-10">
              <div className="badge inline-flex items-center gap-2">
                <IconBolt className="h-4 w-4" />
                Miami • Electric Mobility • Local Store
              </div>

              <h1 className="h-serif mt-5 text-5xl leading-[0.98] md:text-6xl">
                Clean power.
                <br />
                <span style={{ color: "rgba(229,231,235,.92)" }}>
                  Bold rides.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
                Premium scooters, e-bikes and accessories from Voltride Electric
                LLC. Visit our Miami store, ask about availability, or checkout
                online with card and Affirm options.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn btn-primary px-6 py-3"
                  onClick={() =>
                    document.getElementById("catalog")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  type="button"
                >
                  Browse catalog
                </button>

                <button
                  className="btn px-6 py-3"
                  onClick={() =>
                    document.getElementById("store")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  type="button"
                >
                  Visit store
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className="badge">Pay with Affirm</span>
                <span className="badge">Pay by card</span>
                <span className="badge">Local pickup</span>
                <span className="badge">Miami showroom</span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Featured items</div>
                  <div className="mt-1 text-2xl font-black">{featured.length}</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Checkout</div>
                  <div className="mt-1 text-2xl font-black">Fast</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Pickup</div>
                  <div className="mt-1 text-2xl font-black">Local</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Location</div>
                  <div className="mt-1 text-2xl font-black">Miami</div>
                </div>
              </div>
            </div>

            <div className="glass card relative overflow-hidden">
              <img
                src="/IMG/store-front.jpeg"
                alt="Voltride Electric storefront"
                className="absolute inset-0 h-full w-full object-cover opacity-70"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(217,70,239,.32), rgba(163,230,53,.20), rgba(34,211,238,.16))",
                }}
              />

              <div className="relative flex min-h-[420px] flex-col justify-end p-6 md:p-8">
                <div className="badge w-fit">Physical Store</div>

                <h2 className="h-serif mt-4 text-4xl leading-tight">
                  Visit Voltride Electric in Miami.
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  Scooters, e-bikes and accessories available for local pickup.
                  Message us first to confirm stock.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {storeImages.map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt="Voltride Electric store"
                      className="h-20 rounded-2xl border border-white/10 object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <a
                    className="btn btn-primary px-5 py-3 text-center"
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                  <a className="btn px-5 py-3 text-center" href={`mailto:${site.email}`}>
                    Email us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="featured">
          <SectionTitle
            eyebrow="Curated"
            title="Featured picks"
            subtitle="A clean selection of scooters, e-bikes and accessories ready for quick browsing."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="section anchor" id="catalog">
          <SectionTitle
            eyebrow="Catalog"
            title="Explore the lineup"
            subtitle="Filter by category and add items to your cart. Ask us about availability before pickup."
          />

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              className={`btn ${tab === "all" ? "btn-primary" : ""}`}
              onClick={() => setTab("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`btn ${tab === "scooters" ? "btn-primary" : ""}`}
              onClick={() => setTab("scooters")}
              type="button"
            >
              Scooters
            </button>
            <button
              className={`btn ${tab === "ebikes" ? "btn-primary" : ""}`}
              onClick={() => setTab("ebikes")}
              type="button"
            >
              E-bikes
            </button>
            <button
              className={`btn ${tab === "audio" ? "btn-primary" : ""}`}
              onClick={() => setTab("audio")}
              type="button"
            >
              Audio
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="section anchor" id="about">
          <SectionTitle
            eyebrow="About"
            title="Electric mobility with real local support"
            subtitle="Voltride Electric LLC helps customers choose scooters, e-bikes and accessories for daily city mobility."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="glass card p-6 md:p-8">
              <div className="h-serif text-3xl leading-tight">
                Shop online, then confirm pickup or availability with our team.
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                Browse the catalog, ask about the product you like, and we’ll help
                with availability, charger details, compatibility and pickup options.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="glass card p-4">
                  <div className="font-black">Scooters</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    Daily city rides
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">E-bikes</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    Comfortable mobility
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Accessories</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    Audio and extras
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Pickup help</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    Local support
                  </div>
                </div>
              </div>
            </div>

            <div className="glass card overflow-hidden">
              <img
                src="/IMG/store-inside.jpeg"
                alt="Voltride Electric showroom"
                className="h-72 w-full object-cover"
                loading="lazy"
              />

              <div className="p-6 md:p-8">
                <div className="text-xs uppercase tracking-[.22em] text-[var(--muted)]">
                  Quick store info
                </div>

                <div className="mt-4 space-y-3">
                  <div className="glass card p-4">
                    <div className="font-black">Address</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      {site.address}
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Phone</div>
                    <div className="mt-1 text-sm">
                      <a
                        className="underline decoration-white/20 hover:decoration-white/60"
                        href={`tel:${site.phoneE164}`}
                      >
                        {site.phonePretty}
                      </a>
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Email</div>
                    <div className="mt-1 text-sm">
                      <a
                        className="underline decoration-white/20 hover:decoration-white/60"
                        href={`mailto:${site.email}`}
                      >
                        {site.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section anchor" id="store">
          <SectionTitle
            eyebrow="Store"
            title="Visit our physical store"
            subtitle="A quick look at our storefront in Miami. Local pickup available — ask us for availability and options."
          />

          <div className="glass card p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[.8fr_1.4fr_.8fr]">
              <div className="glass card p-5">
                <div className="text-xs uppercase tracking-[.22em] text-[var(--muted)]">
                  Pickup essentials
                </div>

                <div className="mt-4">
                  <div className="font-black">Local pickup</div>
                  <div className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Reserve your item, we confirm availability, then you pick up
                    in-store. Fast and simple.
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="glass card p-4">
                    <div className="font-black">1. Ask about stock</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      Send the product name or screenshot.
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">2. We confirm</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      We confirm availability and pickup time.
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">3. Pickup</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      Come by the store and you’re good to go.
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass card overflow-hidden">
                <img
                  src="/IMG/tienda-fisica-voltride.jpeg"
                  alt="Voltride Electric LLC physical store"
                  loading="lazy"
                  className="h-[420px] w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

                <div className="grid grid-cols-3 gap-2 p-3">
                  {storeImages.map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt="Voltride Electric store"
                      className="h-24 w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--muted)]">
                    Address: <span className="text-white/90">{site.address}</span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <a
                      className="btn px-5 py-3 text-center"
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get directions
                    </a>
                    <button
                      className="btn btn-primary px-5 py-3"
                      onClick={() =>
                        document.getElementById("contact")?.scrollIntoView({
                          behavior: "smooth",
                        })
                      }
                      type="button"
                    >
                      Ask about pickup
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass card p-5">
                <div className="text-xs uppercase tracking-[.22em] text-[var(--muted)]">
                  Contact
                </div>

                <div className="mt-4 space-y-3">
                  <div className="glass card p-4">
                    <div className="font-black">Call / text</div>
                    <div className="mt-1 text-sm">
                      <a
                        className="underline decoration-white/20 hover:decoration-white/60"
                        href={`tel:${site.phoneE164}`}
                      >
                        {site.phonePretty}
                      </a>
                    </div>

                    <div className="mt-4 font-black">Email</div>
                    <div className="mt-1 text-sm">
                      <a
                        className="underline decoration-white/20 hover:decoration-white/60"
                        href={`mailto:${site.email}`}
                      >
                        {site.email}
                      </a>
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Pickup checklist</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                      <li>Bring ID recommended</li>
                      <li>Have product name ready</li>
                      <li>Ask for charger/specs</li>
                      <li>Confirm pickup time first</li>
                    </ul>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Payments</div>
                    <div className="mt-2 text-sm text-[var(--muted)]">
                      Card + Affirm options available online.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge">Affirm</span>
                      <span className="badge">Card</span>
                      <span className="badge">Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section anchor" id="contact">
          <SectionTitle
            eyebrow="Contact"
            title="Let’s get you on the road"
            subtitle="Ask about availability, pickup options, or recommendations. This form also works with Netlify Forms if you enable it."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_.9fr]">
            <form
              className="glass card p-6 md:p-8"
              name="contact"
              method="POST"
              data-netlify="true"
            >
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--muted)]">Name</label>
                  <input
                    name="name"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:ring-2"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--muted)]">Phone</label>
                  <input
                    name="phone"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    placeholder="(786) 000-0000"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-[var(--muted)]">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  placeholder="you@email.com"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs text-[var(--muted)]">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Tell us what you’re looking for…"
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button className="btn btn-primary px-6 py-3" type="submit">
                  Send message
                </button>

                <a className="btn px-6 py-3 text-center" href={`mailto:${site.email}`}>
                  Or email us
                </a>
              </div>

              <div className="mt-3 text-xs text-[var(--muted)]">
                Direct email: {site.email}
              </div>
            </form>

            <div className="glass card overflow-hidden">
              <img
                src="/IMG/store-front.jpeg"
                alt="Voltride Electric storefront"
                className="h-64 w-full object-cover"
                loading="lazy"
              />

              <div className="p-6 md:p-8">
                <div className="h-serif text-3xl leading-tight">
                  Need help choosing the right ride?
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  Contact us with the product name, your budget and how you plan to
                  use it. We can help you choose between scooters, e-bikes and
                  accessories.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="glass card p-4">
                    <div className="font-black">Best for quick city rides</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      Electric scooters
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Best for comfort</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      E-bikes
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Starting featured price</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      {money(featuredMinPrice)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-xs text-[var(--muted)]">
                  Email updated to: <b>{site.email}</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  const pathname =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "") || "/"
      : "/";

  const isAffirmConfirm = pathname === "/checkout/affirm/confirm";
  const isAffirmCancel = pathname === "/checkout/affirm/cancel";

  return (
    <I18nProvider>
      <CartProvider>
        {isAffirmConfirm ? (
          <AffirmReturnPage type="confirm" />
        ) : isAffirmCancel ? (
          <AffirmReturnPage type="cancel" />
        ) : (
          <HomePage />
        )}
      </CartProvider>
    </I18nProvider>
  );
}