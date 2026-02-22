//src/lib/affirms.ts
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

function waitForAffirmReady(timeoutMs = 7000): Promise<void> {
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

function removeExistingAffirmScript(src: string) {
  const scripts = Array.from(document.querySelectorAll("script"));
  for (const script of scripts) {
    if ((script as HTMLScriptElement).src === src) {
      script.parentNode?.removeChild(script);
    }
  }
}

export function loadAffirm(publicKey: string, env: "prod" | "sandbox" = "prod") {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }

  const trimmedKey = String(publicKey || "").trim();
  if (!trimmedKey) {
    return Promise.reject(new Error("Missing Affirm public key"));
  }

  const scriptSrc = getAffirmScriptUrl(env);

  // Si ya está cargado y coincide con la config actual, listo
  if (
    window.affirm?.checkout &&
    loadedScriptSrc === scriptSrc &&
    loadedPublicKey === trimmedKey
  ) {
    return Promise.resolve();
  }

  // Si ya había una carga en curso con la misma config, reusar
  if (
    loading &&
    loadedScriptSrc === scriptSrc &&
    loadedPublicKey === trimmedKey
  ) {
    return loading;
  }

  // Si cambió config (env o key), resetear estado e intentar recarga limpia
  if (
    (loadedScriptSrc && loadedScriptSrc !== scriptSrc) ||
    (loadedPublicKey && loadedPublicKey !== trimmedKey)
  ) {
    loading = null;
    window.affirm = undefined;
    removeExistingAffirmScript(loadedScriptSrc || scriptSrc);
  }

  loadedScriptSrc = scriptSrc;
  loadedPublicKey = trimmedKey;

  loading = new Promise<void>((resolve, reject) => {
    window._affirm_config = {
      public_api_key: trimmedKey,
      script: scriptSrc,
    };

    // Si ya existe el script en DOM, no insertamos otro; solo esperamos init
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
      // Si ya está y affirm no está listo todavía, esperamos
      finishSuccess();
      return;
    }

    const s = document.createElement("script");
    s.async = true;
    s.src = scriptSrc;

    s.onload = () => {
      finishSuccess();
    };

    s.onerror = () => {
      finishError();
    };

    document.head.appendChild(s);
  });

  return loading;
}