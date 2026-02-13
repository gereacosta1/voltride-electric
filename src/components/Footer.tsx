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
                  <div className="text-sm text-[var(--muted)]">{site.brandTagline}</div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                Premium electric mobility with fast checkout. Scooters, e-bikes & accessories —
                designed for city rides in Miami.
              </p>
            </div>

            <div className="text-sm">
              <div className="font-black mb-3">Contact</div>
              <div className="text-[var(--muted)] leading-relaxed">
                <div>{site.address}</div>
                <div className="mt-2">
                  <a className="underline decoration-white/20 hover:decoration-white/60" href={`tel:${site.phoneE164}`}>
                    {site.phonePretty}
                  </a>
                </div>
                <div className="mt-1">
                  <a className="underline decoration-white/20 hover:decoration-white/60" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="text-sm">
              <div className="font-black mb-3">Store</div>
              <div className="text-[var(--muted)] leading-relaxed">
                <div>Pay with Affirm or card</div>
                <div>Fast local pickup (when available)</div>
                <div>Support & warranty guidance</div>
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
