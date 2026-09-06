// src/components/PayWithAcima.tsx

import { useEffect, useMemo, useState } from "react";

import { site } from "../config/site";
import { useCart } from "../context/CartContext";
import {
  buildAcimaOrderItems,
  createAcimaApplication,
  createAcimaCustomerOrder,
  type AcimaApplicant,
} from "../lib/acima";

type Step = "form" | "approved" | "blocked" | "error";

type AcimaForm = {
  first_name: string;
  last_name: string;
  email: string;
  mobile_phone: string;
  ssn: string;
  dob: string;
  address_1: string;
  city: string;
  state: string;
  zip: string;
  id_number: string;
  id_expiration: string;
  routing_number: string;
  account_number: string;
  monthly_income: string;
};

type CartPreviewItem = {
  id: string | number;
  name: string;
  price: number;
  qty: number;
};

type UnknownRecord = Record<string, unknown>;

const initialForm: AcimaForm = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_phone: "",
  ssn: "",
  dob: "",
  address_1: "",
  city: "",
  state: "FL",
  zip: "",
  id_number: "",
  id_expiration: "",
  routing_number: "",
  account_number: "",
  monthly_income: "",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return formatLocalDate(date);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function toRecord(value: unknown): UnknownRecord {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return {};
}

function normalizeCartItem(
  item: unknown,
  index: number
): CartPreviewItem {
  const source = toRecord(item);

  const rawId = source.id ?? source.sku;
  const id =
    typeof rawId === "string" || typeof rawId === "number"
      ? rawId
      : String(index + 1);

  const name = String(
    source.name ?? source.title ?? `Item ${index + 1}`
  ).trim();

  const price = Math.max(0, Number(source.price) || 0);
  const qty = Math.max(1, Number(source.qty) || 1);

  return {
    id,
    name,
    price,
    qty,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

function validateForm(form: AcimaForm) {
  if (!form.first_name.trim()) {
    return "First name is required.";
  }

  if (!form.last_name.trim()) {
    return "Last name is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Valid email is required.";
  }

  if (digitsOnly(form.mobile_phone).length < 10) {
    return "Valid mobile phone is required.";
  }

  if (digitsOnly(form.ssn).length !== 9) {
    return "SSN must have 9 digits.";
  }

  if (!form.dob.trim()) {
    return "Date of birth is required.";
  }

  if (!form.address_1.trim()) {
    return "Address is required.";
  }

  if (!form.city.trim()) {
    return "City is required.";
  }

  if (!/^[A-Z]{2}$/.test(form.state.trim().toUpperCase())) {
    return "State must be 2 letters.";
  }

  if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
    return "Valid ZIP is required.";
  }

  if (!form.id_number.trim()) {
    return "Driver license number is required.";
  }

  if (!form.id_expiration.trim()) {
    return "Driver license expiration is required.";
  }

  if (digitsOnly(form.routing_number).length < 4) {
    return "Routing number is required.";
  }

  if (digitsOnly(form.account_number).length < 4) {
    return "Account number is required.";
  }

  if (Number(form.monthly_income) <= 1000) {
    return "Monthly income must be greater than $1,000.";
  }

  return null;
}

function fieldClass() {
  return "w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/15";
}

function labelClass() {
  return "mb-1 text-xs font-semibold text-white/60";
}

function StatusMessage({
  step,
  message,
  contractGuid,
}: {
  step: Step;
  message: string;
  contractGuid: string | null;
}) {
  if (!message) {
    return null;
  }

  const style =
    step === "approved"
      ? "border-lime-300/30 bg-lime-300/10 text-lime-100"
      : step === "blocked"
      ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
      : "border-red-400/30 bg-red-400/10 text-red-100";

  return (
    <div
      className={`mt-4 rounded-2xl border p-3 text-xs leading-relaxed ${style}`}
      role={step === "error" ? "alert" : "status"}
      aria-live={step === "error" ? "assertive" : "polite"}
    >
      {message}

      {contractGuid ? (
        <div className="mt-2 rounded-xl bg-black/20 p-2 font-mono text-[11px] opacity-80">
          contract_guid: {contractGuid}
        </div>
      ) : null}
    </div>
  );
}

function CartSummary({
  items,
  total,
}: {
  items: CartPreviewItem[];
  total: number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">
            Current cart
          </div>

          <div className="mt-1 text-xs text-white/40">
            {items.length === 1
              ? "1 product selected"
              : `${items.length} products selected`}
          </div>
        </div>

        <div className="shrink-0 text-lg font-black text-white">
          {money(total)}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/15 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-white/90">
                  {item.name}
                </div>

                <div className="text-xs text-white/40">
                  {money(item.price)} × {item.qty}
                </div>
              </div>

              <div className="shrink-0 font-black text-white">
                {money(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className={`block ${labelClass()}`}>
        {label}
      </span>

      <input
        className={fieldClass()}
        value={value}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function PayWithAcima() {
  const { items, totalUSD } = useCart();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AcimaForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [message, setMessage] = useState("");
  const [contractGuid, setContractGuid] =
    useState<string | null>(null);

  const allowFullApplicationForm =
    Boolean(import.meta.env.DEV) ||
    String(import.meta.env.VITE_ACIMA_FORM_ENABLED || "")
      .trim()
      .toLowerCase() === "true";

  const showDevNotice = Boolean(import.meta.env.DEV);

  const safeItems = useMemo<CartPreviewItem[]>(() => {
    return (Array.isArray(items) ? items : []).map(
      normalizeCartItem
    );
  }, [items]);

  const safeTotal = Math.max(0, Number(totalUSD) || 0);

  const canApply =
    safeItems.length > 0 &&
    safeTotal > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const set = (
    key: keyof AcimaForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]:
        key === "state"
          ? value.toUpperCase().slice(0, 2)
          : value,
    }));
  };

  function openModal() {
    setOpen(true);
    setStep("form");
    setMessage("");
    setContractGuid(null);
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
  }

  async function submitApplication() {
    if (loading) {
      return;
    }

    const validation = validateForm(form);

    if (validation) {
      setStep("error");
      setMessage(validation);
      return;
    }

    setLoading(true);
    setStep("form");
    setMessage("");
    setContractGuid(null);

    const applicant: AcimaApplicant = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      ssn: digitsOnly(form.ssn),
      dob: form.dob,
      address_1: form.address_1.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip: form.zip.trim(),
      mobile_phone: digitsOnly(
        form.mobile_phone
      ).slice(-10),
      language: "en",

      id_document: {
        type: "drivers_license",
        number: form.id_number.trim(),
        state: form.state.trim().toUpperCase(),
        expiration: form.id_expiration,
      },

      bank_account: {
        routing_number: digitsOnly(
          form.routing_number
        ),
        account_number: digitsOnly(
          form.account_number
        ),
      },

      employment: {
        income_type: "full_time_job",
        payment_method: "direct_deposit",
        pay_frequency: "bi_weekly",
        monthly_income: Number(
          form.monthly_income
        ),
      },
    };

    try {
      const app =
        await createAcimaApplication({
          applicant,
          digital_verification_session_id:
            "sandbox-session-id",
        });

      if (!app.contract_guid) {
        setStep("error");
        setMessage(
          "Acima did not return a contract GUID."
        );
        return;
      }

      setContractGuid(app.contract_guid);

      const orderItems =
        buildAcimaOrderItems(
          safeItems.map((item) => ({
            title: item.name,
            price: item.price,
            qty: item.qty,
          })),
          todayPlusDays(7)
        );

      await createAcimaCustomerOrder({
        contract_guid: app.contract_guid,
        items: orderItems,
      });

      setStep("approved");

      setMessage(
        `Application submitted successfully. Status: ${
          app.status_code || "received"
        }`
      );
    } catch (error: unknown) {
      const errorMessage =
        getErrorMessage(error);

      if (
        errorMessage.includes(
          "Missing ACIMA_ACCESS_TOKEN"
        ) ||
        errorMessage.includes(
          "Missing ACIMA_LOCATION_GUID"
        )
      ) {
        setStep("blocked");

        setMessage(
          "The Acima flow is prepared, but Acima API credentials are still missing."
        );
      } else {
        setStep("error");

        setMessage(
          errorMessage ||
            "Could not submit Acima application."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={!canApply}
        onClick={openModal}
        className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-300 px-4 py-3 text-sm font-black text-black shadow-[0_12px_35px_rgba(132,204,22,.16)] transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        title={
          !canApply
            ? "Add products to cart first"
            : "Apply with Acima"
        }
      >
        <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <span className="absolute -left-16 top-0 h-full w-24 rotate-12 bg-white/25 blur-xl" />
        </span>

        <span className="relative inline-flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-black/70 shadow-[0_0_16px_rgba(0,0,0,.25)]" />

          Apply with Acima
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close Acima modal"
          />

          <div
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1422] text-white shadow-[0_30px_100px_rgba(0,0,0,.6)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="acima-modal-title"
            aria-describedby="acima-modal-description"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-300/15 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-lime-100">
                  Leasing option
                </div>

                <h3
                  id="acima-modal-title"
                  className="mt-3 text-2xl font-black"
                >
                  Acima leasing
                </h3>

                <p
                  id="acima-modal-description"
                  className="mt-1 max-w-xl text-sm leading-relaxed text-white/55"
                >
                  {allowFullApplicationForm
                    ? "Complete the application details below to prepare the Acima checkout flow."
                    : "Acima leasing is being configured. Contact the store and we can help you continue."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl p-1 text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close"
                type="button"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="relative max-h-[calc(92dvh-118px)] overflow-y-auto px-6 py-5">
              <CartSummary
                items={safeItems}
                total={safeTotal}
              />

              {!allowFullApplicationForm ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                  <div className="text-lg font-black text-white">
                    Acima setup is almost ready
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    The leasing option has been
                    added to the checkout
                    experience. Final API
                    credentials are still required
                    before accepting real
                    applications online.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <a
                      href={site.socials.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-300 px-4 py-3 text-center text-sm font-black text-black transition hover:brightness-110"
                    >
                      Continue on WhatsApp
                    </a>

                    <a
                      href={`mailto:${
                        site.email
                      }?subject=${encodeURIComponent(
                        "Acima leasing question"
                      )}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-black text-white/80 transition hover:bg-white/[0.1] hover:text-white"
                    >
                      Email the store
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Field
                      label="First name"
                      value={form.first_name}
                      onChange={(value) =>
                        set(
                          "first_name",
                          value
                        )
                      }
                      autoComplete="given-name"
                      placeholder="John"
                    />

                    <Field
                      label="Last name"
                      value={form.last_name}
                      onChange={(value) =>
                        set(
                          "last_name",
                          value
                        )
                      }
                      autoComplete="family-name"
                      placeholder="Smith"
                    />

                    <Field
                      label="Email"
                      value={form.email}
                      onChange={(value) =>
                        set("email", value)
                      }
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="customer@email.com"
                    />

                    <Field
                      label="Mobile phone"
                      value={form.mobile_phone}
                      onChange={(value) =>
                        set(
                          "mobile_phone",
                          value
                        )
                      }
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="3055551234"
                    />

                    <Field
                      label="SSN"
                      value={form.ssn}
                      onChange={(value) =>
                        set("ssn", value)
                      }
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="123456789"
                    />

                    <Field
                      label="Date of birth"
                      value={form.dob}
                      onChange={(value) =>
                        set("dob", value)
                      }
                      type="date"
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Address"
                        value={form.address_1}
                        onChange={(value) =>
                          set(
                            "address_1",
                            value
                          )
                        }
                        autoComplete="address-line1"
                        placeholder="11510 Biscayne Blvd"
                      />
                    </div>

                    <Field
                      label="City"
                      value={form.city}
                      onChange={(value) =>
                        set("city", value)
                      }
                      autoComplete="address-level2"
                      placeholder="Miami"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="State"
                        value={form.state}
                        onChange={(value) =>
                          set("state", value)
                        }
                        maxLength={2}
                        autoComplete="address-level1"
                        placeholder="FL"
                      />

                      <Field
                        label="ZIP"
                        value={form.zip}
                        onChange={(value) =>
                          set("zip", value)
                        }
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="33181"
                      />
                    </div>

                    <Field
                      label="Driver license number"
                      value={form.id_number}
                      onChange={(value) =>
                        set(
                          "id_number",
                          value
                        )
                      }
                      placeholder="License number"
                    />

                    <Field
                      label="License expiration"
                      value={form.id_expiration}
                      onChange={(value) =>
                        set(
                          "id_expiration",
                          value
                        )
                      }
                      type="date"
                    />

                    <Field
                      label="Routing number"
                      value={form.routing_number}
                      onChange={(value) =>
                        set(
                          "routing_number",
                          value
                        )
                      }
                      inputMode="numeric"
                      placeholder="123456789"
                    />

                    <Field
                      label="Account number"
                      value={form.account_number}
                      onChange={(value) =>
                        set(
                          "account_number",
                          value
                        )
                      }
                      inputMode="numeric"
                      placeholder="Checking account"
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Monthly income"
                        value={form.monthly_income}
                        onChange={(value) =>
                          set(
                            "monthly_income",
                            value
                          )
                        }
                        inputMode="decimal"
                        placeholder="4000"
                      />
                    </div>
                  </div>

                  <StatusMessage
                    step={step}
                    message={message}
                    contractGuid={
                      contractGuid
                    }
                  />

                  <button
                    type="button"
                    disabled={loading}
                    className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-white/90 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={
                      submitApplication
                    }
                  >
                    {loading
                      ? "Submitting..."
                      : "Submit Acima application"}
                  </button>

                  {showDevNotice ? (
                    <div className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-3 text-xs leading-relaxed text-yellow-100">
                      Development status: Acima
                      frontend/backend flow is
                      prepared. Final credentials
                      are still required: API token
                      or client credentials,
                      location_guid, Trustev key if
                      required, and webhook
                      instructions.
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}