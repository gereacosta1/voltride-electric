import React, { useMemo, useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import { I18nProvider } from "./i18n/I18nProvider";
import { products } from "./data/products";
import { site } from "./config/site";

function safeSrc(src: string) {
  return encodeURI(src);
}

type Category = "all" | "scooters" | "ebikes" | "audio";

function getCategory(p: typeof products[number]): Category {
  const name = `${p.name} ${p.brand} ${p.model}`.toLowerCase();
  if (name.includes("jbl") || name.includes("speaker") || name.includes("parlante")) return "audio";
  if (name.includes("e bike") || name.includes("e-bike") || name.includes("super 73") || name.includes("rambo") || name.includes("xp4")) return "ebikes";
  return "scooters";
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);
}

function BadgeCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6h15l-2 9H8L6 3H3" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="1" />
      <circle cx="18" cy="19" r="1" />
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M22 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 4.6 11.8 19.8 19.8 0 0 1 1.5 3.2 2 2 0 0 1 3.5 1h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.6a2 2 0 0 1-.5 2.1L7.4 8.6a16 16 0 0 0 8 8l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.7.5 2.6.6A2 2 0 0 1 22 16.5z" />
    </svg>
  );
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 4h16v16H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function Navbar() {
  const { open, countItems } = useCart();
  const itemCount = countItems();

  return (
    <header className="sticky top-0 z-[2000] backdrop-blur border-b border-white/10 bg-black/35">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <a href="#home" className="flex items-center gap-2 select-none">
          <span className="inline-flex h-9 w-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
            <BoltIcon className="h-5 w-5 text-[var(--lime)]" />
          </span>
          <div className="leading-tight">
            <div className="font-black tracking-wide">{site.name}</div>
            <div className="text-[11px] text-[var(--muted)]">{site.brandTagline}</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <a className="navlink" href="#catalog">Catalog</a>
          <a className="navlink" href="#about">About</a>
          <a className="navlink" href="#faq">FAQ</a>
          <a className="navlink" href="#contact">Contact</a>
        </nav>

        <button
          type="button"
          onClick={open}
          className="btn btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10"
        >
          <span className="relative">
            <BadgeCartIcon className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-black text-black bg-[var(--lime)] inline-flex items-center justify-center">
                {itemCount}
              </span>
            ) : null}
          </span>
          <span className="font-semibold">Cart</span>
        </button>
      </div>
    </header>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs tracking-[0.22em] uppercase text-[var(--muted)]">{eyebrow}</div>
      <h2 className="mt-2 text-2xl md:text-3xl font-black">{title}</h2>
      {subtitle ? <div className="mt-2 text-sm text-[var(--muted)] max-w-3xl">{subtitle}</div> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text)]">
      <span className="h-2 w-2 rounded-full bg-[var(--magenta)] shadow-[0_0_18px_rgba(217,70,239,.45)]" />
      {children}
    </span>
  );
}

