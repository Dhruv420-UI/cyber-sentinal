# CyberSentinel AI ? Frontend/Backend Gaps & Inconsistencies

> **Audit Date**: 2026-09-09  
> **Source Comparison**: `dashboard/index.html` vs. `backend/app.py`, `backend/api/endpoints.py`, `backend/api/stream_endpoints.py`, and `backend/schemas/`  

---

## 1. Discovered Gaps & Inconsistencies

| # | Component | Frontend Implementation (`dashboard/index.html`) | Backend Reality (`backend/`) | Severity | Resolution for Redesign |
|---|---|---|---|---|---|
| 1 | **API URL Configuration** | Hardcoded to `const API = 'http://localhost:8000/api/v1'` in `index.html`. Breaks when accessed remotely (e.g. from mobile or secondary laptop). | Backend binds to `0.0.0.0:8000`. Expects requests from LAN hosts (`192.168.1.X`). | High | Use dynamic base URL detection: `window.location.origin + '/api/v1'`, with configurable fallback or `.env` override. |
| 2 | **API Key Header** | Frontend `api()` helper never includes `X-API-Key` header. | `SecurityMiddleware` verifies `X-API-Key` against `CYBERSENTINEL_API_KEY` if set. | High | Add optional API Key configuration in UI settings or read from environment variable `VITE_API_KEY`. |
| 3 | **WebSocket Reconnection** | Basic one-time reconnect on toggle. No exponential backoff or auto-recovery on network drops. | Server drops sockets upon 15s timeout or restarts. | Medium | Implement robust exponential backoff (1s, 2s, 4s, 8s, max 30s) and automatic reconnection. |
| 4 | **Unscaled vs. Scaled Vectors** | `POST /api/v1/forecast` expects raw physical values if passed through `NetworkStateBuilder`, but `ModelService` applies internal scaling. If frontend sends arbitrary numbers, model predicts out-of-distribution. | `FeatureScaler` requires strict 24-D input matching `FEATURE_NAMES`. | Critical | Provide frontend type guards enforcing exact 24 feature array formatting. |
| 5 | **Fail-Closed Status Handling** | Frontend catches `BUFFERING`, `MODEL_UNAVAILABLE`, and `INVALID_TELEMETRY`, but silently ignores `SCALER_UNAVAILABLE`. | `LiveIngestService` returns `status: "SCALER_UNAVAILABLE"` when `scaler.pt` or `scaler.joblib` is missing. | Medium | Explicitly render dedicated warning banners for `SCALER_UNAVAILABLE`. |
| 6 | **Replay State Sync** | If replay session completes (`is_complete: true`), stepping again sends unnecessary requests that return null forecasts. | `ReplayService` handles subsequent steps gracefully, but client UI shouldn't hammer the API. | Low | Disable Step and Auto-Play buttons immediately when `is_complete` is true. |
| 7 | **Stream History Pagination** | Current UI polls `/stream/history` without limit parameter. | `GET /stream/history` supports `?limit=N` (max 100). | Low | Leverage `limit` parameter to bound bandwidth and memory usage. |

---

## 2. Deprecations & Anti-Patterns to Avoid in Redesign

1. **Avoid Hardcoded Intelligence**: Never embed canned attack stage progressions, fake accuracy scores, or synthetic confidence in frontend templates. All data must flow from backend endpoints.
2. **Avoid Global Window Mutation**: Existing code uses mutable global `state` object. The modern frontend must employ declarative React state (Zustand or React Context).
3. **Avoid Raw HTML Injection**: The current UI uses `innerHTML` with a naive regex-based markdown parser. The redesign must use secure component-based markdown rendering (`react-markdown` + `remark-gfm`).
