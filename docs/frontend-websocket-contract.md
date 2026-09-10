# CyberSentinel AI ? WebSocket Integration Contract

> **Target Version**: Backend v2.0 (FastAPI Stream Endpoints)  
> **WebSocket URI**: `ws://<host>:8000/api/v1/stream/ws` (or `wss://` for TLS)  
> **Inspected Source Files**:  
> - `backend/api/stream_endpoints.py` (lines 199?322)  
> - `backend/services/live_ingest_service.py`  
> - `backend/schemas/stream.py`  
> - `backend/middleware/security.py`  

---

## 1. Connection Handshake & Lifecycle

### 1.1 Connection Establishment
- **Endpoint**: `/api/v1/stream/ws`
- **Protocols**: Standard WebSocket (`RFC 6455`)
- **Connection Limiting**: Enforced via `SecurityManager.acquire_ws_slot()`.
  - Max concurrent subscribers: `50` (configurable via `CYBERSENTINEL_MAX_WS_CONNECTIONS`).
  - If limit reached: Server rejects with WebSocket close code **`1013`** (`"MAX_CONNECTIONS_REACHED"`).
- **Immediately on Connect**:
  1. Server accepts connection: `await websocket.accept()`.
  2. Server transmits connection confirmation frame:
  ```json
  {
    "type": "connected",
    "timestamp": "2026-09-09T21:00:00.000000Z",
    "message": "Connected to CyberSentinel Live Stream. Replaying recent events."
  }
  ```
  3. Server iterates through the last 10 historical events stored in the in-memory ring buffer (`event_log[-10:]`) and sends each as a JSON message frame so late-joining dashboards immediately populate their initial state.

---

## 2. Inbound Messages (Client -> Server)

The client may transmit lightweight control frames formatted as JSON:

### 2.1 Ping / Liveness Check
```json
{
  "type": "ping"
}
```
- **Server Action**: Immediately replies with Pong frame:
```json
{
  "type": "pong",
  "timestamp": "2026-09-09T21:00:05.123456Z"
}
```

### 2.2 Graceful Unsubscribe
```json
{
  "type": "unsubscribe"
}
```
- **Server Action**: Server breaks the subscription loop and cleanly closes the socket with standard close code `1000`.

---

## 3. Outbound Messages (Server -> Client)

### 3.1 Periodic Heartbeat
Every `15.0 seconds` (`_HEARTBEAT_INTERVAL = 15.0`), if no live inference event has been produced, the server transmits:
```json
{
  "type": "heartbeat",
  "timestamp": "2026-09-09T21:00:15.000000Z"
}
```
*Frontend Note*: The frontend should reset its deadman timer upon receiving either a heartbeat or a live forecast event.

### 3.2 Live Threat Stream Event (`StreamEvent`)
Produced every time a 30-second window completes or synthetic flow batch is ingested:

