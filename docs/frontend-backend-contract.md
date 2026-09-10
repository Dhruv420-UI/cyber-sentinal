# CyberSentinel AI ? Frontend/Backend REST API Contract

> **Target Version**: Backend v2.0 (FastAPI + CyberWorldModelV2)  
> **Base URL**: `http://localhost:8000/api/v1`  
> **Source Files Inspected**:  
> - `backend/app.py`  
> - `backend/api/endpoints.py`  
> - `backend/api/stream_endpoints.py`  
> - `backend/schemas/forecast.py`  
> - `backend/schemas/stream.py`  
> - `backend/middleware/security.py`  
> - `backend/services/model_service.py`  
> - `backend/services/replay_service.py`  
> - `backend/services/live_ingest_service.py`  

---

## 1. Global Architectural Conventions & Headers

### 1.1 Base URL & Path Prefixes
- REST API Base: `/api/v1`
- Streaming Control & Ingestion: `/api/v1/stream`
- Static UI Mount: `/ui` (serves `dashboard/` directory)
- Root `/`: Redirects directly to `/ui/index.html`
- OpenAPI Specification: `/openapi.json`
- Swagger UI Documentation: `/docs`
- ReDoc Documentation: `/redoc`

### 1.2 Global Response Headers (SecurityMiddleware)
Every response emitted by the backend includes the following HTTP response headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### 1.3 CORS Configuration
Configured in `backend/app.py` via Starlette `CORSMiddleware`:
- `allow_origins`: `["*"]`
- `allow_credentials`: `True`
- `allow_methods`: `["*"]`
- `allow_headers`: `["*"]`

### 1.4 Rate Limiting & Payload Bounding
Enforced by `SecurityMiddleware` (`backend/middleware/security.py`):
- **Rate Limit**: Sliding 60-second window per client IP (default: `120` req/min, configured via `CYBERSENTINEL_RATE_LIMIT`).
  - Rate limit failure response: HTTP `429 Too Many Requests`
  - Body: `{"detail": "Too Many Requests: Rate limit exceeded"}`
  - Header: `Retry-After: 60`
  - Exemption: Static files under `/ui` are exempt.
- **Request Body Bounding**: Maximum body size is `10 MB` (`10 * 1024 * 1024` bytes).
  - Payload too large response: HTTP `413 Payload Too Large`
  - Body: `{"detail": "Payload Too Large: Max body size is 10 MB"}`
- **API Key Authorization (Optional)**:
  - Enabled if environment variable `CYBERSENTINEL_API_KEY` is non-empty.
  - Required Header: `X-API-Key: <secret_key>`
  - Failure response: HTTP `401 Unauthorized`
  - Body: `{"detail": "Invalid or missing X-API-Key header"}`
  - Exempt paths: `/ui*`, `/docs`, `/openapi.json`, `/redoc`, `/`.

---

## 2. Comprehensive Endpoint Index

| Method | Endpoint Path | Category | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | System | Check basic system components (Model, Calibration, Dataset, Ollama) |
| `GET` | `/api/v1/model/info` | ML Info | Model architecture parameters, T* calibration, and Phase 8C benchmark |
| `POST` | `/api/v1/forecast` | ML Inference | Full unified forecast from raw 24-D feature sequence `x_seq` |
| `POST` | `/api/v1/rollout` | ML Inference | Autoregressive K-step forward simulation (t+1 ... t+K) |
| `POST` | `/api/v1/explain` | ML Explainability | Top feature deltas ranked by absolute change and narrative |
| `POST` | `/api/v1/mitre` | Threat Intel | Deterministic MITRE ATT&CK v14 mapping for predicted stage |
| `POST` | `/api/v1/risk` | Risk Engine | Multi-factor risk scoring (0?100), severity band, and priority |
| `POST` | `/api/v1/agent/query` | Analyst Agent | Evidence-grounded natural language Q&A (Ollama / deterministic template) |
| `GET` | `/api/v1/replay/scenarios` | Replay Engine | List sample trace scenarios available on disk |
| `POST` | `/api/v1/replay/start` | Replay Engine | Initialize an in-memory chronological replay session |
| `POST` | `/api/v1/replay/step` | Replay Engine | Step forward 1 window, execute live inference, return ground truth |
| `GET` | `/api/v1/replay/status` | Replay Engine | Query window progress and active status of a replay session |
| `POST` | `/api/v1/stream/start` | Live Stream | Launch background streaming session (netflow, pcap, or replay) |
| `POST` | `/api/v1/stream/ingest` | Simulator Ingest | Ingest synthetic flow batch from Mobile Simulator or remote host |
| `POST` | `/api/v1/stream/stop` | Live Stream | Gracefully stop active background streaming session |
| `GET` | `/api/v1/stream/status` | Live Stream | Query active streaming session status, flow counts, queue depths |
| `GET` | `/api/v1/stream/health` | Live Observability| Detailed health: WS subscribers, inference latency, backpressure |
| `GET` | `/api/v1/stream/history` | Stream Cache | Retrieve last N broadcasted live events (up to 100) |

