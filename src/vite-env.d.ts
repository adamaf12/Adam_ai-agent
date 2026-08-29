/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADAM_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
