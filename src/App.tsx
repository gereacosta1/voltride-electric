// src/App.tsx
import { useMemo, useState } from "react";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { products, ProductCategory } from "./data/products";
import { site } from "./config/site";
import { IconBolt } from "./components/icons";

type CatalogTab = "all" | ProductCategory;

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function scrollToId(id: string) {
  if (typeof document === "undefined") return;

  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
  });
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : ""}`}>
      {eyebrow ? (
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-black uppercase tracking-[.22em] text-white/45">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="h-serif mt-4 text-4xl leading-[1.02] text-white md:text-5xl">
        {title}
      </h2>

      {subtitle ? (
        <p
          className={`mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-white/15 hover:bg-white/[0.065]">
      <div className="text-xs font-semibold text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function InfoCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-white/15 hover:bg-white/[0.065]">
      <div className="font-black text-white">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</div>
    </div>
  );
}

function ContactLinkCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-[24px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-white/15 hover:bg-white/[0.065]"
    >
      <div className="text-xs font-black uppercase tracking-[.18em] text-white/35">
        {title}
      </div>
      <div className="mt-2 break-words text-sm font-bold text-white/85">{value}</div>
    </a>
  );
}

function AffirmReturnPage({ type }: { type: "confirm" | "cancel" }) {
  const isConfirm = type === "confirm";

  return (
    <div id="home" className="anchor min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="section">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />

            <div className="relative">
              <div className="badge inline-flex items-center gap-2">
                <IconBolt className="h-4 w-4" />
                {isConfirm ? "Affirm • Confirmation" : "Affirm • Canceled"}
              </div>

              <h1 className="h-serif mt-5 text-4xl leading-[1.02] text-white md:text-5xl">
                {isConfirm
                  ? "Thanks, your request was received."
                  : "Affirm checkout was canceled."}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
                {isConfirm
                  ? "If your financing application was approved, your request has been sent and the charge confirmation is handled by our checkout flow. Contact us if you need help verifying the order status."
                  : "No charges were made. You can return to the store and try again whenever you’re ready."}
              </p>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <a className="btn btn-primary px-6 py-3 text-center" href="/">
                  Return to store
                </a>

                <a className="btn px-6 py-3 text-center" href={`mailto:${site.email}`}>
                  Contact support
                </a>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContactLinkCard
                  title="Phone"
                  value={site.phonePretty}
                  href={`tel:${site.phoneE164}`}
                />

                <ContactLinkCard
                  title="Email"
                  value={site.email}
                  href={`mailto:${site.email}`}
                />
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

function HomePage() {
  const [tab, setTab] = useState<CatalogTab>("all");

  const featured = useMemo(() => {
    return products.filter((p) => p.featured).slice(0, 6);
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return products;
    return products.filter((p) => p.category === tab);
  }, [tab]);

  const storeImages = [
    "/IMG/store-front.jpeg",
    "/IMG/store-inside.jpeg",
    "/IMG/tienda-fisica-voltride.jpeg",
  ];

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(site.address || "Miami");
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, []);

  const featuredMinPrice = useMemo(() => {
    if (!featured.length) return 0;
    return Math.min(...featured.map((p) => Number(p.price) || 0));
  }, [featured]);

  const categoryTabs: Array<{ id: CatalogTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "scooters", label: "Scooters" },
    { id: "ebikes", label: "E-bikes" },
    { id: "audio", label: "Audio" },
  ];

  return (
    <div id="home" className="anchor">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4">
        <section className="section">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl md:p-10">
              <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

              <div className="relative">
                <div className="badge inline-flex items-center gap-2">
                  <IconBolt className="h-4 w-4" />
                  Miami • Electric Mobility • Local Store
                </div>

                <h1 className="h-serif mt-6 max-w-2xl text-5xl leading-[0.96] text-white md:text-7xl">
                  Clean power.
                  <br />
                  <span className="text-white/85">Bold rides.</span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
                  Premium scooters, e-bikes and accessories from Voltride Electric
                  LLC. Browse online, ask about availability, and checkout with card,
                  Affirm, or Acima financing options.
                </p>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="btn btn-primary px-6 py-3"
                    onClick={() => scrollToId("catalog")}
                    type="button"
                  >
                    Browse catalog
                  </button>

                  <button
                    className="btn px-6 py-3"
                    onClick={() => scrollToId("store")}
                    type="button"
                  >
                    Visit store
                  </button>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  <span className="badge">Acima financing</span>
                  <span className="badge">Pay with Affirm</span>
                  <span className="badge">Pay by card</span>
                  <span className="badge">Local pickup</span>
                  <span className="badge">Miami showroom</span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <MiniStat label="Featured items" value={featured.length} />
                  <MiniStat label="Checkout" value="Fast" />
                  <MiniStat label="Pickup" value="Local" />
                  <MiniStat label="Location" value="Miami" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/70 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl">
              <img
                src="/IMG/store-front.jpeg"
                alt="Voltride Electric storefront"
                className="absolute inset-0 h-full w-full object-cover opacity-70"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(217,70,239,.32),rgba(163,230,53,.20),rgba(34,211,238,.16))]" />

              <div className="relative flex min-h-[420px] flex-col justify-end p-6 md:p-8">
                <div className="badge w-fit">Physical Store</div>

                <h2 className="h-serif mt-4 text-4xl leading-tight text-white">
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
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionTitle
              eyebrow="Catalog"
              title="Explore the lineup"
              subtitle="Filter by category and add items to your cart. Ask us about availability before pickup."
            />

            <div className="flex flex-wrap gap-2 md:pb-8">
              {categoryTabs.map((item) => (
                <button
                  key={item.id}
                  className={`btn ${tab === item.id ? "btn-primary" : ""}`}
                  onClick={() => setTab(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
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
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl md:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

              <div className="relative">
                <div className="h-serif text-3xl leading-tight text-white md:text-4xl">
                  Shop online, then confirm pickup or availability with our team.
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                  Browse the catalog, ask about the product you like, and we’ll help
                  with availability, charger details, compatibility and pickup options.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard title="Scooters" body="Daily city rides and quick mobility." />
                  <InfoCard title="E-bikes" body="Comfortable options for longer rides." />
                  <InfoCard title="Accessories" body="Audio, extras and ride upgrades." />
                  <InfoCard title="Pickup help" body="Local support before purchase." />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/75 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
              <img
                src="/IMG/store-inside.jpeg"
                alt="Voltride Electric showroom"
                className="h-72 w-full object-cover"
                loading="lazy"
              />

              <div className="p-6 md:p-8">
                <div className="text-xs font-black uppercase tracking-[.22em] text-white/35">
                  Quick store info
                </div>

                <div className="mt-5 space-y-3">
                  <ContactLinkCard title="Address" value={site.address} href={mapsUrl} />
                  <ContactLinkCard
                    title="Phone"
                    value={site.phonePretty}
                    href={`tel:${site.phoneE164}`}
                  />
                  <ContactLinkCard
                    title="Email"
                    value={site.email}
                    href={`mailto:${site.email}`}
                  />
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

          <div className="rounded-[30px] border border-white/10 bg-[#0d1422]/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl md:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[.8fr_1.4fr_.8fr]">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5">
                <div className="text-xs font-black uppercase tracking-[.22em] text-white/35">
                  Pickup essentials
                </div>

                <div className="mt-5">
                  <div className="font-black text-white">Local pickup</div>
                  <div className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Reserve your item, we confirm availability, then you pick up
                    in-store. Fast and simple.
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <InfoCard title="1. Ask about stock" body="Send the product name or screenshot." />
                  <InfoCard title="2. We confirm" body="We confirm availability and pickup time." />
                  <InfoCard title="3. Pickup" body="Come by the store and you’re good to go." />
                </div>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045]">
                <img
                  src="/IMG/tienda-fisica-voltride.jpeg"
                  alt="Voltride Electric LLC physical store"
                  loading="lazy"
                  className="h-[420px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div className="grid grid-cols-3 gap-2 p-3">
                  {storeImages.map((img) => (
                    <img
                      key={img}
                      src={img}
                      alt="Voltride Electric store"
                      className="h-24 w-full rounded-2xl border border-white/10 object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
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
                      onClick={() => scrollToId("contact")}
                      type="button"
                    >
                      Ask about pickup
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5">
                <div className="text-xs font-black uppercase tracking-[.22em] text-white/35">
                  Contact
                </div>

                <div className="mt-5 space-y-3">
                  <ContactLinkCard
                    title="Call / text"
                    value={site.phonePretty}
                    href={`tel:${site.phoneE164}`}
                  />

                  <ContactLinkCard
                    title="Email"
                    value={site.email}
                    href={`mailto:${site.email}`}
                  />

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                    <div className="font-black text-white">Pickup checklist</div>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                      <li>Bring ID recommended</li>
                      <li>Have product name ready</li>
                      <li>Ask for charger/specs</li>
                      <li>Confirm pickup time first</li>
                    </ul>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                    <div className="font-black text-white">Payments</div>
                    <div className="mt-2 text-sm text-[var(--muted)]">
                      Card, Affirm and Acima options available online.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge">Acima</span>
                      <span className="badge">Affirm</span>
                      <span className="badge">Card</span>
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
            subtitle="Ask about availability, pickup options, or recommendations. Send the product name or a screenshot and we’ll help you choose."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_.9fr]">
            <form
              className="rounded-[30px] border border-white/10 bg-[#0d1422]/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl md:p-8"
              name="contact"
              method="POST"
              data-netlify="true"
            >
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-white/45">Name</label>
                  <input
                    name="name"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/15"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/45">Phone</label>
                  <input
                    name="phone"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/15"
                    placeholder="(786) 000-0000"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-white/45">Email</label>
                <input
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/15"
                  placeholder="you@email.com"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-white/45">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/15"
                  placeholder="Tell us what you’re looking for..."
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button className="btn btn-primary px-6 py-3" type="submit">
                  Send message
                </button>

                <a className="btn px-6 py-3 text-center" href={`mailto:${site.email}`}>
                  Or email us
                </a>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-xs leading-relaxed text-[var(--muted)]">
                Direct email: <span className="font-bold text-white/80">{site.email}</span>
              </div>
            </form>

            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422]/75 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
              <img
                src="/IMG/store-front.jpeg"
                alt="Voltride Electric storefront"
                className="h-64 w-full object-cover"
                loading="lazy"
              />

              <div className="p-6 md:p-8">
                <div className="h-serif text-3xl leading-tight text-white">
                  Need help choosing the right ride?
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  Contact us with the product name, your budget and how you plan to
                  use it. We can help you choose between scooters, e-bikes and
                  accessories.
                </p>

                <div className="mt-6 space-y-3">
                  <InfoCard title="Best for quick city rides" body="Electric scooters" />
                  <InfoCard title="Best for comfort" body="E-bikes" />
                  <InfoCard
                    title="Starting featured price"
                    body={money(featuredMinPrice)}
                  />
                </div>

                <div className="mt-5 text-xs text-[var(--muted)]">
                  Email updated to: <b className="text-white/80">{site.email}</b>
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