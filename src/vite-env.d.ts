/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPEN_AI_BASE_URL: string;
  readonly VITE_DEEPSEEK_API_KEY: string;
  readonly VITE_DEEPSEEK_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GEMINI_API_KEY: string;
  }
}
