//src/components/AffirmButton.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { loadAffirm } from "../lib/affirms";
import {
  buildAffirmCheckout,
  type CartItem as Item,
  type Customer,
} from "../lib/affirmCheckouts";

type ButtonCartItem = {
  name: string;
  sku?: string | number;
  price: number; // USD
  qty: number;
  url?: string;
  image?: string;
  id?: string | number;
};

type Props = {
  cartItems?: ButtonCartItem[];
  totalUSD?: number;
  shippingUSD?: number;
  taxUSD?: number;
};

const MIN_TOTAL_CENTS = 5000; // $50 mínimo
const toCents = (usd = 0) => Math.round((Number(usd) || 0) * 100);

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isUSState = (v: string) => /^[A-Z]{2}$/.test(v.trim().toUpperCase());
const isUSZip = (v: string) => /^\d{5}(-\d{4})?$/.test(v.trim());

function Toast({
  show,
  type,
  message,
  onClose,
}: {
  show: boolean;
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      onClick={onClose}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold
      ${
        type === "success"
          ? "bg-green-600/95 text-white border-green-400"
          : type === "error"
          ? "bg-red-600/95 text-white border-red-400"
          : "bg-black/90 text-white border-white/20"
      }`}
    >
      {message}
    </div>
  );
}

function NiceModal({
  open,
  title,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onClose,
  disableClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onClose: () => void;
  disableClose?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={disableClose ? undefined : onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className={`text-gray-500 hover:text-gray-800 ${
              disableClose ? "opacity-40 pointer-events-none" : ""
            }`}
            aria-label="Close"
            title={disableClose ? "Complete the form to continue" : "Close"}
          >
            ✕
          </button>
        </div>

        <div className="text-gray-700 mb-6">{children}</div>

        <div className="flex items-center justify-end gap-3">
          {secondaryLabel && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                disableClose ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {secondaryLabel}
            </button>
          )}
          {primaryLabel && (
            <button
              onClick={onPrimary}
              className="px-4 py-2 rounded-lg bg-black text-white font-bold hover:bg-gray-900"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type BuyerForm = {
  firstName: string;
  lastName: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

function BuyerInfoForm({
  value,
  onChange,
}: {
  value: BuyerForm;
  onChange: (next: BuyerForm) => void;
}) {
  const set = (k: keyof BuyerForm, v: string) => onChange({ ...value, [k]: v });

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10";
  const labelClass = "text-xs font-semibold text-gray-700";

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        To continue with Affirm, please enter the buyer information (name and US
        address).
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={labelClass}>First name</div>
          <input
            className={inputClass}
            value={value.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div>
          <div className={labelClass}>Last name</div>
          <input
            className={inputClass}
            value={value.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <div className={labelClass}>Email</div>
        <input
          className={inputClass}
          value={value.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="email"
        />
      </div>

      <div>
        <div className={labelClass}>Address line 1</div>
        <input
          className={inputClass}
          value={value.line1}
          onChange={(e) => set("line1", e.target.value)}
          autoComplete="address-line1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={labelClass}>City</div>
          <input
            className={inputClass}
            value={value.city}
            onChange={(e) => set("city", e.target.value)}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <div className={labelClass}>State (2 letters)</div>
          <input
            className={inputClass}
            value={value.state}
            onChange={(e) => set("state", e.target.value.toUpperCase())}
            maxLength={2}
            autoComplete="address-level1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={labelClass}>ZIP</div>
          <input
            className={inputClass}
            value={value.zip}
            onChange={(e) => set("zip", e.target.value)}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <div className={labelClass}>Country</div>
          <input className={inputClass} value="US" disabled />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        We use this information only to create the Affirm checkout.
      </p>
    </div>
  );
}

export default function AffirmButton({
  cartItems = [],
  totalUSD,
  shippingUSD = 0,
  taxUSD = 0,
}: Props) {
  const PUBLIC_KEY = (import.meta.env.VITE_AFFIRM_PUBLIC_KEY || "").trim();
  const ENV = (import.meta.env.VITE_AFFIRM_ENV || "prod") as "prod" | "sandbox";

  const [ready, setReady] = useState(false);
  const [opening, setOpening] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "info" as "success" | "error" | "info",
    message: "",
  });

  const [modal, setModal] = useState({
    open: false,
    title: "",
    body: "",
    retry: false,
  });

  const [buyerModalOpen, setBuyerModalOpen] = useState(false);
  const [buyer, setBuyer] = useState<BuyerForm>({
    firstName: "",
    lastName: "",
    email: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
  });

  const showToast = (
    type: "success" | "error" | "info",
    message: string,
    ms = 2200
  ) => {
    setToast({ show: true, type, message });
    window.setTimeout(() => setToast((s) => ({ ...s, show: false })), ms);
  };

  const mapped: Item[] = useMemo(() => {
    return cartItems.map((it, i) => ({
      id: (it.id ?? it.sku ?? String(i + 1)) as string | number,
      title: String(it.name ?? `Item ${i + 1}`),
      price: Number(it.price) || 0,
      qty: Math.max(1, Number(it.qty) || 1),
      url: it.url ?? "/",
      image: it.image,
    }));
  }, [cartItems]);

  const subtotalC = mapped.reduce((acc, it) => acc + toCents(it.price) * it.qty, 0);
  const shippingC = toCents(shippingUSD);
  const taxC = toCents(taxUSD);

  const totalC =
    typeof totalUSD === "number" ? toCents(totalUSD) : subtotalC + shippingC + taxC;

  const affirmEnabled = !!PUBLIC_KEY;
  const canPay = affirmEnabled && ready && mapped.length > 0 && totalC >= MIN_TOTAL_CENTS;

  useEffect(() => {
    if (!PUBLIC_KEY) {
      setReady(false);
      return;
    }

    loadAffirm(PUBLIC_KEY, ENV)
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, [PUBLIC_KEY, ENV]);

  const buyerValid =
    buyer.firstName.trim().length > 0 &&
    buyer.lastName.trim().length > 0 &&
    isEmail(buyer.email) &&
    buyer.line1.trim().length > 0 &&
    buyer.city.trim().length > 0 &&
    isUSState(buyer.state) &&
    isUSZip(buyer.zip);

  function buildCustomerFromBuyer(): Customer {
    return {
      firstName: buyer.firstName.trim(),
      lastName: buyer.lastName.trim(),
      email: buyer.email.trim(),
      address: {
        line1: buyer.line1.trim(),
        city: buyer.city.trim(),
        state: buyer.state.trim().toUpperCase(),
        zip: buyer.zip.trim(),
        country: "US",
      },
    };
  }

  async function startAffirmFlow() {
    const affirm = (window as any).affirm;

    if (!affirm?.checkout) {
      showToast("error", "Affirm is not ready yet");
      return;
    }

    if (!canPay) {
      const why =
        mapped.length === 0
          ? "Your cart is empty."
          : totalC < MIN_TOTAL_CENTS
          ? "The total is too low for Affirm (min $50)."
          : !ready
          ? "Affirm is still loading."
          : "Affirm is unavailable.";

      setModal({ open: true, title: "Affirm unavailable", body: why, retry: !ready });
      return;
    }

    if (!buyerValid) {
      setBuyerModalOpen(true);
      return;
    }

    const base = window.location.origin.replace("http://", "https://");
    const customer = buildCustomerFromBuyer();

    const checkout = buildAffirmCheckout(
      mapped,
      { subtotalUSD: subtotalC / 100, shippingUSD, taxUSD },
      customer,
      base
    );

    setOpening(true);

    try {
      affirm.checkout(checkout);

      affirm.checkout.open({
        onSuccess: async ({ checkout_token }: { checkout_token: string }) => {
          const orderId = "ORDER-" + Date.now();

          try {
            const r = await fetch("/api/affirm-authorize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                checkout_token,
                order_id: orderId,
                amount_cents: totalC,
                currency: "USD",
                capture: true,
              }),
            });

            if (!r.ok) {
              setModal({
                open: true,
                title: "Server error",
                body:
                  "Affirm opened successfully, but the server could not confirm the charge. Check Netlify function logs.",
                retry: true,
              });
              return;
            }

            showToast("success", "Affirm request submitted!");
          } catch {
            setModal({
              open: true,
              title: "We could not confirm your request",
              body: "There was a problem confirming with the server.",
              retry: true,
            });
          } finally {
            setOpening(false);
          }
        },

        onFail: () => {
          setOpening(false);
          setModal({
            open: true,
            title: "Financing was not completed",
            body: "You can try again.",
            retry: true,
          });
        },

        onValidationError: () => {
          setOpening(false);
          setBuyerModalOpen(true);
        },

        onClose: () => {
          setOpening(false);
          setModal({
            open: true,
            title: "Process canceled",
            body: "No charges were made. Would you like to try again?",
            retry: true,
          });
        },
      });
    } catch {
      setOpening(false);
      showToast("error", "Could not open Affirm.");
    }
  }

  const label = !affirmEnabled
    ? "Affirm (disabled)"
    : !ready
    ? "Loading Affirm…"
    : opening
    ? "Opening…"
    : "Pay with Affirm";

  return (
    <>
      <button
        type="button"
        onClick={startAffirmFlow}
        disabled={!affirmEnabled || opening || !canPay}
        className="w-full rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wide
                   bg-gradient-to-r from-sky-500 to-violet-500
                   hover:brightness-110 transition
                   disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !affirmEnabled
            ? "Missing VITE_AFFIRM_PUBLIC_KEY or Affirm disabled"
            : !ready
            ? "Affirm is loading"
            : !canPay
            ? "Minimum $50 and cart required"
            : "Pay with Affirm"
        }
      >
        {label}
      </button>

      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, show: false }))}
      />

      <NiceModal
        open={modal.open}
        title={modal.title}
        onClose={() => setModal({ open: false, title: "", body: "", retry: false })}
        secondaryLabel="Close"
        primaryLabel={modal.retry ? "Retry" : undefined}
        onPrimary={modal.retry ? startAffirmFlow : undefined}
      >
        {modal.body}
      </NiceModal>

      <NiceModal
        open={buyerModalOpen}
        title="Buyer information"
        onClose={() => setBuyerModalOpen(false)}
        primaryLabel="Continue"
        onPrimary={() => {
          if (!buyerValid) {
            showToast("error", "Please complete all required fields correctly.");
            return;
          }
          setBuyerModalOpen(false);
          startAffirmFlow();
        }}
        secondaryLabel="Close"
        disableClose={opening}
      >
        <BuyerInfoForm value={buyer} onChange={setBuyer} />
      </NiceModal>
    </>
  );
}
