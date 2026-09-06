// src/components/AffirmButton.tsx
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadAffirm } from "../lib/affirms";
import {
  buildAffirmCheckout,
  type CartItem as Item,
  type Customer,
} from "../lib/affirmCheckouts";

type ButtonCartItem = {
  name: string;
  sku?: string | number;
  price: number;
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

const MIN_TOTAL_CENTS = 5000;
const CHECKOUT_ENDPOINT = "/api/affirm-checkout";
const AUTHORIZE_ENDPOINT = "/api/affirm-authorize";
const TRACE_ENDPOINT = "/api/trace";

const toCents = (usd = 0) =>
  Math.max(0, Math.round((Number(usd) || 0) * 100));

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) return 1;

  return Math.max(1, Math.floor(quantity));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error || "");
}

const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const isUSState = (v: string) =>
  /^[A-Z]{2}$/.test(String(v || "").trim().toUpperCase());
const isUSZip = (v: string) => /^\d{5}(-\d{4})?$/.test(String(v || "").trim());

const DEBUG_STORAGE_KEY = "voltride_affirm_debug_v1";
const DEBUG_MAX_EVENTS = 200;

type DebugEvent = {
  ts: string;
  step: string;
  data?: Record<string, any>;
};

type DebugState = {
  debugId: string;
  createdAt: string;
  events: DebugEvent[];
};

