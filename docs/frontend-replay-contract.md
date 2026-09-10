# CyberSentinel AI ? Replay Mode Contract & Integration Guide

> **Target Version**: Backend v2.0 (FastAPI Replay Services)  
> **Source Files Inspected**:  
> - `backend/services/replay_service.py`  
> - `backend/api/endpoints.py` (lines 216?264)  
> - `backend/schemas/forecast.py`  

---

## 1. Replay Architecture & Principles

The Replay System provides deterministic, repeatable evaluation and demonstration of CyberSentinel AI without requiring active network probes or external traffic injection.

### Core Architectural Guarantees:
1. **Live Neural Inference**: Replay mode does **NOT** read precomputed or canned predictions. At each discrete 30-second window step, raw flow records from `datasets/sample/<scenario>.csv` are aggregated into a 24-D physical state vector via `NetworkStateBuilder`, transformed through `FeatureScaler`, and passed through `CyberWorldModelV2` in real-time.
2. **Zero Lookahead Leakage**: Only windows up to the current index $t$ are exposed to the sequence builder. Future observations $t+1 \dots t+K$ are strictly withheld.
3. **Ground Truth Comparison**: Each step injects `ground_truth_stage` and `ground_truth_next_stage` derived from the scenario dataset into the response object so the frontend can display real-time forecast accuracy vs. actual historical attack progression.

---

## 2. API Endpoints & Request/Response Flow

```
[Frontend UI]                     [Backend ReplayService]
     ?                                       ?
     ???? GET /replay/scenarios ????????????>? (Scans datasets/sample/*.csv)
     ?<?? {"scenarios": ["trace_01", ...]} ???
     ?                                       ?
     ???? POST /replay/start ???????????????>? (Loads CSV, builds windows,
     ?    {"scenario_id": "trace_03"}        ?  creates session UUID)
     ?<?? {"session_id": "f8a29b1c", ...} ????
     ?                                       ?
     ???? POST /replay/step?session_id=... ?>? (Extracts window t, runs V2 model,
     ?                                       ?  advances window index)
     ?<?? {window_index: 0, forecast: ...} ???
     ?                                       ?
     ???? (User clicks Step or Auto-Play) ??>?
     ?                                       ?
     ???? POST /replay/step?session_id=... ?>? (Window index = total_windows - 1)
     ?<?? {is_complete: true, forecast: ...}??
```

### 2.1 `GET /api/v1/replay/scenarios`
Returns list of available scenarios.
- **Response**: `{"scenarios": ["trace_multistage_01", "trace_multistage_02", "trace_multistage_03"]}`

### 2.2 `POST /api/v1/replay/start`
- **Request Body**: `{"scenario_id": "trace_multistage_03", "k_steps": 4}`
- **Response**: `{"session_id": "f8a29b1c", "scenario_id": "trace_multistage_03", "total_windows": 18, "window_size_seconds": 30.0, "k_steps": 4}`

### 2.3 `POST /api/v1/replay/step?session_id=f8a29b1c`
- **Response**:
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
    "confidence": 0.8845,
    "attack_probability": 0.1245,
    "risk_score": 12.5,
    "risk_level": "LOW",
    "telemetry_features": {
      "flow_count": 45.0,
      "total_packets": 320.0,
      "total_bytes": 48200.0,
      "pkt_rate": 10.667,
      "byte_rate": 1606.67
    }
  }
}
```

### 2.4 `GET /api/v1/replay/status?session_id=f8a29b1c`
- **Response**: `{"session_id": "f8a29b1c", "scenario_id": "trace_multistage_03", "current_window": 5, "total_windows": 18, "is_complete": false, "elapsed_seconds": 150.0}`

---

## 3. Frontend Implementation Recommendations

1. **Auto-Play Cadence**: In demo mode, step cadence should be 2.5s; in standard mode, 1.5s per window.
2. **Playback Scrubber**: Render a progress bar with clickable window markers to step through historical traces.
3. **Accuracy Comparison**: Highlight when `forecast.predicted_next_stage === forecast.ground_truth_next_stage` with a subtle green badge to demonstrate model fidelity to judges.
