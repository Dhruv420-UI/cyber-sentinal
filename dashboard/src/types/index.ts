export type AttackStage =
  | 'BENIGN'
  | 'RECONNAISSANCE'
  | 'INITIAL_ACCESS'
  | 'EXECUTION'
  | 'CREDENTIAL_ACCESS'
  | 'DISCOVERY'
  | 'LATERAL_MOVEMENT'
  | 'COMMAND_AND_CONTROL'
  | 'EXFILTRATION'
  | 'UNKNOWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MitreTechnique {
  technique_id: string;
  name: string;
  tactic: string;
  rationale: string;
  sub_techniques?: string[];
  mapping_provenance: string;
}

export interface FeatureDelta {
  feature: string;
  current: number;
  predicted: number;
  abs_change: number;
  rel_change_pct: number;
  direction: 'increase' | 'decrease';
}

export interface RolloutStep {
  step: number;
  predicted_stage: AttackStage;
  confidence: number;
  uncertainty?: number;
  attack_probability: number;
}

export interface CyberSentinelForecast {
  timestamp: string;
  model_version: string;
  forecast_horizon: number;
  current_stage: AttackStage;
  attack_probability: number;
  predicted_next_stage: AttackStage;
  next_stage_probability: number;
  confidence: number;
  transition_detected: boolean;
  transition_confidence: number;
  uncertainty_entropy: number;
  calibrated_temperature: number;
  stage_probabilities: Record<string, number>;
  rollout_steps: RolloutStep[];
  top_features: FeatureDelta[];
  stage_relevant_features?: FeatureDelta[];
  explanation_narrative?: string;
  mitre_techniques: MitreTechnique[];
  primary_technique_id?: string | null;
  primary_technique_name?: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  recommended_priority: string;
  time_to_transition_hint: string;
  safety_flags?: {
    nan_detected: boolean;
    collapse_detected: boolean;
    feature_dim_valid: boolean;
  };
  provenance?: {
    prediction: string;
    explanation: string;
    mitre: string;
    risk: string;
    narrative: string;
  };
  ground_truth_stage?: AttackStage;
  ground_truth_next_stage?: AttackStage;
  telemetry_features?: Record<string, number>;
  inference_latency_ms?: number;
}

export interface StreamEvent {
  event_id: string;
  session_id: string;
  timestamp: string;
  window_id?: string;
  window_index?: number;
  status: 'FORECAST' | 'MODEL_UNAVAILABLE' | 'INVALID_TELEMETRY' | 'SCALER_UNAVAILABLE' | 'BUFFERING';
  source_id?: string;
  flow_count?: number;
  flows_per_second?: number;
  inference_latency_ms?: number;
  current_stage?: AttackStage;
  predicted_next_stage?: AttackStage;
  attack_probability?: number;
  confidence?: number;
  risk_score?: number;
  risk_level?: RiskLevel;
  transition_detected?: boolean;
  transition_probability?: number;
  recommended_priority?: string;
  primary_technique_id?: string | null;
  primary_technique_name?: string | null;
  mitre_techniques?: MitreTechnique[];
  top_features?: FeatureDelta[];
  rollout_steps?: RolloutStep[];
  telemetry_features?: Record<string, number>;
  sequence_accumulated?: number;
  sequence_required?: number;
  detail?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unavailable' | 'connecting';
  active_session?: boolean;
  model_ready?: boolean;
  scaler_ready?: boolean;
  websocket_subscribers?: number;
  max_ws_connections?: number;
  inference_latency_ms?: number;
  flows_per_second?: number;
  queue_backpressure_status?: string;
  model_loaded?: boolean;
  calibration_loaded?: boolean;
  dataset_available?: boolean;
  ollama_available?: boolean;
}

export interface ReplayStatus {
  session_id: string;
  scenario_id: string;
  current_window: number;
  total_windows: number;
  is_complete: boolean;
  elapsed_seconds: number;
}