type BuyerForm = {
  firstName: string;
  lastName: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

type AffirmCheckoutCallbacks = {
  onSuccess: (result: { checkout_token: string }) => void | Promise<void>;
  onFail: () => void;
  onValidationError: () => void;
  onClose: () => void;
};

type AffirmCheckoutApi = {
  (options: { checkout_token: string }): void;
  open: (callbacks: AffirmCheckoutCallbacks) => void;
};

type AffirmClient = {
  checkout?: AffirmCheckoutApi;
};

type AffirmWindow = Window & {
  affirm?: AffirmClient;
};

function getAffirmClient(): AffirmClient | null {
  if (typeof window === "undefined") return null;

  return (window as AffirmWindow).affirm ?? null;
}

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse<T>(raw: string | null): T | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeJsonStringify(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function makeDebugId() {
  return `dbg_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function canUseStorage() {
  if (typeof window === "undefined") return false;

  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function getOrInitDebugState(): DebugState {
  if (!canUseStorage()) {
    return {
      debugId: makeDebugId(),
      createdAt: nowIso(),
      events: [],
    };
  }

  const existing = safeJsonParse<DebugState>(
    window.localStorage.getItem(DEBUG_STORAGE_KEY)
  );

  if (existing?.debugId && Array.isArray(existing.events)) return existing;

  const init: DebugState = {
    debugId: makeDebugId(),
    createdAt: nowIso(),
    events: [],
  };

  window.localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(init));
  return init;
}

function persistDebugState(next: DebugState) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Debug persistence must never block checkout.
  }
}

function normalizeAffirmEnv(value: string): "prod" | "sandbox" {
  const env = String(value || "").trim().toLowerCase();

  if (env === "sandbox" || env === "test") return "sandbox";
  return "prod";
}

function sanitizeEmail(email: string) {
  const e = String(email || "").trim();
  const at = e.indexOf("@");

  if (at === -1) return "";

  const domain = e.slice(at + 1);
  return `***@${domain}`;
}

function sanitizeToken(token: string) {
  const t = String(token || "").trim();

  return {
    token_len: t.length,
    token_prefix: t ? `${t.slice(0, 8)}…` : "",
  };
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getAffirmTokenFromResponse(payload: any): string {
  return String(
    payload?.data?.checkout_token ||
      payload?.checkout_token ||
      payload?.data?.token ||
      ""
  ).trim();
}

function getAffirmRedirectUrlFromResponse(payload: any): string {
  return String(
    payload?.data?.redirect_url ||
      payload?.redirect_url ||
      payload?.data?.redirect ||
      ""
  ).trim();
}

function extractServerError(payload: any) {
  const details = payload?.details ?? payload?.data ?? payload ?? null;

  const code =
    payload?.details?.code ||
    payload?.code ||
    details?.code ||
    details?.error_code ||
    null;

  const field = payload?.details?.field || payload?.field || details?.field || null;

  const message =
    payload?.details?.message ||
    payload?.message ||
    details?.message ||
    payload?.error ||
    "Affirm checkout failed";

  const reqId =
    payload?.affirm_request_id ||
    payload?.reqId ||
    payload?.request_id ||
    null;

  const debug_id = payload?.debug_id || payload?.debugId || null;

  return {
    message: String(message || "Affirm checkout failed"),
    code: code ? String(code) : null,
    field: field ? String(field) : null,
    reqId: reqId ? String(reqId) : null,
    debug_id: debug_id ? String(debug_id) : null,
  };
}

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

  const style =
    type === "success"
      ? "border-lime-300/30 bg-lime-300/15 text-lime-100"
      : type === "error"
      ? "border-red-400/30 bg-red-400/15 text-red-100"
      : "border-white/15 bg-[#0d1422]/95 text-white";

  return (
    <button
      type="button"
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      onClick={onClose}
      className={`fixed bottom-6 left-1/2 z-[9999] max-w-[92vw] -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl transition ${style}`}
    >
      {message}
    </button>
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
  disableClose = false,
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
  const titleId = useId();

  useEffect(() => {
    if (!open || disableClose || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, disableClose, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm disabled:cursor-default"
        onClick={onClose}
        aria-label="Close modal overlay"
        disabled={disableClose}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1422] text-white shadow-[0_30px_100px_rgba(0,0,0,.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h3 id={titleId} className="text-xl font-black text-white">
              {title}
            </h3>

            <button
              onClick={onClose}
              className="rounded-xl p-1 text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Close"
              title={disableClose ? "Please wait" : "Close"}
              type="button"
              disabled={disableClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="relative px-6 py-5">
          <div className="whitespace-pre-line text-sm leading-relaxed text-white/65">
            {children}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {secondaryLabel ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white/75 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={disableClose}
              >
                {secondaryLabel}
              </button>
            ) : null}

            {primaryLabel ? (
              <button
                type="button"
                onClick={onPrimary}
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-white/90 active:scale-[.98]"
              >
                {primaryLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerInfoForm({
  value,
  onChange,
}: {
  value: BuyerForm;
  onChange: (next: BuyerForm) => void;
}) {
  const set = (key: keyof BuyerForm, nextValue: string) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-sky-300/40 focus:ring-2 focus:ring-sky-300/15";

  const labelClass = "mb-1 block text-xs font-semibold text-white/60";

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-white/60">
        Enter the buyer information to continue with Affirm financing.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>First name</span>
          <input
            className={inputClass}
            value={value.firstName}
            onChange={(event) => set("firstName", event.target.value)}
            autoComplete="given-name"
            placeholder="John"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Last name</span>
          <input
            className={inputClass}
            value={value.lastName}
            onChange={(event) => set("lastName", event.target.value)}
            autoComplete="family-name"
            placeholder="Smith"
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Email</span>
        <input
          className={inputClass}
          value={value.email}
          onChange={(event) => set("email", event.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="customer@email.com"
        />
      </label>

      <label className="block">
        <span className={labelClass}>Address line 1</span>
        <input
          className={inputClass}
          value={value.line1}
          onChange={(event) => set("line1", event.target.value)}
          autoComplete="address-line1"
          placeholder="11510 Biscayne Blvd"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>City</span>
          <input
            className={inputClass}
            value={value.city}
            onChange={(event) => set("city", event.target.value)}
            autoComplete="address-level2"
            placeholder="Miami"
          />
        </label>

        <label className="block">
          <span className={labelClass}>State</span>
          <input
            className={inputClass}
            value={value.state}
            onChange={(event) =>
              set("state", event.target.value.toUpperCase().slice(0, 2))
            }
            maxLength={2}
            placeholder="FL"
            autoComplete="address-level1"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>ZIP</span>
          <input
            className={inputClass}
            value={value.zip}
            onChange={(event) => set("zip", event.target.value)}
            inputMode="numeric"
            placeholder="33181"
            autoComplete="postal-code"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Country</span>
          <input
            className={`${inputClass} cursor-not-allowed opacity-70`}
            value="US"
            disabled
            readOnly
            aria-label="Country"
          />
        </label>
      </div>
    </div>
  );
}

export default function AffirmButton({
  cartItems = [],
  totalUSD,
  shippingUSD = 0,
  taxUSD = 0,
}: Props) {
  const PUBLIC_KEY = String(import.meta.env.VITE_AFFIRM_PUBLIC_KEY || "").trim();

  const ENV = normalizeAffirmEnv(
    String(import.meta.env.VITE_AFFIRM_ENV || import.meta.env.AFFIRM_ENV || "prod")
  );

  const showDebugPanel = Boolean(import.meta.env.DEV);

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

  const [debugState, setDebugStateUI] = useState<DebugState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const flowOutcomeRef = useRef<null | "server" | "client" | "success">(null);

  useEffect(() => {
    try {
      setDebugStateUI(getOrInitDebugState());
    } catch {
      setDebugStateUI(null);
    }
  }, []);

  const addDebugEvent = useCallback(
    (step: string, data?: Record<string, any>) => {
      try {
        const st = getOrInitDebugState();

        const next: DebugState = {
          ...st,
          events: [
            ...st.events,
            {
              ts: nowIso(),
              step,
              data: data || undefined,
            },
          ].slice(-DEBUG_MAX_EVENTS),
        };

        persistDebugState(next);
        setDebugStateUI(next);
      } catch {
        // Debugging must never block checkout.
      }
    },
    []
  );

  const traceServer = useCallback(
    async (step: string, data?: Record<string, any>) => {
      try {
        const st = getOrInitDebugState();

        await fetch(TRACE_ENDPOINT, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            debugId: st.debugId,
            step,
            ts: nowIso(),
            data,
            ua:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "",
            href:
              typeof window !== "undefined"
                ? window.location.href
                : "",
          }),
          keepalive: true,
        });
      } catch {
        // Tracing must never block checkout.
      }
    },
    []
  );

  const showToast = (
    type: "success" | "error" | "info",
    message: string,
    ms = 2200
  ) => {
    if (typeof window === "undefined") return;

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({ show: true, type, message });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((s) => ({ ...s, show: false }));
      toastTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const mapped: Item[] = useMemo(() => {
    return (cartItems || []).map((it, i) => ({
      id: (it.id ?? it.sku ?? String(i + 1)) as string | number,
      title: String(it.name ?? `Item ${i + 1}`).trim() || `Item ${i + 1}`,
      price: Math.max(0, Number(it.price) || 0),
      qty: normalizeQuantity(it.qty),
      url: typeof it.url === "string" && it.url.trim() ? it.url : "/",
      image: typeof it.image === "string" && it.image.trim() ? it.image : undefined,
    }));
  }, [cartItems]);

  const subtotalC = mapped.reduce((acc, it) => acc + toCents(it.price) * it.qty, 0);
  const shippingC = toCents(shippingUSD);
  const taxC = toCents(taxUSD);

  const totalC =
    typeof totalUSD === "number" ? toCents(totalUSD) : subtotalC + shippingC + taxC;

  const affirmEnabled = Boolean(PUBLIC_KEY);

  const canPay =
    affirmEnabled && ready && mapped.length > 0 && totalC >= MIN_TOTAL_CENTS;

  useEffect(() => {
    let mounted = true;

    if (!PUBLIC_KEY) {
      setReady(false);
      addDebugEvent("affirm_public_key_missing");
      traceServer("affirm_public_key_missing").catch(() => {});
      return;
    }

    addDebugEvent("affirm_load_start", { env: ENV });
    traceServer("affirm_load_start", { env: ENV }).catch(() => {});

    loadAffirm(PUBLIC_KEY, ENV)
      .then(() => {
        if (mounted) setReady(true);
        addDebugEvent("affirm_load_ok", { env: ENV });
        traceServer("affirm_load_ok", { env: ENV }).catch(() => {});
      })
      .catch((e) => {
        if (mounted) setReady(false);
        const message = getErrorMessage(e);

        addDebugEvent("affirm_load_fail", { message });
        traceServer("affirm_load_fail", { message }).catch(() => {});
      });

    return () => {
      mounted = false;
    };
  }, [PUBLIC_KEY, ENV, addDebugEvent, traceServer]);

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
    if (opening || typeof window === "undefined") return;

    const affirm = getAffirmClient();
    flowOutcomeRef.current = null;

    addDebugEvent("open_attempt", {
      cart_items: mapped.length,
      total_cents: totalC,
      has_public_key: Boolean(PUBLIC_KEY),
      env: ENV,
    });

    traceServer("open_attempt", {
      cart_items: mapped.length,
      total_cents: totalC,
      has_public_key: Boolean(PUBLIC_KEY),
      env: ENV,
    }).catch(() => {});

    if (!affirm?.checkout) {
      addDebugEvent("affirm_not_ready");
      traceServer("affirm_not_ready").catch(() => {});
      showToast("error", "Affirm is not ready yet");
      return;
    }

    if (!canPay) {
      const why =
        mapped.length === 0
          ? "Your cart is empty."
          : totalC < MIN_TOTAL_CENTS
          ? "The total is too low for Affirm. Minimum is $50."
          : !ready
          ? "Affirm is still loading."
          : "Affirm is unavailable.";

      addDebugEvent("cannot_pay", { why });
      traceServer("cannot_pay", { why }).catch(() => {});

      setModal({
        open: true,
        title: "Affirm unavailable",
        body: why,
        retry: !ready,
      });
      return;
    }

    if (!buyerValid) {
      setBuyerModalOpen(true);
      return;
    }

    setModal({ open: false, title: "", body: "", retry: false });
    setBuyerModalOpen(false);

    const base = window.location.origin.replace("http://", "https://");
    const customer = buildCustomerFromBuyer();

    const checkout = buildAffirmCheckout(
      mapped,
      { subtotalUSD: subtotalC / 100, shippingUSD, taxUSD },
      customer,
      base
    );

    addDebugEvent("checkout_built", {
      total: Number(checkout.total),
      shipping_amount: checkout.shipping_amount,
      tax_amount: checkout.tax_amount,
      currency: checkout.currency,
      billing_email: sanitizeEmail(customer.email),
    });

    setOpening(true);

    try {
      const debug_id = getOrInitDebugState().debugId;

      const resp = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ debug_id, checkout }),
      });

      const text = await safeReadText(resp);
      const parsed = tryParseJson(text);
      const payload = parsed ?? { _raw: text };

      if (!resp.ok) {
        flowOutcomeRef.current = "server";

        const extracted = extractServerError(payload);
        const pretty =
          [
            extracted.message,
            extracted.code ? `code: ${extracted.code}` : null,
            extracted.field ? `field: ${extracted.field}` : null,
            extracted.reqId ? `reqId: ${extracted.reqId}` : null,
            extracted.debug_id ? `debug: ${extracted.debug_id}` : null,
          ]
            .filter(Boolean)
            .join("\n") || `Affirm checkout failed (HTTP ${resp.status})`;

        addDebugEvent("server_checkout_http_error", {
          status: resp.status,
          code: extracted.code,
          field: extracted.field,
          reqId: extracted.reqId,
          debug_id: extracted.debug_id,
          message: extracted.message?.slice(0, 400),
        });

        setModal({
          open: true,
          title: "Affirm checkout failed",
          body: `${pretty}\nHTTP ${resp.status}`,
          retry: true,
        });

        setOpening(false);
        return;
      }

      const token = getAffirmTokenFromResponse(payload);
      const redirectUrl = getAffirmRedirectUrlFromResponse(payload);

      addDebugEvent("server_checkout_ok", {
        status: resp.status,
        has_token: Boolean(token),
        has_redirect_url: Boolean(redirectUrl),
        reqId: payload?.affirm_request_id || payload?.reqId || null,
        debug_id: payload?.debug_id || debug_id,
      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (!token) {
        flowOutcomeRef.current = "server";
        setModal({
          open: true,
          title: "Affirm response incomplete",
          body: "No checkout_token or redirect_url received from server.",
          retry: true,
        });
        setOpening(false);
        return;
      }

      affirm.checkout({ checkout_token: token });

      affirm.checkout.open({
        onSuccess: async ({ checkout_token }: { checkout_token: string }) => {
          const finalToken = String(checkout_token || token).trim();

          addDebugEvent("onSuccess", { ...sanitizeToken(finalToken) });

          if (!finalToken) {
            flowOutcomeRef.current = "client";

            setModal({
              open: true,
              title: "Missing checkout token",
              body: "Affirm completed, but no checkout token was returned.",
              retry: true,
            });
            setOpening(false);
            return;
          }

          const orderId = `ORDER-${Date.now()}`;

          try {
            const r = await fetch(AUTHORIZE_ENDPOINT, {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                debug_id: getOrInitDebugState().debugId,
                checkout_token: finalToken,
                order_id: orderId,
                amount_cents: Number(checkout.total),
                currency: "USD",
                capture: true,
              }),
            });

            const t = await safeReadText(r);
            const p = tryParseJson(t) ?? { _raw: t };

            if (!r.ok) {
              flowOutcomeRef.current = "server";

              const extracted = extractServerError(p);
              const pretty =
                [
                  extracted.message,
                  extracted.code ? `code: ${extracted.code}` : null,
                  extracted.field ? `field: ${extracted.field}` : null,
                  extracted.reqId ? `reqId: ${extracted.reqId}` : null,
                  extracted.debug_id ? `debug: ${extracted.debug_id}` : null,
                ]
                  .filter(Boolean)
                  .join("\n") || "Authorize failed";

              addDebugEvent("authorize_http_error", {
                status: r.status,
                code: extracted.code,
                field: extracted.field,
                reqId: extracted.reqId,
                debug_id: extracted.debug_id,
                message: extracted.message?.slice(0, 400),
              });

              setModal({
                open: true,
                title: "We could not confirm your request",
                body: `${pretty}\nHTTP ${r.status}`,
                retry: true,
              });

              return;
            }

            flowOutcomeRef.current = "success";

            addDebugEvent("authorize_ok", {
              status: r.status,
              reqId: p?.affirm_request_id || p?.reqId || null,
            });

            showToast("success", "Affirm request submitted!");
          } catch (error: unknown) {
            flowOutcomeRef.current = "server";

            const message = getErrorMessage(error) || "Authorization request failed.";

            addDebugEvent("authorize_network_error", {
              message: message.slice(0, 400),
            });

            setModal({
              open: true,
              title: "We could not confirm your request",
              body: message,
              retry: true,
            });
          } finally {
            setOpening(false);
          }
        },

        onFail: () => {
          flowOutcomeRef.current = "client";
          addDebugEvent("onFail");
          setOpening(false);
          setModal({
            open: true,
            title: "Financing was not completed",
            body: "You can try again.",
            retry: true,
          });
        },

        onValidationError: () => {
          flowOutcomeRef.current = "client";
          addDebugEvent("onValidationError");
          setOpening(false);
          setBuyerModalOpen(true);
        },

        onClose: () => {
          if (flowOutcomeRef.current !== null) {
            setOpening(false);
            return;
          }

          addDebugEvent("onClose");
          setOpening(false);
          setModal({
            open: true,
            title: "Process canceled",
            body: "No charges were made. Would you like to try again?",
            retry: true,
          });
        },
      });
    } catch (err) {
      flowOutcomeRef.current = "client";
      addDebugEvent("checkout_open_fatal", {
        message: getErrorMessage(err),
      });
      setOpening(false);
      showToast("error", "Could not start Affirm.");
    }
  }

  const label = !affirmEnabled
    ? "Affirm unavailable"
    : !ready
    ? "Loading Affirm..."
    : opening
    ? "Opening Affirm..."
    : "Pay with Affirm";

  const copyDebug = async () => {
    try {
      const st = canUseStorage()
        ? safeJsonParse<DebugState>(window.localStorage.getItem(DEBUG_STORAGE_KEY))
        : null;

      const text = safeJsonStringify(st || { error: "No debug data" });
      await navigator.clipboard.writeText(text);
      showToast("success", "Debug copied");
    } catch {
      showToast("error", "Could not copy debug");
    }
  };

  const clearDebug = () => {
    try {
      if (canUseStorage()) {
        window.localStorage.removeItem(DEBUG_STORAGE_KEY);
      }

      const st = getOrInitDebugState();
      setDebugStateUI(st);
      showToast("success", "Debug cleared");
    } catch {
      showToast("error", "Could not clear debug");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={startAffirmFlow}
        disabled={!affirmEnabled || opening || !canPay}
        className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl border border-sky-300/20 bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(56,189,248,.14)] transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        title={
          !affirmEnabled
            ? "Missing VITE_AFFIRM_PUBLIC_KEY"
            : !ready
            ? "Affirm is loading"
            : !canPay
            ? "Minimum $50 and cart required"
            : "Pay with Affirm"
        }
      >
        <span
          className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        >
          <span className="absolute -left-16 top-0 h-full w-24 rotate-12 bg-white/20 blur-xl" />
        </span>

        <span className="relative inline-flex items-center justify-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,.55)]"
            aria-hidden="true"
          />
          {label}
        </span>
      </button>

      {showDebugPanel && debugState?.debugId && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/35">
          <div className="truncate">
            Debug ID: <span className="font-mono">{debugState.debugId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyDebug}
              className="underline transition hover:text-white/75"
              title="Copy debug JSON"
            >
              Copy
            </button>

            <button
              type="button"
              onClick={clearDebug}
              className="underline transition hover:text-white/75"
              title="Clear debug"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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