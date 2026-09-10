# CyberSentinel AI ? Frontend Constraints & Ground Rules

---

## 1. Golden Rules of Frontend Development in CyberSentinel

1. **NO BACKEND MODIFICATIONS**: All frontend designs must conform to the existing FastAPI backend, Pydantic schemas, and WebSocket protocols without requiring backend changes.
2. **NO FAKE ML**: Confidence scores, risk ratings, attack stages, and transition probabilities must flow directly from backend responses. Never hardcode random mock numbers or synthetic transition schedules.
3. **FAIL-CLOSED DISCIPLINE**: If the backend returns `MODEL_UNAVAILABLE`, `SCALER_UNAVAILABLE`, or `INVALID_TELEMETRY`, render explicit operational warning states. Never synthesize fake nominal data to mask an error.
4. **THREE-DOMAIN VISUAL SEPARATION**:
   - **Observed Telemetry**: Green (`#10b981`)
   - **Forecast State**: Blue (`#3b82f6`)
   - **K=4 Simulation**: Purple (`#8b5cf6`) with mandatory label: `MODEL SIMULATION ? NO FUTURE TELEMETRY CONSUMED`.
5. **OFFLINE-FIRST CAPABILITY**: The application must bundle all icons (Lucide), fonts, and styles locally. Zero runtime dependencies on external CDNs or Google Fonts.
6. **NO OFFENSIVE CONTROLS**: Strictly preserve the defensive boundary. Do not add buttons or inputs for packet injection, scanning, or exploit launching.
