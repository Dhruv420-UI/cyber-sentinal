/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_STREAM_URL?: string;
  readonly VITE_SSE_STREAM_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_DEFAULT_K_STEPS?: string;
  readonly VITE_REPLAY_INTERVAL_MS?: string;
  readonly VITE_DEMO_MODE_DEFAULT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
