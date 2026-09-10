import type { CyberSentinelForecast, SystemHealth, ReplayStatus } from '../types';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

export function getWsStreamUrl(): string {
  const envWs = import.meta.env.VITE_WS_STREAM_URL;
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return envWs.trim().replace(/\/+$/, '');
  }
  const apiBase = getApiBaseUrl();
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const wsBase = apiBase.replace(/^http/, 'ws');
    return `${wsBase}/stream/ws`;
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsHost = host.includes(':5173') ? 'localhost:8000' : host;
    return `${proto}//${wsHost}/api/v1/stream/ws`;
  }
  return 'ws://localhost:8000/api/v1/stream/ws';
}

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${getApiBaseUrl()}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchStreamHealth(): Promise<SystemHealth> {
  const res = await fetch(`${getApiBaseUrl()}/stream/health`);
  if (!res.ok) throw new Error(`Stream health failed: ${res.status}`);
  return res.json();
}

export async function fetchModelInfo(): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/model/info`);
  if (!res.ok) throw new Error(`Model info failed: ${res.status}`);
  return res.json();
}

export async function fetchReplayScenarios(): Promise<{ scenarios: string[] }> {
  const res = await fetch(`${getApiBaseUrl()}/replay/scenarios`);
  if (!res.ok) throw new Error(`Replay scenarios failed: ${res.status}`);
  return res.json();
}

export async function startReplaySession(scenario_id: string, k_steps: number = 4): Promise<{ session_id: string; total_windows: number }> {
  const res = await fetch(`${getApiBaseUrl()}/replay/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id, k_steps })
  });
  if (!res.ok) throw new Error(`Start replay failed: ${res.status}`);
  return res.json();
}

export async function stepReplaySession(sessionId: string): Promise<{ session_id: string; window_index: number; is_complete: boolean; forecast?: CyberSentinelForecast }> {
  const res = await fetch(`${getApiBaseUrl()}/replay/step?session_id=${encodeURIComponent(sessionId)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Step replay failed: ${res.status}`);
  return res.json();
}

export async function queryAgent(query: string, currentForecast?: CyberSentinelForecast | null, sessionId?: string): Promise<{
  answer: string;
  tool_calls: string[];
  provenance: string;
  llm_backend: string;
  grounded_in_model_output: boolean;
}> {
  const res = await fetch(`${getApiBaseUrl()}/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      current_forecast: currentForecast || undefined,
      session_id: sessionId || undefined
    })
  });
  if (!res.ok) throw new Error(`Agent query failed: ${res.status}`);
  return res.json();
}

// Retained legacy function (not used by Simulator) for potential other callers
export async function ingestFlows(flows: any[], sessionId: string = 'sim_session', sourceId: string = 'WebSimulator'): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/stream/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flows,
      session_id: sessionId,
      source_id: sourceId,
      k_steps: 4,
      window_seconds: 10.0
    })
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`);
  return res.json();
}

// NEW: start a live ingestion session using a replay CSV file (backend simulator)
export async function startLiveIngestion(payload: {
  source_kind: string;
  source_path: string;
  window_seconds?: number;
  k_steps?: number;
  realtime_factor?: number;
  session_id?: string;
  mode?: string;
}): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/stream/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Start session failed: ${res.status}`);
  return res.json();
}