function ProductCard({ p }: { p: typeof products[number] }) {
  const { addItem } = useCart();
  return (
    <div className="rounded-2xl bg-[var(--panel)] border border-white/10 overflow-hidden shadow-soft">
      <div className="relative">
        <img className="h-52 w-full object-cover" src={safeSrc(p.image)} alt={p.name} loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        {p.featured ? (
          <div className="absolute top-3 left-3">
            <Pill>Featured</Pill>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="font-extrabold">{p.name}</div>
        <div className="text-sm text-[var(--muted)]">{p.brand} • {p.model}</div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="font-black text-lg">{money(p.price)}</div>
          <button
            className="rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-lime-400 text-black font-extrabold hover:brightness-95 active:brightness-90 transition"
            onClick={() =>
              addItem({
                id: String(p.id),
                name: p.name,
                price: p.price,
                qty: 1,
                sku: String(p.id),
                image: p.image,
                url: "#catalog",
              })
            }
          >
            Add
          </button>
        </div>

        {p.features?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[11px] text-[var(--muted)] rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {f}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Home() {
  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 6), []);
  const [cat, setCat] = useState<Category>("all");

  const catalog = useMemo(() => {
    const list = products.slice();
    if (cat === "all") return list;
    return list.filter((p) => getCategory(p) === cat);
  }, [cat]);

  const counts = useMemo(() => {
    const c = { all: products.length, scooters: 0, ebikes: 0, audio: 0 } as Record<Category, number>;
    for (const p of products) c[getCategory(p)]++;
    return c;
  }, []);

  return (
    <div id="home" className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="px-5 pt-12 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="hero rounded-3xl border border-white/10 bg-[var(--panel2)] shadow-soft overflow-hidden relative">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--magenta)] opacity-20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--lime)] opacity-16 blur-3xl" />

            <div className="relative grid md:grid-cols-[1.2fr_.8fr] gap-10 p-8 md:p-10 items-center">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Pill>Financing available</Pill>
                  <Pill>Fast pickup / delivery</Pill>
                  <Pill>Support included</Pill>
                </div>

                <h1 className="text-3xl md:text-5xl font-black leading-tight">
                  Electric mobility that looks <span className="text-glow">as powerful</span> as it rides.
                </h1>

                <p className="mt-4 text-[var(--muted)] max-w-2xl">
                  Scooters, e-bikes and premium audio — curated for the city. Clean power, neon style, and checkout built for speed.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a href="#catalog" className="btn-cta">
                    Shop catalog
                  </a>
                  <a href="#contact" className="btn-ghost-cta">
                    Contact us
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="stat">
                    <BoltIcon className="h-5 w-5 text-[var(--lime)]" />
                    <div>
                      <div className="font-extrabold">Electric first</div>
                      <div className="text-xs text-[var(--muted)]">Scooters & e-bikes</div>
                    </div>
                  </div>
                  <div className="stat">
                    <ShieldIcon className="h-5 w-5 text-[var(--magenta)]" />
                    <div>
                      <div className="font-extrabold">Trusted</div>
                      <div className="text-xs text-[var(--muted)]">Quality + support</div>
                    </div>
                  </div>
                  <div className="stat">
                    <TruckIcon className="h-5 w-5 text-[var(--cyan)]" />
                    <div>
                      <div className="font-extrabold">Local</div>
                      <div className="text-xs text-[var(--muted)]">Pickup / delivery</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:justify-self-end w-full">
                {/* Logo / visual */}
                <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-soft">
                  {/* Cambiá esto si tu logo tiene otro path */}
                  <img
                    src={safeSrc("/IMG/voltride-logo.png")}
                    alt={site.name}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      // fallback si no existe el archivo
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm font-extrabold">Why Voltride?</div>
                    <ul className="mt-2 text-sm text-[var(--muted)] space-y-1">
                      <li>• Clean electric mobility, curated products.</li>
                      <li>• Financing options at checkout.</li>
                      <li>• Real support and fast response.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TRUST BAR */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { k: "Financing", v: "Pay over time available" },
              { k: "Pickup", v: "Local pickup options" },
              { k: "Delivery", v: "Ask for delivery quotes" },
              { k: "Support", v: "We help after purchase" },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">{x.k}</div>
                <div className="mt-1 font-extrabold">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="px-5 py-10">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="Top picks"
            title="Featured products"
            subtitle="Best sellers and spotlight items — ready to add to cart."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-5 py-10">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="Explore"
            title="Browse by category"
            subtitle="Quick filters to find what you want."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="#catalog" onClick={() => setCat("scooters")} className="catcard">
              <div className="catbadge magenta">Scooters</div>
              <div className="mt-3 text-sm text-[var(--muted)]">City-ready mobility, smooth and clean.</div>
              <div className="mt-4 font-black">{counts.scooters} items</div>
            </a>
            <a href="#catalog" onClick={() => setCat("ebikes")} className="catcard">
              <div className="catbadge lime">E-Bikes</div>
              <div className="mt-3 text-sm text-[var(--muted)]">More range, more power, more fun.</div>
              <div className="mt-4 font-black">{counts.ebikes} items</div>
            </a>
            <a href="#catalog" onClick={() => setCat("audio")} className="catcard">
              <div className="catbadge cyan">Audio</div>
              <div className="mt-3 text-sm text-[var(--muted)]">Premium speakers for every vibe.</div>
              <div className="mt-4 font-black">{counts.audio} items</div>
            </a>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="px-5 py-10">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="Catalog"
            title="Shop the collection"
            subtitle="Use the filter to switch categories. Add items to cart and checkout when ready."
          />

          <div className="flex flex-wrap gap-2 mb-6">
            <button className={`filterbtn ${cat === "all" ? "active" : ""}`} onClick={() => setCat("all")}>
              All ({counts.all})
            </button>
            <button className={`filterbtn ${cat === "scooters" ? "active" : ""}`} onClick={() => setCat("scooters")}>
              Scooters ({counts.scooters})
            </button>
            <button className={`filterbtn ${cat === "ebikes" ? "active" : ""}`} onClick={() => setCat("ebikes")}>
              E-Bikes ({counts.ebikes})
            </button>
            <button className={`filterbtn ${cat === "audio" ? "active" : ""}`} onClick={() => setCat("audio")}>
              Audio ({counts.audio})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-5 py-10">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="About"
            title="Built for electric life"
            subtitle="Voltride focuses on clean mobility and curated gear — with a fast checkout experience and real support."
          />

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Mission</div>
              <div className="mt-2 font-black text-xl">Power the city</div>
              <div className="mt-3 text-sm text-[var(--muted)]">
                We help you move smarter — electric options that look good, ride smooth, and reduce maintenance.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Promise</div>
              <div className="mt-2 font-black text-xl">Support matters</div>
              <div className="mt-3 text-sm text-[var(--muted)]">
                Real people, quick answers, and guidance choosing the right product for your needs.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Checkout</div>
              <div className="mt-2 font-black text-xl">Fast + flexible</div>
              <div className="mt-3 text-sm text-[var(--muted)]">
                Add to cart, choose your payment option, and you’re ready. Financing available.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-5 py-10">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="FAQ"
            title="Quick answers"
            subtitle="If you still have questions, message us — we reply fast."
          />

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "Do you offer financing?", a: "Yes — you can choose financing at checkout when available." },
              { q: "Can I pick up locally?", a: "Yes. Contact us and we’ll coordinate pickup or delivery options." },
              { q: "Do you help after purchase?", a: "Yes — we provide support and guidance for setup and usage." },
              { q: "Do you ship?", a: "We can provide shipping or delivery quotes depending on the product and location." },
            ].map((x) => (
              <div key={x.q} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="font-black">{x.q}</div>
                <div className="mt-2 text-sm text-[var(--muted)]">{x.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-5 py-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <SectionTitle
            eyebrow="Contact"
            title="Talk to us"
            subtitle="Tell us what you’re looking for and we’ll help you choose the right option."
          />

          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
            <div className="rounded-3xl border border-white/10 bg-[var(--panel)] p-6 shadow-soft">
              <div className="text-sm text-[var(--muted)] mb-4">
                This form is a placeholder (front-end only). You can later connect it to Netlify Forms.
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Message sent (demo). Connect Netlify Forms when ready.");
                }}
                className="grid gap-3"
              >
                <input className="input" placeholder="Name" required />
                <input className="input" placeholder="Email" type="email" required />
                <input className="input" placeholder="Phone (optional)" />
                <textarea className="input min-h-[120px]" placeholder="What are you interested in?" required />
                <button className="btn-cta w-full justify-center" type="submit">
                  Send message
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="font-black text-xl">Voltride info</div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-[var(--muted)] mt-0.5" />
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-[var(--muted)]">{site.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-[var(--muted)] mt-0.5" />
                  <div>
                    <div className="font-semibold">Phone</div>
                    <a className="link" href={`tel:${site.phoneE164}`}>{site.phonePretty}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MailIcon className="h-5 w-5 text-[var(--muted)] mt-0.5" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Tip</div>
                <div className="mt-1 font-extrabold">Want a fuller store?</div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  Next step is adding: product pages, inventory search, and policies. This layout is already ready for that.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/25">
        <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="font-black">{site.name}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">{site.brandTagline}</div>
            <div className="mt-4 flex gap-2">
              <span className="chip">Financing</span>
              <span className="chip">Scooters</span>
              <span className="chip">E-Bikes</span>
              <span className="chip">Audio</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Links</div>
            <div className="mt-3 grid gap-2 text-sm">
              <a className="link" href="#catalog">Catalog</a>
              <a className="link" href="#about">About</a>
              <a className="link" href="#faq">FAQ</a>
              <a className="link" href="#contact">Contact</a>
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-[0.22em]">Policies</div>
            <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              <div>Refund policy (placeholder)</div>
              <div>Shipping policy (placeholder)</div>
              <div>Privacy policy (placeholder)</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 py-5 text-xs text-[var(--muted)] flex flex-col sm:flex-row gap-2 justify-between">
            <div>© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
            <div className="opacity-80">Neon dark theme • Built for speed</div>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <CartProvider>
        <Home />
      </CartProvider>
    </I18nProvider>
  );
}
