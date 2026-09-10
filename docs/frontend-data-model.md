# CyberSentinel AI ? Frontend Data Model & TypeScript Definitions

> **Target Version**: Backend v2.0 (FastAPI + Pydantic v2)  
> **Source Files Inspected**:  
> - `backend/schemas/forecast.py`  
> - `backend/schemas/stream.py`  
> - `ml/state/state_builder.py`  
> - `ml/defense/risk_engine.py`  
> - `mitre/mappings/mitre_mapper.py`  

---

## 1. Core Enumerations & Constants

### 1.1 Attack Stage Taxonomy (10 Canonical Stages)
From `ml/defense/risk_engine.py`:
```typescript
export const ATTACK_STAGES = [
  'BENIGN',
  'RECONNAISSANCE',
  'INITIAL_ACCESS',
  'EXECUTION',
  'CREDENTIAL_ACCESS',
  'DISCOVERY',
  'LATERAL_MOVEMENT',
  'COMMAND_AND_CONTROL',
  'EXFILTRATION',
  'UNKNOWN'
] as const;

export type AttackStage = typeof ATTACK_STAGES[number];
```

### 1.2 Severity Scores & Stage Ordering
```typescript
export const STAGE_SEVERITY_MAP: Record<AttackStage, number> = {
  BENIGN: 0.0,
  RECONNAISSANCE: 0.25,
  DISCOVERY: 0.35,
  INITIAL_ACCESS: 0.50,
  EXECUTION: 0.65,
  CREDENTIAL_ACCESS: 0.75,
  LATERAL_MOVEMENT: 0.85,
  COMMAND_AND_CONTROL: 0.90,
  EXFILTRATION: 1.00,
  UNKNOWN: 0.20
};
```

### 1.3 Risk Levels
```typescript
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
```

### 1.4 The 24-D Curated Physical Feature Vector
From `ml/state/state_builder.py`:
```typescript
export const FEATURE_NAMES_24 = [
  'flow_count',          // Total flow records in 30s window
  'total_packets',       // Sum of all packet counts
  'total_bytes',         // Sum of all byte volumes
  'pkt_rate',            // total_packets / 30.0 (packets/sec)
  'byte_rate',           // total_bytes / 30.0 (bytes/sec)
  'unique_src_ips',      // Cardinality of distinct source IP addresses
  'unique_dst_ips',      // Cardinality of distinct destination IP addresses
  'unique_dst_ports',    // Cardinality of distinct destination ports
  'syn_count',           // Count of flows with TCP SYN flag set
  'rst_count',           // Count of flows with TCP RST flag set
  'fin_count',           // Count of flows with TCP FIN flag set
  'syn_ratio',           // syn_count / flow_count
  'rst_ratio',           // rst_count / flow_count
  'dst_ip_entropy',      // Shannon entropy of destination IP distribution
  'dst_port_entropy',    // Shannon entropy of destination port distribution
  'failed_flow_count',   // Flows flagged as failed/rejected
  'failed_flow_ratio',   // failed_flow_count / flow_count
  'tcp_flag_diversity',  // Shannon entropy across 6-tuple TCP flag patterns
  'port_445_share',      // Ratio of flows targeting port 445 (SMB)
  'port_3389_share',     // Ratio of flows targeting port 3389 (RDP)
  'port_22_share',       // Ratio of flows targeting port 22 (SSH)
  'port_80_443_share',   // Ratio of flows targeting HTTP/HTTPS
  'mean_flow_duration',  // Average duration of flows in seconds
  'bytes_per_packet'     // total_bytes / total_packets
] as const;

export type FeatureName24 = typeof FEATURE_NAMES_24[number];
```

---

## 2. Comprehensive TypeScript Type Definitions

