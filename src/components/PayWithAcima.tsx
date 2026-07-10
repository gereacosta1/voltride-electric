// src/components/PayWithAcima.tsx
import { useMemo, useState } from "react";
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

function money(n: number) {
  const value = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `$${value.toFixed(2)}`;
}

function todayPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function validateForm(form: AcimaForm) {
  if (!form.first_name.trim()) return "First name is required";
  if (!form.last_name.trim()) return "Last name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Valid email is required";
  if (digitsOnly(form.mobile_phone).length < 10) return "Valid mobile phone is required";
  if (digitsOnly(form.ssn).length !== 9) return "SSN must have 9 digits";
  if (!form.dob.trim()) return "Date of birth is required";
  if (!form.address_1.trim()) return "Address is required";
  if (!form.city.trim()) return "City is required";
  if (!/^[A-Z]{2}$/.test(form.state.trim().toUpperCase())) return "State must be 2 letters";
  if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) return "Valid ZIP is required";
  if (!form.id_number.trim()) return "Driver license number is required";
  if (!form.id_expiration.trim()) return "Driver license expiration is required";
  if (digitsOnly(form.routing_number).length < 4) return "Routing number is required";
  if (digitsOnly(form.account_number).length < 4) return "Account number is required";
  if (Number(form.monthly_income) <= 1000) return "Monthly income must be greater than $1,000";
  return null;
}

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-lime-300/30";
}

function labelClass() {
  return "mb-1 text-xs font-semibold text-white/65";
}

export default function PayWithAcima() {
  const { items, totalUSD } = useCart();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AcimaForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [message, setMessage] = useState("");
  const [contractGuid, setContractGuid] = useState<string | null>(null);

  const safeItems = useMemo(() => {
    return (items || []).map((it: any, idx: number) => ({
      id: it?.id ?? it?.sku ?? String(idx + 1),
      name: String(it?.name ?? it?.title ?? `Item ${idx + 1}`).trim(),
      price: Math.max(0, Number(it?.price) || 0),
      qty: Math.max(1, Number(it?.qty) || 1),
    }));
  }, [items]);

  const safeTotal = Math.max(0, Number(totalUSD) || 0);
  const canApply = safeItems.length > 0 && safeTotal > 0;

  const set = (key: keyof AcimaForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "state" ? value.toUpperCase().slice(0, 2) : value,
    }));
  };

  async function submitApplication() {
    const validation = validateForm(form);

    if (validation) {
      setStep("error");
      setMessage(validation);
      return;
    }

    setLoading(true);
    setStep("form");
    setMessage("");

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
      mobile_phone: digitsOnly(form.mobile_phone).slice(-10),
      language: "en",
      id_document: {
        type: "drivers_license",
        number: form.id_number.trim(),
        state: form.state.trim().toUpperCase(),
        expiration: form.id_expiration,
      },
      bank_account: {
        routing_number: digitsOnly(form.routing_number),
        account_number: digitsOnly(form.account_number),
      },
      employment: {
        income_type: "full_time_job",
        payment_method: "direct_deposit",
        pay_frequency: "bi_weekly",
        monthly_income: Number(form.monthly_income),
      },
    };

    try {
      const app = await createAcimaApplication({
        applicant,
        digital_verification_session_id: "sandbox-session-id",
      });

      if (!app.contract_guid) {
        setStep("error");
        setMessage("Acima did not return a contract GUID.");
        return;
      }

      setContractGuid(app.contract_guid);

      const orderItems = buildAcimaOrderItems(
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
        `Application submitted successfully. Status: ${app.status_code || "received"}`
      );
    } catch (err: any) {
      const msg = String(err?.message || err || "");

      if (
        msg.includes("Missing ACIMA_ACCESS_TOKEN") ||
        msg.includes("Missing ACIMA_LOCATION_GUID")
      ) {
        setStep("blocked");
        setMessage(
          "The Acima frontend and backend flow is ready, but Acima API credentials are still missing."
        );
      } else {
        setStep("error");
        setMessage(msg || "Could not submit Acima application.");
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
        onClick={() => {
          setOpen(true);
          setStep("form");
          setMessage("");
        }}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-3 text-xs font-bold uppercase tracking-wide text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        title={!canApply ? "Cart required" : "Apply with Acima"}
      >
        Apply with Acima
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close Acima modal"
          />

          <div className="relative max-h-[90dvh] w-[95%] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">Acima financing</h3>
                <p className="mt-1 text-sm text-white/60">
                  Complete the application information to continue.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">Current cart</div>
                <div className="text-lg font-black">{money(safeTotal)}</div>
              </div>

              <div className="mt-3 space-y-2">
                {safeItems.map((item) => (
                  <div
                    key={String(item.id)}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="text-xs text-white/50">
                        {money(item.price)} × {item.qty}
                      </div>
                    </div>

                    <div className="font-bold">{money(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className={labelClass()}>First name</div>
                <input className={fieldClass()} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Last name</div>
                <input className={fieldClass()} value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Email</div>
                <input className={fieldClass()} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Mobile phone</div>
                <input className={fieldClass()} value={form.mobile_phone} onChange={(e) => set("mobile_phone", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>SSN</div>
                <input className={fieldClass()} value={form.ssn} onChange={(e) => set("ssn", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Date of birth</div>
                <input type="date" className={fieldClass()} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <div className={labelClass()}>Address</div>
                <input className={fieldClass()} value={form.address_1} onChange={(e) => set("address_1", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>City</div>
                <input className={fieldClass()} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={labelClass()}>State</div>
                  <input className={fieldClass()} value={form.state} maxLength={2} onChange={(e) => set("state", e.target.value)} />
                </div>

                <div>
                  <div className={labelClass()}>ZIP</div>
                  <input className={fieldClass()} value={form.zip} onChange={(e) => set("zip", e.target.value)} />
                </div>
              </div>

              <div>
                <div className={labelClass()}>Driver license number</div>
                <input className={fieldClass()} value={form.id_number} onChange={(e) => set("id_number", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>License expiration</div>
                <input type="date" className={fieldClass()} value={form.id_expiration} onChange={(e) => set("id_expiration", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Routing number</div>
                <input className={fieldClass()} value={form.routing_number} onChange={(e) => set("routing_number", e.target.value)} />
              </div>

              <div>
                <div className={labelClass()}>Account number</div>
                <input className={fieldClass()} value={form.account_number} onChange={(e) => set("account_number", e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <div className={labelClass()}>Monthly income</div>
                <input className={fieldClass()} value={form.monthly_income} onChange={(e) => set("monthly_income", e.target.value)} />
              </div>
            </div>

            {message && (
              <div
                className={`mt-4 rounded-2xl border p-3 text-xs leading-relaxed ${
                  step === "approved"
                    ? "border-green-400/30 bg-green-400/10 text-green-100"
                    : step === "blocked"
                    ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
                    : "border-red-400/30 bg-red-400/10 text-red-100"
                }`}
              >
                {message}
                {contractGuid && (
                  <div className="mt-2 font-mono text-[11px] opacity-80">
                    contract_guid: {contractGuid}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={submitApplication}
            >
              {loading ? "Submitting..." : "Submit Acima application"}
            </button>

            <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs leading-relaxed text-yellow-100">
              Pending from Acima: Access Token or client credentials, location_guid,
              Trustev public key if required, and webhook instructions.
            </div>
          </div>
        </div>
      )}
    </>
  );
}