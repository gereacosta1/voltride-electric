//src/App.tsx
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);
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
      {eyebrow ? <div className="text-xs tracking-[.22em] uppercase text-[var(--muted)]">{eyebrow}</div> : null}
      <h2 className="h-serif text-4xl md:text-5xl leading-[1.02] mt-2">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function HomePage() {
  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 6), []);
  const [tab, setTab] = useState<"all" | ProductCategory>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return products;
    return products.filter((p) => p.category === tab);
  }, [tab]);

  return (
    <div id="home" className="anchor">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="section">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_.75fr] gap-6 items-stretch">
            <div className="glass card p-6 md:p-10">
              <div className="inline-flex items-center gap-2 badge">
                <IconBolt className="h-4 w-4" />
                Miami • Electric Mobility • Fast Checkout
              </div>

              <h1 className="h-serif mt-5 text-5xl md:text-6xl leading-[0.98]">
                Clean power.
                <br />
                <span style={{ color: "rgba(229,231,235,.92)" }}>Bold rides.</span>
              </h1>

              <p className="mt-4 text-sm md:text-base text-[var(--muted)] max-w-xl leading-relaxed">
                Premium scooters, e-bikes and accessories. A modern storefront with smooth navigation,
                a pro cart experience, and checkout options built for conversion.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button
                  className="btn btn-primary px-6 py-3"
                  onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
                  type="button"
                >
                  Browse catalog
                </button>

                <button
                  className="btn px-6 py-3"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  type="button"
                >
                  Get a quote
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className="badge">Pay with Affirm</span>
                <span className="badge">Pay by card</span>
                <span className="badge">Local pickup</span>
                <span className="badge">Support-ready</span>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Featured items</div>
                  <div className="text-2xl font-black mt-1">{featured.length}</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Checkout</div>
                  <div className="text-2xl font-black mt-1">Fast</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Style</div>
                  <div className="text-2xl font-black mt-1">Modern</div>
                </div>
                <div className="glass card p-4">
                  <div className="text-xs text-[var(--muted)]">Location</div>
                  <div className="text-2xl font-black mt-1">Miami</div>
                </div>
              </div>
            </div>

            {/* SIDE PANEL (corte tipo CartCoders) */}
            <div className="glass card overflow-hidden relative">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(217,70,239,.35), rgba(163,230,53,.20), rgba(34,211,238,.18))",
                  filter: "blur(0px)",
                }}
              />
              <div className="relative p-6 md:p-8">
                <div className="text-xs tracking-[.22em] uppercase text-white/70">Today’s highlights</div>

                <div className="mt-4 space-y-3">
                  <div className="glass card p-4">
                    <div className="font-black">Best sellers</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      Scooters + E-bikes curated for city comfort.
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Premium feel</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      A gradient editorial UI with smooth sections (no hard cuts).
                    </div>
                  </div>

                  <div className="glass card p-4">
                    <div className="font-black">Need help?</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      Message us for pricing, availability, and pickup options.
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-xs text-[var(--muted)]">
                  Address: {site.address}
                </div>
              </div>

              {/* diagonal cut */}
              <div
                className="absolute -bottom-20 -right-20 w-[260px] h-[260px]"
                style={{
                  background: "rgba(0,0,0,.32)",
                  transform: "rotate(20deg)",
                  borderRadius: 36,
                }}
              />
            </div>
          </div>
        </section>

        {/* FEATURED */}
        <section className="section" id="featured">
          <SectionTitle
            eyebrow="Curated"
            title="Featured picks"
            subtitle="A clean set of products to make the home feel full and premium. Add more items anytime and the layout stays consistent."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* CATALOG */}
        <section className="section anchor" id="catalog">
          <SectionTitle
            eyebrow="Catalog"
            title="Explore the lineup"
            subtitle="Filter by category and add items to your cart. Designed to feel like a real store — not a demo."
          />

          <div className="flex flex-wrap gap-2 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section className="section anchor" id="about">
          <SectionTitle
            eyebrow="About"
            title="Built for a premium conversion flow"
            subtitle="The goal is a site that looks modern, feels full, and converts. Simple structure, high-end UI, strong cart, and clean checkout."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass card p-6 md:p-8">
              <div className="h-serif text-3xl leading-tight">
                We blend electric mobility with a clean, editorial design.
              </div>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                This layout keeps sections visually connected (difuminado) so the page feels like one
                premium experience — not separate blocks. Perfect for adding more products and sections later.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="glass card p-4">
                  <div className="font-black">Catalog-ready</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Categories + featured picks
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Pro cart UX</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Stepper, ESC close, scroll lock
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Brand look</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Voltride gradient + serif headlines
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Fast edits</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Add sections easily
                  </div>
                </div>
              </div>
            </div>

            <div className="glass card p-6 md:p-8">
              <div className="text-xs tracking-[.22em] uppercase text-[var(--muted)]">
                Quick store info
              </div>

              <div className="mt-4 space-y-3">
                <div className="glass card p-4">
                  <div className="font-black">Address</div>
                  <div className="text-sm text-[var(--muted)] mt-1">{site.address}</div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Phone</div>
                  <div className="text-sm mt-1">
                    <a className="underline decoration-white/20 hover:decoration-white/60" href={`tel:${site.phoneE164}`}>
                      {site.phonePretty}
                    </a>
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Email</div>
                  <div className="text-sm mt-1">
                    <a className="underline decoration-white/20 hover:decoration-white/60" href={`mailto:${site.email}`}>
                      {site.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-[var(--muted)]">
                Tip: when you add more products, mark some as <b>featured</b> to keep the homepage strong.
              </div>
            </div>
          </div>
        </section>

        {/* STORE PHOTO (NEW) */}
        <section className="section anchor" id="store">
          <SectionTitle
            eyebrow="Store"
            title="Visit our physical store"
            subtitle="A quick look at our storefront in Miami. Local pickup available — ask us for availability and options."
          />

          <div className="glass card p-4 md:p-6">
            <div
              className="w-full rounded-2xl border border-white/10 overflow-hidden"
              style={{ boxShadow: "0 18px 55px rgba(0,0,0,.35)" }}
            >
              <img
                src="/IMG/tienda-fisica-voltride.jpeg"
                alt="Voltride Electric LLC physical store"
                loading="lazy"
                className="w-full object-cover"
                style={{ height: 360 }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-[var(--muted)]">
                Address: <span className="text-white/90">{site.address}</span>
              </div>

              <button
                className="btn btn-primary px-6 py-3"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                type="button"
              >
                Ask about pickup
              </button>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="section anchor" id="contact">
          <SectionTitle
            eyebrow="Contact"
            title="Let’s get you on the road"
            subtitle="Ask about availability, pickup options, or recommendations. This form also works with Netlify Forms if you enable it."
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_.9fr] gap-6">
            <form
              className="glass card p-6 md:p-8"
              name="contact"
              method="POST"
              data-netlify="true"
            >
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)]">Name</label>
                  <input
                    name="name"
                    className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-2"
                    style={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Phone</label>
                  <input
                    name="phone"
                    className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm text-white outline-none"
                    placeholder="(786) 000-0000"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-[var(--muted)]">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm text-white outline-none"
                  placeholder="you@email.com"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs text-[var(--muted)]">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Tell us what you’re looking for…"
                />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button className="btn btn-primary px-6 py-3" type="submit">
                  Send message
                </button>

                <a className="btn px-6 py-3 text-center" href={`mailto:${site.email}`}>
                  Or email us
                </a>
              </div>

              <div className="mt-3 text-xs text-[var(--muted)]">
                If you want WhatsApp button later, we can add it in 2 minutes.
              </div>
            </form>

            <div className="glass card p-6 md:p-8">
              <div className="h-serif text-3xl leading-tight">
                Storefront that feels like a brand — not a template.
              </div>

              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                You asked for: fuller page, stronger home, better cart, innovative styling,
                gradient background like Monograph, typography vibe like Our Revolution, and a diagonal cut concept.
                This setup is made for that.
              </p>

              <div className="mt-6 space-y-3">
                <div className="glass card p-4">
                  <div className="font-black">Next upgrade idea</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Add “Product details” modal with gallery + specs.
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Another upgrade</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Add “Testimonials / Reviews” to build trust.
                  </div>
                </div>
                <div className="glass card p-4">
                  <div className="font-black">Conversion boost</div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    Add sticky “Shop now” bar on mobile.
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-[var(--muted)]">
                Current featured minimum price:{" "}
                <b>
                  {money(
                    Math.min(...featured.map((p) => p.price))
                  )}
                </b>
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
  return (
    <I18nProvider>
      <CartProvider>
        <HomePage />
      </CartProvider>
    </I18nProvider>
  );
}
