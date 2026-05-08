// src/lib/affirms.ts
declare global {
  interface Window {
    affirm?: any;
    _affirm_config?: any;
  }
}

let loading: Promise<void> | null = null;
let loadedScriptSrc: string | null = null;
let loadedPublicKey: string | null = null;

function normalizeEnv(env: string): "prod" | "sandbox" {
  const value = String(env || "").trim().toLowerCase();

  if (value === "sandbox" || value === "test") return "sandbox";
  return "prod";
}

function getAffirmScriptUrl(env: "prod" | "sandbox") {
  return env === "sandbox"
    ? "https://cdn1-sandbox.affirm.com/js/v2/affirm.js"
    : "https://cdn1.affirm.com/js/v2/affirm.js";
}

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function waitForAffirmReady(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!canUseDom()) {
      reject(new Error("No DOM available"));
      return;
    }

    const started = Date.now();

    const tick = () => {
      if (window.affirm?.checkout && typeof window.affirm.checkout === "function") {
        resolve();
        return;
      }

      if (Date.now() - started > timeoutMs) {
        reject(new Error("Affirm script loaded but checkout API did not initialize"));
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

function removeExistingAffirmScript(src?: string | null) {
  if (!canUseDom() || !src) return;

  const scripts = Array.from(document.querySelectorAll("script"));
  for (const script of scripts) {
    if ((script as HTMLScriptElement).src === src) {
      script.parentNode?.removeChild(script);
    }
  }
}

function sameConfig(scriptSrc: string, publicKey: string) {
  return loadedScriptSrc === scriptSrc && loadedPublicKey === publicKey;
}

function resetAffirmGlobals() {
  if (!canUseDom()) return;

  try {
    delete window.affirm;
  } catch {
    window.affirm = undefined;
  }

  try {
    delete window._affirm_config;
  } catch {
    window._affirm_config = undefined;
  }
}

export function loadAffirm(
  publicKey: string,
  env: "prod" | "sandbox" | "production" | string = "prod"
): Promise<void> {
  if (!canUseDom()) {
    return Promise.reject(new Error("No DOM available"));
  }

  const trimmedKey = String(publicKey || "").trim();

  if (!trimmedKey) {
    return Promise.reject(new Error("Missing Affirm public key"));
  }

  const normalizedEnv = normalizeEnv(env);
  const scriptSrc = getAffirmScriptUrl(normalizedEnv);

  if (window.affirm?.checkout && sameConfig(scriptSrc, trimmedKey)) {
    return Promise.resolve();
  }

  if (loading && sameConfig(scriptSrc, trimmedKey)) {
    return loading;
  }

  const configChanged =
    (loadedScriptSrc && loadedScriptSrc !== scriptSrc) ||
    (loadedPublicKey && loadedPublicKey !== trimmedKey);

  if (configChanged) {
    loading = null;
    removeExistingAffirmScript(loadedScriptSrc);
    resetAffirmGlobals();
  }

  loadedScriptSrc = scriptSrc;
  loadedPublicKey = trimmedKey;

  loading = new Promise<void>((resolve, reject) => {
    window._affirm_config = {
      public_api_key: trimmedKey,
      script: scriptSrc,
    };

    const existing = Array.from(document.querySelectorAll("script")).find(
      (el) => (el as HTMLScriptElement).src === scriptSrc
    ) as HTMLScriptElement | undefined;

    const finishOk = () => {
      waitForAffirmReady()
        .then(() => resolve())
        .catch((err) => {
          loading = null;
          reject(err);
        });
    };

    const finishErr = (msg: string) => {
      loading = null;
      reject(new Error(msg));
    };

    if (existing) {
      if (window.affirm?.checkout) {
        resolve();
        return;
      }

      finishOk();
      return;
    }

    const s = document.createElement("script");
    s.async = true;
    s.src = scriptSrc;

    s.onload = () => finishOk();
    s.onerror = () => finishErr("Failed to load Affirm script");

    document.head.appendChild(s);
  });

  return loading;
}