---

## 3. Core System & ML Endpoints

### 3.1 `GET /api/v1/health`
Checks baseline availability of model weights, calibration file, datasets, and local Ollama instance.
- **Request**: No body, no query parameters.
- **Success Response** (`200 OK`):
```json
{
  "status": "healthy",
  "model_loaded": true,
  "calibration_loaded": true,
  "dataset_available": true,
  "ollama_available": false
}
```
- **Field Types**:
  - `status`: `string` ("healthy" or "degraded")
  - `model_loaded`: `boolean`
  - `calibration_loaded`: `boolean`
  - `dataset_available`: `boolean`
  - `ollama_available`: `boolean`

---

### 3.2 `GET /api/v1/model/info`
Retrieves model hyperparameters, feature list, temperature calibration value, and immutable Phase 8C holdout benchmark metrics.
- **Request**: No body, no query parameters.
- **Success Response** (`200 OK`):
```json
{
  "model_name": "CyberWorldModelV2",
  "model_version": "2.0",
  "feature_dim": 24,
  "sequence_length": 8,
  "hidden_dim": 128,
  "num_layers": 2,
  "num_heads": 4,
  "num_stages": 10,
  "stages": [
    "BENIGN",
    "RECONNAISSANCE",
    "INITIAL_ACCESS",
    "EXECUTION",
    "CREDENTIAL_ACCESS",
    "DISCOVERY",
    "LATERAL_MOVEMENT",
    "COMMAND_AND_CONTROL",
    "EXFILTRATION",
    "UNKNOWN"
  ],
  "calibrated_temperature": 1.568,
  "benchmark": {
    "dataset": "Hard Multi-Stage Holdout (Phase 8C)",
    "n_test_sequences": 44,
    "genuine_transitions": 6,
    "top1_accuracy": "97.73%",
    "top3_accuracy": "100.00%",
    "transition_accuracy": "83.33% (5/6)",
    "brier_score_calibrated": "0.0452",
    "attack_fpr": "0.00%"
  }
}
```

---

### 3.3 `POST /api/v1/forecast`
Primary inference endpoint. Accepts an unscaled sequence of 24-D feature vectors representing the historical context window, runs `CyberWorldModelV2`, executes rollout, explainability, MITRE mapping, and risk scoring, and returns the canonical `CyberSentinelForecast` response.

- **Request Body** (`application/json`):
```json
{
  "x_seq": [
    [0.12, 10.0, 1500.0, 0.33, 50.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.05, 150.0],
    [0.15, 12.0, 1800.0, 0.40, 60.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.05, 150.0]
  ],
  "mask": [true, true],
  "k_steps": 4
}
```
- **Validation Rules**:
  - `x_seq`: `List[List[float]]` (Required). Outer list length typically 1 to 8. Every inner list **must contain exactly 24 floats**.
  - `mask`: `Optional[List[bool]]` (Defaults to `None`).
  - `k_steps`: `int` (Defaults to `4`, minimum `1`, maximum `16`).