```typescript
/** Provenance metadata tracking origins of intelligence claims */
export interface Provenance {
  prediction: string;  // e.g. "CyberWorldModelV2"
  explanation: string; // e.g. "physical_state_delta"
  mitre: string;       // e.g. "MITRE_ATT&CK_v14_static_mapping"
  risk: string;        // e.g. "RiskEngine_deterministic"
  narrative: string;   // e.g. "CyberSentinel_defensive_agent"
}

/** Individual feature attribution shift between S_t and predicted S_{t+1} */
export interface FeatureDelta {
  feature: string;
  current: number;
  predicted: number;
  abs_change: number;
  rel_change_pct: number;
  direction: 'increase' | 'decrease';
}

/** MITRE ATT&CK technique description */
export interface MitreTechnique {
  technique_id: string;        // e.g. "T1110"
  name: string;                // e.g. "Brute Force"
  tactic: string;              // e.g. "Credential Access"
  rationale: string;           // Physical justification
  sub_techniques?: string[];   // e.g. ["T1110.001"]
  mapping_provenance: string;  // "MITRE ATT&CK Enterprise v14 static mapping"
}

/** Defensive model simulation step in K-step rollout */
export interface RolloutStep {
  step: number;                          // Step index 1..K (each step = +30s)
  predicted_stage: AttackStage;         // Forecasted stage
  confidence: number;                   // Calibrated probability [0, 1]
  uncertainty: number;                  // Normalized entropy
  attack_probability: number;           // Binary threat probability
}

/** Safety monitoring flags emitted during forward rollout */
export interface SafetyFlags {
  nan_detected: boolean;
  collapse_detected: boolean;
  feature_dim_valid: boolean;
}

/** Canonical unified forecast payload emitted by backend */
export interface CyberSentinelForecast {
  timestamp: string;                                // ISO 8601 string
  model_version: string;                            // "CyberWorldModelV2"
  forecast_horizon: number;                         // 30 seconds
  current_stage: AttackStage;                       // Classified stage at time t
  attack_probability: number;                       // Probability [0, 1]
  predicted_next_stage: AttackStage;                // Forecasted stage at t+1
  next_stage_probability: number;                   // Calibrated prob [0, 1]
  confidence: number;                               // max probability
  transition_detected: boolean;                     // true if next != current
  transition_confidence: number;                    // confidence of transition
  uncertainty_entropy: number;                      // normalized Shannon entropy
  calibrated_temperature: number;                   // T* scaling factor (1.568)
  stage_probabilities: Record<string, number>;      // Probability distribution
  rollout_steps: RolloutStep[];                     // K-step forward simulation
  top_features: FeatureDelta[];                     // Top changed features
  stage_relevant_features?: FeatureDelta[];         // Features specific to target stage
  explanation_narrative?: string;                   // Evidence summary text
  mitre_techniques: MitreTechnique[];               // Mapped ATT&CK techniques
  primary_technique_id?: string | null;             // Highest priority technique
  primary_technique_name?: string | null;
  risk_score: number;                               // Deterministic score 0..100
  risk_level: RiskLevel;                            // LOW | MEDIUM | HIGH | CRITICAL
  recommended_priority: string;                     // Operational directive
  time_to_transition_hint: string;                  // Timing advisory
  safety_flags: SafetyFlags;                        // Guard verification flags
  provenance: Provenance;                           // Traceability metadata
  // Replay specific optional fields:
  ground_truth_stage?: AttackStage;
  ground_truth_next_stage?: AttackStage;
  telemetry_features?: Record<FeatureName24, number>;
}

/** Real-time Streaming Event (WebSocket & SSE) */
export interface StreamEvent {
  event_id: string;
  session_id: string;
  timestamp: string;
  window_id: string;
  window_index: number;
  status: 'FORECAST' | 'MODEL_UNAVAILABLE' | 'INVALID_TELEMETRY' | 'SCALER_UNAVAILABLE' | 'BUFFERING';
  source_id?: string;
  flow_count: number;
  flows_per_second: number;
  inference_latency_ms: number;
  current_stage: AttackStage;
  predicted_next_stage: AttackStage;
  attack_probability: number;
  confidence: number;
  risk_score: number;
  risk_level: RiskLevel;
  transition_detected: boolean;
  transition_probability: number;
  recommended_priority: string;
  primary_technique_id?: string | null;
  primary_technique_name?: string | null;
  mitre_techniques: MitreTechnique[];
  top_features: FeatureDelta[];
  rollout_steps: RolloutStep[];
  telemetry_features?: Record<string, number>;
}

/** Telemetry Flow Input for Simulator Ingestion */
export interface TelemetryFlowInput {
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol?: number;
  packets?: number;
  bytes?: number;
  duration?: number;
  syn_flag?: number;
  ack_flag?: number;
  rst_flag?: number;
  fin_flag?: number;
  psh_flag?: number;
  urg_flag?: number;
  failed?: boolean;
  timestamp?: number;
  label?: string; // Must be "UNKNOWN" in live generator
}

/** Replay Session State */
export interface ReplaySession {
  session_id: string;
  scenario_id: string;
  total_windows: number;
  current_window: number;
  window_size_seconds: number;
  k_steps: number;
  is_complete: boolean;
  elapsed_seconds: number;
}
```
