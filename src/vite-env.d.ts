/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AFFIRM_PUBLIC_KEY?: string;
  readonly VITE_AFFIRM_ENV?: "prod" | "sandbox";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