- **Success Response** (`200 OK` ? Canonical `CyberSentinelForecast`):
```json
{
  "timestamp": "2026-09-09T20:50:00.000000Z",
  "model_version": "CyberWorldModelV2",
  "forecast_horizon": 30,
  "current_stage": "RECONNAISSANCE",
  "attack_probability": 0.8954,
  "predicted_next_stage": "CREDENTIAL_ACCESS",
  "next_stage_probability": 0.8241,
  "confidence": 0.8241,
  "transition_detected": true,
  "transition_confidence": 0.8241,
  "uncertainty_entropy": 0.1824,
  "calibrated_temperature": 1.568,
  "stage_probabilities": {
    "BENIGN": 0.0012,
    "RECONNAISSANCE": 0.0821,
    "INITIAL_ACCESS": 0.0120,
    "EXECUTION": 0.0050,
    "CREDENTIAL_ACCESS": 0.8241,
    "DISCOVERY": 0.0210,
    "LATERAL_MOVEMENT": 0.0410,
    "COMMAND_AND_CONTROL": 0.0080,
    "EXFILTRATION": 0.0030,
    "UNKNOWN": 0.0026
  },
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
    },
    {
      "step": 3,
      "predicted_stage": "LATERAL_MOVEMENT",
      "confidence": 0.6954,
      "uncertainty": 0.2840,
      "attack_probability": 0.9340
    },
    {
      "step": 4,
      "predicted_stage": "LATERAL_MOVEMENT",
      "confidence": 0.6410,
      "uncertainty": 0.3210,
      "attack_probability": 0.9450
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
    },
    {
      "feature": "rst_ratio",
      "current": 0.02,
      "predicted": 0.48,
      "abs_change": 0.46,
      "rel_change_pct": 2300.0,
      "direction": "increase"
    }
  ],
  "stage_relevant_features": [
    {
      "feature": "failed_flow_count",
      "current": 0.0,
      "predicted": 12.4,
      "abs_change": 12.4,
      "rel_change_pct": 1240.0,
      "direction": "increase"
    }
  ],
  "explanation_narrative": "Physical state projection indicates severe escalation in failed flow counts and TCP RST flags.",
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
  "primary_technique_id": "T1110",
  "primary_technique_name": "Brute Force",
  "risk_score": 78.4,
  "risk_level": "CRITICAL",
  "recommended_priority": "IMMEDIATE ? isolate affected hosts, escalate to incident response",
  "time_to_transition_hint": "Transition RECONNAISSANCE -> CREDENTIAL_ACCESS predicted within the next 30s window.",
  "safety_flags": {
    "nan_detected": false,
    "collapse_detected": false,
    "feature_dim_valid": true
  },
  "provenance": {
    "prediction": "CyberWorldModelV2",
    "explanation": "physical_state_delta",
    "mitre": "MITRE_ATT&CK_v14_static_mapping",
    "risk": "RiskEngine_deterministic",
    "narrative": "CyberSentinel_defensive_agent"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `{"detail": "Each sequence step must have exactly 24 features (got X at step Y)"}`
  - `503 Service Unavailable`: `{"detail": "ModelService unavailable: ..."}`

---

### 3.4 `POST /api/v1/rollout`
Computes an isolated K-step autoregressive forward simulation without generating the full unified forecast bundle.
- **Request Body**: Same `ForecastRequest` schema (`x_seq`, `mask`, `k_steps`).
- **Success Response** (`200 OK`):
```json
{
  "k_steps": 4,
  "rollout": [
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
  "safety_flags": {
    "nan_detected": false,
    "collapse_detected": false,
    "feature_dim_valid": true
  }
}
```

---

### 3.5 `POST /api/v1/explain`
Calculates feature attribution deltas between current state and predicted next physical state.
- **Request Body**: `ForecastRequest` schema.
- **Success Response** (`200 OK`):
```json
{
  "narrative": "Feature attribution derived from CyberWorldModelV2 physical state predictor delta.",
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
  "stage_relevant_features": [
    {
      "feature": "rst_ratio",
      "current": 0.02,
      "predicted": 0.48,
      "abs_change": 0.46,
      "rel_change_pct": 2300.0,
      "direction": "increase"
    }
  ]
}
```

---

### 3.6 `POST /api/v1/mitre`
Deterministically queries the static MITRE ATT&CK v14 matrix for techniques corresponding to a predicted stage.
- **Request Query Parameter**: `predicted_stage` (optional `string`, query string): e.g., `?predicted_stage=CREDENTIAL_ACCESS`
- **Request Body** (optional): `ForecastRequest` if query parameter is omitted.
- **Success Response** (`200 OK`):
```json
{
  "predicted_stage": "CREDENTIAL_ACCESS",
  "techniques": [
    {
      "technique_id": "T1110",
      "name": "Brute Force",
      "tactic": "Credential Access",
      "rationale": "Elevated failed_flow_count, failed_flow_ratio, and rst_ratio are signatures of brute-force authentication attempts.",
      "sub_techniques": ["T1110.001", "T1110.003"],
      "mapping_provenance": "MITRE ATT&CK Enterprise v14 static mapping"
    }
  ],
  "primary_technique_id": "T1110",
  "primary_technique_name": "Brute Force"
}
```

---

### 3.7 `POST /api/v1/risk`
Evaluates multi-factor risk scoring formula:
risk_score = 100 * [0.40 * P(attack) + 0.35 * severity(stage) + 0.15 * conf + 0.10 * urgency]

- **Request Query Parameter**: `horizon_steps` (`int`, default: `1`): Lookahead horizon factor.
- **Request Body**: `ForecastRequest` schema.
- **Success Response** (`200 OK`):
```json
{
  "risk_score": 78.4,
  "risk_level": "CRITICAL",
  "recommended_priority": "IMMEDIATE ? isolate affected hosts, escalate to incident response",
  "time_to_transition_hint": "Transition RECONNAISSANCE -> CREDENTIAL_ACCESS predicted within the next 30s window.",
  "components": {
    "attack_probability": 0.3582,
    "stage_severity": 0.2625,
    "forecast_confidence": 0.1236,
    "horizon_urgency": 0.1000
  },
  "formula": "risk = 100 * (w_attack * P(attack) + w_severity * severity(stage) + w_confidence * confidence + w_urgency * urgency(horizon)). Weights: attack=0.4, severity=0.35, confidence=0.15, urgency=0.1."
}
```

---

### 3.8 `POST /api/v1/agent/query`
Orchestrates natural language Q&A between a SOC analyst and the defensive intelligence agent. Grounded strictly in structured forecast data.
- **Request Body** (`AgentQueryRequest`):
```json
{
  "query": "What should the analyst investigate?",
  "session_id": "a1b2c3d4",
  "current_forecast": null
}
```
- **Success Response** (`200 OK` ? `AgentQueryResponse`):
```json
{
  "answer": "Based on the current model output, the following investigation steps are recommended:

1. **Verify RECONNAISSANCE indicators** ? check source IPs, connection patterns, and port activity
2. **Examine failed_flow_count** ? changed +1240.0% (0.000 -> 12.400)
3. **Reference MITRE T1110** (Brute Force) for detection signatures
4. **Escalate if risk remains CRITICAL** ? IMMEDIATE ? isolate affected hosts, escalate to incident response

_All recommendations derived from CyberWorldModelV2 output. No LLM-generated conclusions._",
  "tool_calls": [
    "route_classifier:investigate",
    "get_attack_forecast",
    "get_feature_importance",
    "get_mitre_mapping",
    "get_risk_assessment"
  ],
  "provenance": "CyberSentinel_defensive_agent",
  "llm_backend": "template_fallback",
  "grounded_in_model_output": true
}
```

---

## 4. Replay Engine Endpoints

### 4.1 `GET /api/v1/replay/scenarios`
Lists all scenario CSV filenames available in `datasets/sample/`.
- **Success Response** (`200 OK`):
```json
{
  "scenarios": [
    "trace_multistage_01",
    "trace_multistage_02",
    "trace_multistage_03"
  ]
}
```

### 4.2 `POST /api/v1/replay/start`
Initializes a new replay session.
- **Request Body** (`ReplayStartRequest`):
```json
{
  "scenario_id": "trace_multistage_03",
  "k_steps": 4
}
```
- **Success Response** (`200 OK` ? `ReplayStartResponse`):
```json
{
  "session_id": "f8a29b1c",
  "scenario_id": "trace_multistage_03",
  "total_windows": 18,
  "window_size_seconds": 30.0,
  "k_steps": 4
}
```

### 4.3 `POST /api/v1/replay/step`
Advances the active replay session forward by exactly one 30-second window.
- **Request Query Parameter**: `session_id` (`string`, required)
- **Success Response** (`200 OK` ? `ReplayStepResponse`):
```json
{
  "session_id": "f8a29b1c",
  "window_index": 0,
  "is_complete": false,
  "forecast": {
    "current_stage": "BENIGN",
    "predicted_next_stage": "RECONNAISSANCE",
    "ground_truth_stage": "BENIGN",
    "ground_truth_next_stage": "RECONNAISSANCE",
    "telemetry_features": {
      "flow_count": 45.0,
      "total_packets": 320.0,
      "total_bytes": 48200.0,
      "pkt_rate": 10.667,
      "byte_rate": 1606.67,
      "unique_src_ips": 3.0,
      "unique_dst_ips": 12.0,
      "unique_dst_ports": 8.0,
      "syn_count": 12.0,
      "rst_count": 1.0,
      "fin_count": 8.0,
      "syn_ratio": 0.267,
      "rst_ratio": 0.022,
      "dst_ip_entropy": 2.14,
      "dst_port_entropy": 1.95,
      "failed_flow_count": 0.0,
      "failed_flow_ratio": 0.0,
      "tcp_flag_diversity": 1.82,
      "port_445_share": 0.0,
      "port_3389_share": 0.0,
      "port_22_share": 0.0,
      "port_80_443_share": 0.85,
      "mean_flow_duration": 0.42,
      "bytes_per_packet": 150.625
    }
  }
}
```

### 4.4 `GET /api/v1/replay/status`
Queries progress of an active replay session.
- **Request Query Parameter**: `session_id` (`string`, required)
- **Success Response** (`200 OK` ? `ReplayStatusResponse`):
```json
{
  "session_id": "f8a29b1c",
  "scenario_id": "trace_multistage_03",
  "current_window": 5,
  "total_windows": 18,
  "is_complete": false,
  "elapsed_seconds": 150.0
}
```

---

## 5. Live Streaming Control & Telemetry Ingestion

### 5.1 `POST /api/v1/stream/start`
Starts a background ingestion worker reading from NetFlow, PCAP, or replay traces.
- **Request Body** (`StartSessionRequest`):
```json
{
  "source_kind": "replay",
  "source_path": "datasets/sample/trace_multistage_01.csv",
  "window_seconds": 30.0,
  "k_steps": 4,
  "netflow_port": 9995
}
```
- **Success Response** (`200 OK`):
```json
{
  "status": "started",
  "session_id": "d4e5f6a7-b8c9-4012-9876-123456789abc",
  "source_kind": "replay",
  "window_seconds": 30.0,
  "k_steps": 4
}
```

### 5.2 `POST /api/v1/stream/ingest`
Receives batches of flow records transmitted by the **Mobile Traffic Simulator** (`dashboard/simulator.html`).
- **Request Body** (`IngestTelemetryRequest`):
```json
{
  "flows": [
    {
      "src_ip": "192.168.1.105",
      "dst_ip": "192.168.1.10",
      "src_port": 45120,
      "dst_port": 80,
      "protocol": 6,
      "packets": 8,
      "bytes": 1040,
      "duration": 0.045,
      "syn_flag": 1,
      "ack_flag": 1,
      "rst_flag": 0,
      "fin_flag": 1,
      "psh_flag": 1,
      "urg_flag": 0,
      "failed": false,
      "timestamp": 1773199800.125,
      "label": "UNKNOWN"
    }
  ],
  "session_id": "mob_7x9q2p1",
  "source_id": "MobileSim-normal",
  "k_steps": 4,
  "window_seconds": 10.0
}
```
- **Success Response** (`200 OK` ? `StreamEvent`):
```json
{
  "event_id": "evt_1a2b3c4d",
  "session_id": "mob_7x9q2p1",
  "timestamp": "2026-09-09T20:55:00.000000Z",
  "window_id": "win_9f8e7d6c",
  "window_index": 1,
  "status": "FORECAST",
  "source_id": "MobileSim-normal",
  "flow_count": 1,
  "flows_per_second": 0.1,
  "inference_latency_ms": 14.8,
  "current_stage": "BENIGN",
  "predicted_next_stage": "BENIGN",
  "attack_probability": 0.012,
  "confidence": 0.985,
  "risk_score": 4.5,
  "risk_level": "LOW",
  "transition_detected": false,
  "transition_probability": 0.015,
  "recommended_priority": "ROUTINE ? continue baseline monitoring",
  "primary_technique_id": null,
  "primary_technique_name": null,
  "mitre_techniques": [],
  "top_features": [
    {
      "feature": "byte_rate",
      "current": 104.0,
      "predicted": 102.5,
      "abs_change": 1.5,
      "rel_change_pct": -1.4,
      "direction": "decrease"
    }
  ],
  "rollout_steps": [
    {
      "step": 1,
      "predicted_stage": "BENIGN",
      "confidence": 0.985,
      "attack_probability": 0.012
    }
  ],
  "telemetry_features": {
    "flow_count": 1.0,
    "total_packets": 8.0,
    "total_bytes": 1040.0,
    "pkt_rate": 0.8,
    "byte_rate": 104.0,
    "unique_src_ips": 1.0,
    "unique_dst_ips": 1.0,
    "unique_dst_ports": 1.0,
    "syn_count": 1.0,
    "rst_count": 0.0,
    "fin_count": 1.0,
    "syn_ratio": 1.0,
    "rst_ratio": 0.0,
    "dst_ip_entropy": 0.0,
    "dst_port_entropy": 0.0,
    "failed_flow_count": 0.0,
    "failed_flow_ratio": 0.0,
    "tcp_flag_diversity": 0.0,
    "port_445_share": 0.0,
    "port_3389_share": 0.0,
    "port_22_share": 0.0,
    "port_80_443_share": 1.0,
    "mean_flow_duration": 0.045,
    "bytes_per_packet": 130.0
  }
}
```

### 5.3 `POST /api/v1/stream/stop`
Stops an active background ingestion session.
- **Request Body**: `{"session_id": "optional_id"}`
- **Success Response** (`200 OK`): `{"status": "stopped", "session_id": "..."}`

### 5.4 `GET /api/v1/stream/status`
Queries session statistics and subscriber queue counts.
- **Success Response** (`200 OK`): `{"active": true, "session_id": "...", "windows_processed": 12, "flows_ingested": 540, "subscribers": 2, "history_events_available": 12}`

### 5.5 `GET /api/v1/stream/health`
Production observability endpoint monitoring socket usage, backpressure, and pipeline latency.
- **Success Response** (`200 OK`): `{"status": "healthy", "active_session": true, "websocket_subscribers": 1, "max_ws_connections": 50, "inference_latency_ms": 15.2, "flows_per_second": 18.0, "queue_backpressure_status": "nominal"}`

### 5.6 `GET /api/v1/stream/history`
Returns recent broadcast events from the ring buffer.
- **Query Parameter**: `limit` (`int`, default: `20`, max: `100`)
- **Success Response** (`200 OK`): `{"count": 14, "limit": 20, "events": [...]}`

---

## 6. Error Handling Strategy & Standard HTTP Status Codes

| HTTP Status | Trigger Condition | Example Detail Payload |
|---|---|---|
| `200 OK` | Request succeeded | Standard response schema |
| `400 Bad Request` | Invalid sequence dimension, missing fields, or bad parameters | `{"detail": "Each sequence step must have exactly 24 features"}` |
| `401 Unauthorized` | Missing or invalid `X-API-Key` when security auth is active | `{"detail": "Invalid or missing X-API-Key header"}` |
| `404 Not Found` | Replay session ID not found or scenario file missing | `{"detail": "Replay session 'xyz' not found. Start a new session."}` |
| `413 Payload Too Large` | Request body exceeds 10 MB | `{"detail": "Payload Too Large: Max body size is 10 MB"}` |
| `429 Too Many Requests` | Exceeded rate limit of 120 req/min | `{"detail": "Too Many Requests: Rate limit exceeded"}` |
| `503 Service Unavailable` | PyTorch model checkpoint or scaler unavailable | `{"detail": "ModelService unavailable: ..."}` |

---

## 7. Frontend Integration Guidelines for Redesign

1. **Strict 24-D Vector Compliance**: Any custom manual forecast call to `POST /api/v1/forecast` MUST format `x_seq` as an array of arrays where each inner array contains **precisely 24 floats**.
2. **Handle Fail-Closed Statuses**: When processing responses from `POST /api/v1/stream/ingest` or live streams, check `status`:
   - If `status === "BUFFERING"`, show loading/warming indicator.
   - If `status === "MODEL_UNAVAILABLE"`, alert the operator that the backend model is offline. Do NOT fabricate predictions.
3. **Session ID Retention**: Save `session_id` returned by `/replay/start` or `/stream/start` in client-side state (React Context / Zustand / TanStack Query) to pass to `/replay/step` and `/stream/stop`.
4. **No Direct Model Inspection**: The frontend must never attempt to invoke PyTorch methods directly; all interaction is strictly mediated through these documented REST, WebSocket, or SSE interfaces.
