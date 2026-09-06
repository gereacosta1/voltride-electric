// src/lib/affirms.ts

type AffirmCheckoutFunction = ((
  ...args: unknown[]
) => unknown) & {
  open?: (...args: unknown[]) => unknown;
};

type AffirmSdk = {
  checkout?: AffirmCheckoutFunction;
};

type AffirmConfig = {
  public_api_key: string;
  script: string;
};

declare global {
  interface Window {
    affirm?: AffirmSdk;
    _affirm_config?: AffirmConfig;
  }
}

type AffirmEnvironment =
  | "prod"
  | "sandbox";

const AFFIRM_READY_TIMEOUT_MS =
  15_000;

const AFFIRM_READY_POLL_MS =
  50;

let loading: Promise<void> | null =
  null;

let loadedScriptSrc:
  | string
  | null = null;

let loadedPublicKey:
  | string
  | null = null;

function normalizeEnv(
  env: string
): AffirmEnvironment {
  const value = String(
    env || ""
  )
    .trim()
    .toLowerCase();

  if (
    value === "sandbox" ||
    value === "test"
  ) {
    return "sandbox";
  }

  return "prod";
}

function getAffirmScriptUrl(
  env: AffirmEnvironment
) {
  return env === "sandbox"
    ? "https://cdn1-sandbox.affirm.com/js/v2/affirm.js"
    : "https://cdn1.affirm.com/js/v2/affirm.js";
}

function canUseDom() {
  return (
    typeof window !==
      "undefined" &&
    typeof document !==
      "undefined"
  );
}

function isAffirmReady() {
  return (
    canUseDom() &&
    typeof window.affirm
      ?.checkout === "function"
  );
}

function waitForAffirmReady(
  timeoutMs =
    AFFIRM_READY_TIMEOUT_MS
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      if (!canUseDom()) {
        reject(
          new Error(
            "No DOM available"
          )
        );

        return;
      }

      const startedAt =
        Date.now();

      const check = () => {
        if (isAffirmReady()) {
          resolve();
          return;
        }

        if (
          Date.now() -
            startedAt >=
          timeoutMs
        ) {
          reject(
            new Error(
              "Affirm script loaded but checkout API did not initialize"
            )
          );

          return;
        }

        window.setTimeout(
          check,
          AFFIRM_READY_POLL_MS
        );
      };

      check();
    }
  );
}

function removeExistingAffirmScript(
  src?: string | null
) {
  if (
    !canUseDom() ||
    !src
  ) {
    return;
  }

  const scripts =
    document.querySelectorAll<HTMLScriptElement>(
      "script[src]"
    );

  scripts.forEach(
    (script) => {
      if (
        script.src === src
      ) {
        script.remove();
      }
    }
  );
}

function findAffirmScript(
  src: string
): HTMLScriptElement | null {
  if (!canUseDom()) {
    return null;
  }

  const scripts =
    document.querySelectorAll<HTMLScriptElement>(
      "script[src]"
    );

  for (const script of scripts) {
    if (script.src === src) {
      return script;
    }
  }

  return null;
}

function sameConfig(
  scriptSrc: string,
  publicKey: string
) {
  return (
    loadedScriptSrc ===
      scriptSrc &&
    loadedPublicKey ===
      publicKey
  );
}

function resetAffirmGlobals() {
  if (!canUseDom()) {
    return;
  }

  try {
    delete window.affirm;
  } catch {
    window.affirm =
      undefined;
  }

  try {
    delete window
      ._affirm_config;
  } catch {
    window._affirm_config =
      undefined;
  }
}

function resetLoaderState() {
  loading = null;
  loadedScriptSrc = null;
  loadedPublicKey = null;
}

function cleanupFailedLoad(
  scriptSrc: string
) {
  removeExistingAffirmScript(
    scriptSrc
  );

  resetAffirmGlobals();
  resetLoaderState();
}

export function loadAffirm(
  publicKey: string,
  env:
    | "prod"
    | "sandbox"
    | "production"
    | string = "prod"
): Promise<void> {
  if (!canUseDom()) {
    return Promise.reject(
      new Error(
        "No DOM available"
      )
    );
  }

  const trimmedKey =
    String(publicKey || "")
      .trim();

  if (!trimmedKey) {
    return Promise.reject(
      new Error(
        "Missing Affirm public key"
      )
    );
  }

  const normalizedEnv =
    normalizeEnv(env);

  const scriptSrc =
    getAffirmScriptUrl(
      normalizedEnv
    );

  if (
    isAffirmReady() &&
    sameConfig(
      scriptSrc,
      trimmedKey
    )
  ) {
    return Promise.resolve();
  }

  if (
    loading &&
    sameConfig(
      scriptSrc,
      trimmedKey
    )
  ) {
    return loading;
  }

  const existingConfig =
    window._affirm_config;

  const existingConfigKey =
    String(
      existingConfig
        ?.public_api_key ||
        ""
    ).trim();

  const existingConfigScript =
    String(
      existingConfig?.script ||
        ""
    ).trim();

  const configChanged =
    Boolean(
      loadedScriptSrc &&
        loadedScriptSrc !==
          scriptSrc
    ) ||
    Boolean(
      loadedPublicKey &&
        loadedPublicKey !==
          trimmedKey
    ) ||
    Boolean(
      existingConfigKey &&
        existingConfigKey !==
          trimmedKey
    ) ||
    Boolean(
      existingConfigScript &&
        existingConfigScript !==
          scriptSrc
    );

  if (configChanged) {
    if (loadedScriptSrc) {
      removeExistingAffirmScript(
        loadedScriptSrc
      );
    }

    if (
      existingConfigScript &&
      existingConfigScript !==
        loadedScriptSrc
    ) {
      removeExistingAffirmScript(
        existingConfigScript
      );
    }

    removeExistingAffirmScript(
      scriptSrc
    );

    resetAffirmGlobals();
    resetLoaderState();
  }

  loadedScriptSrc =
    scriptSrc;

  loadedPublicKey =
    trimmedKey;

  loading =
    new Promise<void>(
      (resolve, reject) => {
        window._affirm_config = {
          public_api_key:
            trimmedKey,

          script:
            scriptSrc,
        };

        const existing =
          findAffirmScript(
            scriptSrc
          );

        const finishOk =
          async () => {
            try {
              await waitForAffirmReady();

              resolve();
            } catch (
              error: unknown
            ) {
              cleanupFailedLoad(
                scriptSrc
              );

              reject(
                error instanceof
                  Error
                  ? error
                  : new Error(
                      "Affirm failed to initialize"
                    )
              );
            }
          };

        const finishError = (
          message: string
        ) => {
          cleanupFailedLoad(
            scriptSrc
          );

          reject(
            new Error(message)
          );
        };

        if (existing) {
          if (
            isAffirmReady()
          ) {
            resolve();
            return;
          }

          void finishOk();
          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.async = true;
        script.src = scriptSrc;

        script.dataset.voltrideAffirm =
          "true";

        script.onload = () => {
          void finishOk();
        };

        script.onerror = () => {
          finishError(
            "Failed to load Affirm script"
          );
        };

        document.head.appendChild(
          script
        );
      }
    );

  return loading;
}