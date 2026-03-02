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

function getAffirmScriptUrl(env: "prod" | "sandbox") {
  return env === "sandbox"
    ? "https://cdn1-sandbox.affirm.com/js/v2/affirm.js"
    : "https://cdn1.affirm.com/js/v2/affirm.js";
}

function waitForAffirmReady(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const tick = () => {
      if (window.affirm?.checkout) {
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
  if (!src) return;
  const scripts = Array.from(document.querySelectorAll("script"));
  for (const script of scripts) {
    if ((script as HTMLScriptElement).src === src) {
      script.parentNode?.removeChild(script);
    }
  }
}

export function loadAffirm(
  publicKey: string,
  env: "prod" | "sandbox" = "prod"
) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }

  const trimmedKey = String(publicKey || "").trim();
  if (!trimmedKey) {
    return Promise.reject(new Error("Missing Affirm public key"));
  }

  const scriptSrc = getAffirmScriptUrl(env);

  // Already ready with the same config
  if (
    window.affirm?.checkout &&
    loadedScriptSrc === scriptSrc &&
    loadedPublicKey === trimmedKey
  ) {
    return Promise.resolve();
  }

  // A load is already in progress for the same config
  if (loading && loadedScriptSrc === scriptSrc && loadedPublicKey === trimmedKey) {
    return loading;
  }

  // Config changed -> reset
  if (
    (loadedScriptSrc && loadedScriptSrc !== scriptSrc) ||
    (loadedPublicKey && loadedPublicKey !== trimmedKey)
  ) {
    loading = null;
    window.affirm = undefined;
    window._affirm_config = undefined;
    removeExistingAffirmScript(loadedScriptSrc);
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

    const finishSuccess = () => {
      waitForAffirmReady()
        .then(() => resolve())
        .catch((err) => {
          loading = null;
          reject(err);
        });
    };

    const finishError = () => {
      loading = null;
      reject(new Error("Failed to load Affirm script"));
    };

    if (existing) {
      finishSuccess();
      return;
    }

    const s = document.createElement("script");
    s.async = true;
    s.src = scriptSrc;

    s.onload = () => finishSuccess();
    s.onerror = () => finishError();

    document.head.appendChild(s);
  });

  return loading;
}