```json
{
  "event_id": "evt_4f89b21a",
  "session_id": "mob_8x92p",
  "timestamp": "2026-09-09T21:00:30.000000Z",
  "window_id": "win_12ab34cd",
  "window_index": 3,
  "status": "FORECAST",
  "source_id": "MobileSim-recon",
  "flow_count": 42,
  "flows_per_second": 1.4,
  "inference_latency_ms": 14.82,
  "current_stage": "RECONNAISSANCE",
  "predicted_next_stage": "CREDENTIAL_ACCESS",
  "attack_probability": 0.8954,
  "confidence": 0.8241,
  "risk_score": 78.4,
  "risk_level": "CRITICAL",
  "transition_detected": true,
  "transition_probability": 0.8241,
  "recommended_priority": "IMMEDIATE ? isolate affected hosts, escalate to incident response",
  "primary_technique_id": "T1110",
  "primary_technique_name": "Brute Force",
  "mitre_techniques": [
    {
      "technique_id": "T1110",
      "name": "Brute Force",
      "tactic": "Credential Access",
      "rationale": "Elevated failed_flow_count and rst_ratio indicate password brute forcing.",
      "sub_techniques": ["T1110.001", "T1110.003"],
      "mapping_provenance": "MITRE ATT&CK Enterprise v14 static mapping"
    }
  ],
  "top_features": [
    {
      "feature": "failed_flow_count",
      "current": 0.0,
      "predicted": 12.4,
      "abs_change": 12.4,
      "rel_change_pct": 1240.0,
      "direction": "increase"
    }
  ],
  "rollout_steps": [
    {
      "step": 1,
      "predicted_stage": "CREDENTIAL_ACCESS",
      "confidence": 0.8241,
      "uncertainty": 0.1824,
      "attack_probability": 0.8954
    },
    {
      "step": 2,
      "predicted_stage": "CREDENTIAL_ACCESS",
      "confidence": 0.7812,
      "uncertainty": 0.2105,
      "attack_probability": 0.9120
    }
  ],
  "telemetry_features": {
    "flow_count": 42.0,
    "total_packets": 210.0,
    "total_bytes": 18480.0,
    "pkt_rate": 7.0,
    "byte_rate": 616.0,
    "unique_src_ips": 1.0,
    "unique_dst_ips": 14.0,
    "unique_dst_ports": 14.0,
    "syn_count": 14.0,
    "rst_count": 6.0,
    "fin_count": 0.0,
    "syn_ratio": 0.333,
    "rst_ratio": 0.143,
    "dst_ip_entropy": 2.64,
    "dst_port_entropy": 2.64,
    "failed_flow_count": 6.0,
    "failed_flow_ratio": 0.143,
    "tcp_flag_diversity": 1.25,
    "port_445_share": 0.0,
    "port_3389_share": 0.0,
    "port_22_share": 0.0,
    "port_80_443_share": 0.0,
    "mean_flow_duration": 0.002,
    "bytes_per_packet": 88.0
  }
}
```

### 3.3 Fail-Closed & Informational Status Messages
When the pipeline encounters degraded operational states:
- **Buffering Warmup**:
  ```json
  {
    "status": "BUFFERING",
    "sequence_accumulated": 3,
    "sequence_required": 5,
    "timestamp": "2026-09-09T21:00:10.000000Z"
  }
  ```
- **Model Offline (Fail-Closed)**:
  ```json
  {
    "status": "MODEL_UNAVAILABLE",
    "timestamp": "2026-09-09T21:00:10.000000Z",
    "detail": "CyberWorldModelV2 weights checkpoint not found."
  }
  ```
- **Invalid Telemetry**:
  ```json
  {
    "status": "INVALID_TELEMETRY",
    "timestamp": "2026-09-09T21:00:10.000000Z",
    "detail": "Zero flow records parsed in window."
  }
  ```

---

## 4. Backpressure & Queue Management
- **Subscriber Queue Limit**: Each connected WebSocket client has an in-memory `asyncio.Queue(maxsize=128)`.
- **Drop Policy**: If a client frontend fails to read messages quickly enough and the queue exceeds 128 items, `LiveIngestService._broadcast()` drops the message for that client and logs a warning: `"[LiveIngest] Subscriber queue full, dropping event"`.
- **Slot Release**: When the socket closes, `SecurityManager.release_ws_slot()` decrements active connections.

---

## 5. TypeScript Client Architecture for Frontend Redesign

```typescript
export interface WsStreamEvent {
  type?: 'connected' | 'heartbeat' | 'pong';
  status?: 'FORECAST' | 'BUFFERING' | 'MODEL_UNAVAILABLE' | 'INVALID_TELEMETRY';
  event_id?: string;
  session_id?: string;
  timestamp: string;
  window_id?: string;
  window_index?: number;
  current_stage?: string;
  predicted_next_stage?: string;
  attack_probability?: number;
  confidence?: number;
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  transition_detected?: boolean;
  recommended_priority?: string;
  primary_technique_id?: string | null;
  primary_technique_name?: string | null;
  mitre_techniques?: Array<{
    technique_id: string;
    name: string;
    tactic: string;
    rationale: string;
    mapping_provenance: string;
  }>;
  top_features?: Array<{
    feature: string;
    current: number;
    predicted: number;
    abs_change: number;
    rel_change_pct: number;
    direction: 'increase' | 'decrease';
  }>;
  rollout_steps?: Array<{
    step: number;
    predicted_stage: string;
    confidence: number;
    attack_probability: number;
  }>;
  telemetry_features?: Record<string, number>;
}

// Recommended Reconnection Strategy:
// Exponential backoff: 1s, 2s, 4s, 8s, max 30s.
// Emit ping every 30s to keep connection alive through load balancers/proxies.
```
