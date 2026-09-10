# CyberSentinel AI ? Server-Sent Events (SSE) Integration Contract

> **Target Version**: Backend v2.0 (FastAPI Stream Endpoints)  
> **SSE Endpoint**: `http://<host>:8000/api/v1/stream/events`  
> **Inspected Source Files**:  
> - `backend/api/stream_endpoints.py` (lines 329?373)  
> - `backend/services/live_ingest_service.py`  
> - `backend/schemas/stream.py`  

---

## 1. Overview & Protocol Specification

The Server-Sent Events (SSE) stream provides a unidirectional, HTTP-compliant event stream designed for lightweight browser clients, firewalled SOC environments, or readonly monitoring terminals where WebSocket handshakes are blocked or unnecessary.

### 1.1 HTTP Headers Emitted by Server
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```
*Note*: `X-Accel-Buffering: no` ensures reverse proxies like Nginx do not buffer SSE chunk payloads.

---

## 2. Event Types & Payloads

The server emits three distinct event types:

### 2.1 `event: connected`
Emitted immediately when client opens `EventSource`:
```sse
event: connected
data: {"status": "connected", "timestamp": "2026-09-09T21:05:00.000000Z"}

```

### 2.2 `event: <status_lowercase>` (Forecast Events)
When a live threat forecast is computed, the SSE `event:` field is populated dynamically with the lowercase representation of `event.status` (e.g., `event: forecast`, `event: buffering`, `event: model_unavailable`):

```sse
event: forecast
data: {"event_id": "evt_9a8b7c6d", "session_id": "live_stream_01", "timestamp": "2026-09-09T21:05:30.000000Z", "window_id": "win_01", "window_index": 4, "status": "FORECAST", "current_stage": "CREDENTIAL_ACCESS", "predicted_next_stage": "LATERAL_MOVEMENT", "attack_probability": 0.9412, "confidence": 0.8845, "risk_score": 82.5, "risk_level": "CRITICAL", "transition_detected": true, "transition_probability": 0.8845, "recommended_priority": "IMMEDIATE ? isolate affected hosts", "primary_technique_id": "T1021", "primary_technique_name": "Remote Services", "mitre_techniques": [{"technique_id": "T1021", "name": "Remote Services", "tactic": "Lateral Movement", "rationale": "Remote service abuse", "mapping_provenance": "MITRE ATT&CK Enterprise v14 static mapping"}], "top_features": [{"feature": "port_445_share", "current": 0.02, "predicted": 0.54, "abs_change": 0.52, "rel_change_pct": 2600.0, "direction": "increase"}], "rollout_steps": [{"step": 1, "predicted_stage": "LATERAL_MOVEMENT", "confidence": 0.8845, "attack_probability": 0.9412}], "telemetry_features": {"flow_count": 55.0, "port_445_share": 0.54, "byte_rate": 8450.0}}

```

### 2.3 `event: heartbeat`
Emitted every 15 seconds if no live events occur, preventing proxy connection timeouts:
```sse
event: heartbeat
data: {"timestamp": "2026-09-09T21:05:45.000000Z"}

```

---

## 3. Native Browser JavaScript Consumption

```javascript
const eventSource = new EventSource("http://localhost:8000/api/v1/stream/events");

eventSource.addEventListener("connected", (e) => {
  const data = JSON.parse(e.data);
  console.log("SSE connected at", data.timestamp);
});

eventSource.addEventListener("forecast", (e) => {
  const forecast = JSON.parse(e.data);
  console.log("Threat forecast:", forecast.current_stage, "->", forecast.predicted_next_stage);
  updateDashboard(forecast);
});

eventSource.addEventListener("buffering", (e) => {
  console.log("Buffering pipeline windows...");
});

eventSource.addEventListener("heartbeat", (e) => {
  // Reset liveness monitor
});

eventSource.onerror = (err) => {
  console.error("SSE connection error:", err);
};
```

---

## 4. Architectural Comparison: WebSocket vs. SSE

| Capability | WebSocket (`/api/v1/stream/ws`) | Server-Sent Events (`/api/v1/stream/events`) |
|---|---|---|
| **Direction** | Bidirectional (Client ping/pong & unsubscribe) | Unidirectional (Server to client only) |
| **History Replay** | Replays last 10 historical events on connect | Real-time events only |
| **Connection Slots** | Enforces max 50 concurrent connections | Managed by Starlette ASGI connection pool |
| **Firewall / Proxy** | May require sticky sessions & proxy bypass | Standard HTTP/1.1 or HTTP/2 chunked stream |
| **Auto Reconnect** | Requires custom client JS exponential backoff | Native browser `EventSource` automatic reconnect |
