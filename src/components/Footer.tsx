import { site } from "../config/site";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1320]/75 shadow-[0_20px_70px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="grid gap-10 p-8 md:grid-cols-3 md:p-10">
            <div>
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                  <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,70,239,.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(163,230,53,.28),transparent_60%)]"
                    aria-hidden="true"
                  />

                  <img
                    src={site.logo}
                    alt={`${site.name} logo`}
                    className="relative h-10 w-10 object-contain"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-lg font-black">
                    {site.name}
                  </div>

                  <div className="text-sm text-white/45">
                    {site.brandTagline}
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-sm leading-7 text-white/55">
                Premium electric scooters, e-bikes, and accessories for everyday
                mobility. Shop online or visit our Miami showroom for pickup and
                product assistance.
              </p>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-white">
                Contact
              </h3>

              <address className="space-y-3 text-sm not-italic text-white/60">
                <div>{site.address}</div>

                <a
                  href={`tel:${site.phoneE164}`}
                  className="block transition hover:text-white"
                  aria-label={`Call ${site.name} at ${site.phonePretty}`}
                >
                  {site.phonePretty}
                </a>

                <a
                  href={`mailto:${site.email}`}
                  className="block break-words transition hover:text-white"
                  aria-label={`Email ${site.name}`}
                >
                  {site.email}
                </a>
              </address>

              <a
                href={site.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-fuchsia-500 to-lime-300 px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
                aria-label={`Chat with ${site.name} on WhatsApp`}
              >
                Chat on WhatsApp
              </a>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-white">
                Store information
              </h3>

              <ul className="space-y-3 text-sm text-white/60">
                <li>✔ Local pickup available</li>
                <li>✔ Financing options</li>
                <li>✔ Card payments accepted</li>
                <li>✔ Product support before purchase</li>
                <li>✔ Miami showroom</li>
              </ul>

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
                © {currentYear} {site.name}. All rights reserved.
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