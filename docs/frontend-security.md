# CyberSentinel AI ? Frontend Security & Threat Surface Analysis

> **Inspected Source Files**:  
> - `backend/middleware/security.py`  
> - `backend/app.py`  
> - `configs/default_config.yaml`  

---

## 1. Backend Security Boundaries & Constraints

1. **Strictly Defensive Perimeter**: The system possesses zero socket injection, offensive exploit execution, or packet crafting tools. The agent cannot be coerced through prompt injection to launch offensive counter-attacks.
2. **Rate Limiting (Sliding Window)**: Client IP rate limited to 120 requests/minute. The frontend must avoid excessive rapid polling of REST endpoints; prefer WebSocket stream subscriptions.
3. **WebSocket Connection Capping**: Max 50 active subscribers. The frontend must cleanly close WebSocket connections when components unmount to avoid exhausting connection pools.
4. **Body Size Limits**: Payloads over 10 MB are rejected with HTTP 413.
5. **No Secret Leakage**:
   - Backend secrets (`CYBERSENTINEL_API_KEY`, file system paths, model checkpoint paths) must NEVER be exposed in frontend bundles or client logs.
   - Any sensitive backend paths must be sanitized before rendering in the UI.

---

## 2. Frontend Security Best Practices for Redesign

1. **Sanitize Markdown & HTML**:
   - The current UI's naive regex-based markdown parser is susceptible to XSS if agent output contains unsanitized HTML tags.
   - Redesign must use `react-markdown` with `rehype-sanitize` to guarantee zero arbitrary script injection.
2. **CORS & Origin Safety**:
   - In production, configure FastAPI `allow_origins` to restrict requests to authorized domain origins instead of `["*"]`.
3. **Zero Token Storage in LocalStorage**:
   - If API key authentication is enabled in a multi-user environment, store tokens in secure, HTTP-only session cookies or memory rather than unencrypted `localStorage`.
4. **Input Validation**:
   - Ensure all input sliders and form parameters in the Mobile Simulator or manual forecast screens enforce boundary checks (e.g. ports between 1 and 65535, non-negative packet counts).
