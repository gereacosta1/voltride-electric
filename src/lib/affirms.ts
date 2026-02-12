declare global {
  interface Window {
    affirm?: any;
    _affirm_config?: any;
  }
}

let loading: Promise<void> | null = null;

export function loadAffirm(publicKey: string, env: "prod" | "sandbox" = "prod") {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));

  // ya cargado
  if (window.affirm?.checkout) return Promise.resolve();

  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    window._affirm_config = {
      public_api_key: publicKey,
      script: env === "sandbox" ? "https://cdn1-sandbox.affirm.com/js/v2/affirm.js" : "https://cdn1.affirm.com/js/v2/affirm.js",
    };

    // loader oficial-like
    const s = document.createElement("script");
    s.async = true;
    s.src = window._affirm_config.script;

    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Affirm script"));

    document.head.appendChild(s);
  });

  return loading;
}
