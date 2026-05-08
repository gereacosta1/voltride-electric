import React from "react";
import { site } from "../config/site";

export default function Footer() {
  return (
    <footer className="mt-10">
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="glass card p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={site.logo}
                  alt={site.name}
                  className="h-12 w-12 rounded-xl object-contain bg-black/20 border border-white/10 p-1"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div>
                  <div className="font-extrabold">{site.name}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {site.brandTagline}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                Premium electric mobility with fast checkout. Scooters, e-bikes
                and accessories designed for city rides in Miami.
              </p>
            </div>

            <div className="text-sm">
              <div className="font-black mb-3">Contact</div>
              <div className="text-[var(--muted)] leading-relaxed">
                <div>{site.address}</div>

                <div className="mt-2">
                  <a
                    className="underline decoration-white/20 hover:decoration-white/60"
                    href={`tel:${site.phoneE164}`}
                  >
                    {site.phonePretty}
                  </a>
                </div>

                <div className="mt-1">
                  <a
                    className="underline decoration-white/20 hover:decoration-white/60"
                    href={`mailto:${site.email}`}
                  >
                    {site.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="text-sm">
              <div className="font-black mb-3">Pickup checklist</div>
              <div className="text-[var(--muted)] leading-relaxed">
                <div>Bring ID recommended</div>
                <div>Have your order/product name ready</div>
                <div>Ask for compatibility, charger, specs and pickup help</div>
              </div>

              <div className="mt-4 text-sm">
                <a
                  href={site.socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-bold text-white hover:bg-white/15 transition"
                >
                  Contact on WhatsApp
                </a>
              </div>

              <div className="mt-4 text-xs text-[var(--muted)]">
                © {new Date().getFullYear()} {site.name}. All rights reserved.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[var(--muted)]">
          Built with a clean, modern gradient style — Voltride Edition.
        </div>
      </div>
    </footer>
  );
}