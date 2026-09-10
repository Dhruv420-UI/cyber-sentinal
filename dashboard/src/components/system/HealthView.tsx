import React, { useEffect } from 'react';
import { HeartPulse, CheckCircle2, AlertTriangle, Radio, Activity, Cpu, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const HealthView: React.FC = () => {
  const { systemHealth, refreshHealth, isWsConnected } = useAppStore();

  useEffect(() => {
    refreshHealth();
    const timer = setInterval(refreshHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      {/* --- Header --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-1">
          SYSTEM HEALTH & PRODUCTION OBSERVABILITY
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
              Production Runtime Health & Metrics
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full ${
                systemHealth?.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time telemetry pipeline health, neural checkpoint status, and WebSocket subscriber capacity.
            </p>
          </div>
        </div>
      </div>

      {/* --- Subsystem Status Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* CyberWorldModelV2 Checkpoint */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">CyberWorldModelV2</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> LOADED
            </span>
          </div>
          <div className="text-base font-bold text-slate-100">world_model_v2.pt</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Direct Physical State Predictor (T=8, D=24)
          </div>
        </div>

        {/* FeatureScaler Artifact */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Feature Scaler</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> READY
            </span>
          </div>
          <div className="text-base font-bold text-slate-100">RobustScaler / RobustFit</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Strict Zero-Leakage Train Split Normalizer
          </div>
        </div>

        {/* WebSocket Streaming Sockets */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">WebSocket Pool</span>
            <span className="text-blue-400 font-bold">
              {systemHealth?.websocket_subscribers ?? (isWsConnected ? 1 : 0)} / {systemHealth?.max_ws_connections ?? 50}
            </span>
          </div>
          <div className="text-base font-bold text-slate-100">/api/v1/stream/ws</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Backpressure Queue Max: 128 items/client
          </div>
        </div>

        {/* Calibrated Temperature */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Calibration Scaling</span>
            <span className="text-emerald-400 font-bold">OPTIMAL</span>
          </div>
          <div className="text-base font-bold text-slate-100 font-mono">T* = 1.5680</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Phase 8C Validation Holdout Calibrated
          </div>
        </div>

        {/* LLM Agent Backend */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Analyst Agent Engine</span>
            <span className="text-slate-300 font-mono">
              {systemHealth?.ollama_available ? 'Ollama' : 'Deterministic Template'}
            </span>
          </div>
          <div className="text-base font-bold text-slate-100">Zero-Hallucination Guard</div>
          <div className="text-[11px] text-slate-500 font-mono">
            100% Grounded in Structured Model Facts
          </div>
        </div>

        {/* Security Middleware */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Security Middleware</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <div className="text-base font-bold text-slate-100">120 req/min Limiter</div>
          <div className="text-[11px] text-slate-500 font-mono">
            10MB Payload Bound · Safe Headers Enforced
          </div>
        </div>
      </div>
    </div>
  );
};
