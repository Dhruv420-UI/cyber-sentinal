# CyberSentinel AI ? Frontend Feature Map

This document maps all operational capabilities across the CyberSentinel AI platform to their target UI views and backend data providers.

---

## 1. Feature to Backend Endpoint Mapping

```
???????????????????????????????????????????????????????????????????????????????
?                            CYBERSENTINEL SOC UI                             ?
???????????????????????????????????????????????????????????????????????????????
       ?              ?              ?              ?              ?
       ?              ?              ?              ?              ?
 ????????????   ????????????   ????????????   ????????????   ????????????
 ?  Status  ?   ?  Threat  ?   ? Incident ?   ? K=4 Sim  ?   ? Analyst  ?
 ?  Strip   ?   ?  Banner  ?   ? Timeline ?   ? Rollout  ?   ?  Agent   ?
 ????????????   ????????????   ????????????   ????????????   ????????????
       ?              ?              ?              ?              ?
       ?              ?              ?              ?              ?
  /api/v1/health  Live Stream   /replay/step   /rollout or    /agent/query
  /stream/health   (WS / SSE)     /history      Live Stream    (REST)
```

| Feature / View | Primary Capabilities | Backend Source | Trigger / Mode |
|---|---|---|---|
| **Subsystem Health Bar** | Live status dots for Model, Scaler, Risk Engine, MITRE, Agent, and WebSocket subscriber capacity | `GET /api/v1/health`<br>`GET /api/v1/stream/health` | Polled every 10?30s or updated via stream |
| **Active Threat Banner** | Real-time threat detection alert: Current Stage, Attack Prob, Next Stage, Confidence, Risk Score | Live Stream (`WS` or `SSE`) or Replay | Triggered on every 30s window or simulator ingest |
| **Threat Status Card** | Gauge meters for Attack Probability and Calibrated Confidence ($T^*=1.568$) | `CyberSentinelForecast` object | Live or Replay |
| **Attack Lifecycle Stepper** | Visual progression across 10 tactical stages: Current, Forecast, Simulated, Observed, Not Reached | `current_stage`, `predicted_next_stage`, `rollout_steps` | Continuous reactive update |
| **Replay Control Panel** | Scenario selection (`trace_01..03`), Step-forward, Auto-play with adjustable cadence, progress bar | `GET /replay/scenarios`<br>`POST /replay/start`<br>`POST /replay/step` | User-driven replay mode |
| **Live Ingestion Control** | Source selector (NetFlow UDP:9995, PCAP, Replay), start/stop session, connection status | `POST /stream/start`<br>`POST /stream/stop`<br>`GET /stream/status` | User-driven live stream mode |
| **Telemetry Ingest Grid** | 12 physical network metrics (packets/s, byte rate, IPs, ports, SYN/RST ratios, entropy) | `telemetry_features` in `StreamEvent` or `ReplayStepResponse` | Live or Replay |
| **Incident Progression Table** | Chronological ledger of historical windows with ground truth vs. forecast comparison | `timeline` cache and `GET /stream/history` | Appended on every window completion |
| **K=4 Forward Simulation** | Autoregressive forward trajectory ($t+1 \dots t+4$) explicitly badged as **MODEL SIMULATION** | `rollout_steps` in forecast or `POST /rollout` | Automatic per window |
| **Feature Attribution Table** | Ranked feature deltas $|S_{t+1} - S_t|$, relative change %, directional arrows, narrative | `top_features`, `stage_relevant_features`, `explanation_narrative` | Per forecast |
| **MITRE ATT&CK Card** | Technique ID chips, tactic, name, physical rationale, static v14 provenance | `mitre_techniques`, `primary_technique_id` | Per forecast |
| **Dynamic Risk Escalation** | 4-segment meter (LOW, MEDIUM, HIGH, CRITICAL), formula components, operational priority | `risk_score`, `risk_level`, `recommended_priority` | Per forecast |
| **Analyst Agent Assistant** | Conversational chat grounded in structured facts, tool call badges, 7 quick queries | `POST /api/v1/agent/query` | Interactive user prompt |
| **Benchmark Reference View** | Immutable Phase 8C Hard Holdout performance metrics comparison table | `GET /api/v1/model/info` | Static / Reference tab |
| **Mobile Traffic Simulator** | Synthetic flow generator with 6 traffic profiles for judge demonstrations | `POST /api/v1/stream/ingest` | Independent mobile web app |
