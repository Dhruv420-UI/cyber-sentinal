# CyberSentinel AI ? Defensive Analyst Agent Contract

> **Target Version**: Backend v2.0 (FastAPI Agent Service)  
> **Source Files Inspected**:  
> - `backend/agents/defensive_agent.py` (504 lines)  
> - `backend/api/endpoints.py` (`POST /api/v1/agent/query`)  
> - `backend/schemas/forecast.py` (`AgentQueryRequest`, `AgentQueryResponse`)  

---

## 1. Design Principles & Grounding Guarantees

The Defensive Analyst Agent (`CyberSentinelDefensiveAgent`) operates under strict defensive design principles:
1. **The LLM is NOT the detector**: Neural model `CyberWorldModelV2` detects anomalies and forecasts transitions. The LLM's role is strictly to explain, summarize, and prioritize analyst actions.
2. **Zero Hallucination Guarantee**: The agent is programmatically forbidden from inventing stages, confidence probabilities, MITRE technique IDs, or feature changes.
3. **Structured Context Only**: The agent prompt receives solely the structured fields of the active `CyberSentinelForecast`.
4. **Offline Priority Hierarchy**:
   - **Priority 1**: Local Ollama runtime (`http://localhost:11434`, e.g. `llama3.2`, `mistral`, `gemma2`).
   - **Priority 2**: Deterministic template fallback engine. Always available, zero network requirements, 100% grounded in model fields.
5. **Technique ID Sanitization Guard**: If Ollama generates a technique ID not present in the static forecast's `mitre_techniques` list, `_sanitize_ollama_output()` redacts it with `[TECHNIQUE_ID_REDACTED]`.

---

## 2. Query Routing & Conceptual Tools

When a natural language query is submitted, the agent classifies intent into one of 15 categories via regex matching (`_route_query()`):

| Route Category | Sample Triggers | Conceptual Tools Invoked |
|---|---|---|
| `threat_rationale` | "Why is this a threat?", "What makes this malicious?" | `get_current_state`, `get_risk_assessment` |
| `defensive_actions`| "What defensive actions should be taken?", "Countermeasures?" | `get_risk_assessment`, `get_mitre_mapping` |
| `prioritize` | "What should I prioritize?", "Analyst focus?" | `get_risk_assessment` |
| `investigate` | "What should the analyst investigate?", "Action steps?" | `get_attack_forecast`, `get_feature_importance`, `get_mitre_mapping`, `get_risk_assessment` |
| `evidence` | "What evidence supports this?", "Attribution proof?" | `get_feature_importance`, `get_attack_forecast` |
| `incident_summary` | "Summarize incident", "Executive summary" | `get_current_state`, `get_attack_forecast`, `get_risk_assessment` |
| `current_state` | "What is happening now?", "Current status" | `get_current_state` |
| `forecast` | "What will happen next?", "Future prediction" | `get_attack_forecast` |
| `transition` | "Is a transition predicted?", "Stage change?" | `get_transition_analysis` |
| `features` | "Why?", "What features changed?", "Key signals?" | `get_feature_importance` |
| `mitre` | "MITRE techniques?", "ATT&CK IDs?" | `get_mitre_mapping` |
| `confidence` | "How confident is the model?", "Uncertainty?" | `get_attack_forecast` |
| `risk` | "How severe is this?", "Risk score?" | `get_risk_assessment` |
| `rollout` | "Simulate forward", "K=4 steps?" | `get_rollout` |
| `metrics` | "Model accuracy?", "Phase 8C benchmark?" | `get_model_metrics` |

---

## 3. The 7 Recommended Quick Queries

The frontend should provide one-click suggestion buttons for these essential queries:
1. `What should the analyst investigate?`
2. `Why is this considered a threat?`
3. `What evidence supports this prediction?`
4. `What should I prioritize?`
5. `What MITRE techniques are relevant?`
6. `What defensive actions should be considered?`
7. `Summarize the incident.`

---

## 4. Request & Response Payload Contract

### Endpoint: `POST /api/v1/agent/query`

- **Request Payload**:
```json
{
  "query": "What evidence supports this prediction?",
  "session_id": "f8a29b1c",
  "current_forecast": {
    "current_stage": "RECONNAISSANCE",
    "predicted_next_stage": "CREDENTIAL_ACCESS",
    "confidence": 0.8845,
    "attack_probability": 0.9412,
    "transition_detected": true,
    "risk_level": "CRITICAL",
    "risk_score": 78.4,
    "primary_technique_id": "T1110",
    "primary_technique_name": "Brute Force",
    "top_features": [
      {
        "feature": "failed_flow_count",
        "current": 0.0,
        "predicted": 12.4,
        "rel_change_pct": 1240.0
      }
    ]
  }
}
```

- **Response Payload**:
```json
{
  "answer": "**Runtime Evidence Supporting Prediction** (RECONNAISSANCE -> CREDENTIAL_ACCESS):

- **failed_flow_count**: 0.000 -> 12.400 (+1240.0% shift)

- **Model Confidence**: 88.5% (calibrated with temperature T=1.5680)
- **Predicted Physical Trajectory**: |S_hat_{t+1} - S_t| state divergence.

_Evidence originates strictly from CyberWorldModelV2 physical state predictor._",
  "tool_calls": [
    "route_classifier:evidence",
    "get_feature_importance",
    "get_attack_forecast"
  ],
  "provenance": "CyberSentinel_defensive_agent",
  "llm_backend": "template_fallback",
  "grounded_in_model_output": true
}
```
