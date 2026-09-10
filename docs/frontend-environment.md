# CyberSentinel AI ? Frontend Environment & Configuration

---

## 1. Environment Variables Configuration

For the redesigned frontend (Next.js / Vite / React), create a `.env.example` file specifying configurable runtime settings:

```env
# Base URL for REST API (falls back to window.location.origin in production)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# WebSocket URL for real-time telemetry stream
VITE_WS_STREAM_URL=ws://localhost:8000/api/v1/stream/ws

# Server-Sent Events URL
VITE_SSE_STREAM_URL=http://localhost:8000/api/v1/stream/events

# Optional API key for backend authentication (leave blank if disabled)
VITE_API_KEY=

# Default lookahead horizon steps (1 step = 30s)
VITE_DEFAULT_K_STEPS=4

# Default replay auto-play interval in milliseconds
VITE_REPLAY_INTERVAL_MS=1800

# Demo presentation mode default (true / false)
VITE_DEMO_MODE_DEFAULT=false
```

---

## 2. Dynamic Runtime Resolution

To support zero-configuration deployments (e.g., accessing the dashboard from a phone or second laptop on local LAN `http://192.168.1.100:8000/ui/`), the frontend should dynamically resolve base URLs if environment variables are not set:

```typescript
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

export function getWsStreamUrl(): string {
  if (import.meta.env.VITE_WS_STREAM_URL) {
    return import.meta.env.VITE_WS_STREAM_URL;
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/api/v1/stream/ws`;
  }
  return 'ws://localhost:8000/api/v1/stream/ws';
}
```
