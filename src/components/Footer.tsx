import { site } from "../config/site";

export default function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1320]/75 shadow-[0_20px_70px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="grid gap-10 p-8 md:grid-cols-3 md:p-10">
            <div>
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,70,239,.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(163,230,53,.28),transparent_60%)]" />

                  <img
                    src={site.logo}
                    alt={site.name}
                    className="relative h-10 w-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div>
                  <div className="text-lg font-black">{site.name}</div>
                  <div className="text-sm text-white/45">
                    {site.brandTagline}
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-sm leading-7 text-white/55">
                Premium electric scooters, e-bikes and accessories for everyday
                mobility. Shop online or visit our Miami showroom for pickup and
                product assistance.
              </p>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-white">
                Contact
              </h3>

              <div className="space-y-3 text-sm text-white/60">
                <div>{site.address}</div>

                <a
                  href={`tel:${site.phoneE164}`}
                  className="block transition hover:text-white"
                >
                  {site.phonePretty}
                </a>

                <a
                  href={`mailto:${site.email}`}
                  className="block transition hover:text-white"
                >
                  {site.email}
                </a>
              </div>

              <a
                href={site.socials.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-white">
                Store information
              </h3>

              <div className="space-y-3 text-sm text-white/60">
                <div>✔ Local pickup available</div>
                <div>✔ Financing options</div>
                <div>✔ Card payments accepted</div>
                <div>✔ Product support before purchase</div>
                <div>✔ Miami showroom</div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="text-xs uppercase tracking-wider text-white/40">
                  Working hours
                </div>

                <div className="mt-2 text-lg font-black">
                  Contact us to confirm availability
                </div>

                <div className="mt-1 text-sm text-white/50">
                  Inventory changes frequently.
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/15 px-8 py-5">
            <div className="flex flex-col items-center justify-between gap-3 text-sm text-white/45 md:flex-row">
              <div>
                © {new Date().getFullYear()} {site.name}. All rights reserved.
              </div>

              <div className="text-center md:text-right">
                Built for a fast, modern shopping experience.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}