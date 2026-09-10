// Cleaned SimulatorView component – single definition without duplicates
import React, { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { startLiveIngestion } from '../../services/api';
import { SIMULATOR_PROFILES } from '../../constants/simulatorProfiles';
import { useAppStore } from '../../store/useAppStore';

export const SimulatorView: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState('recon');
  const [flowCount, setFlowCount] = useState(15);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const lastForecast = useAppStore((s) => s.lastForecast);
  const lastEvent = useAppStore((s) => s.lastEvent);

  const PROFILES = SIMULATOR_PROFILES;

  const handleTransmit = async () => {
    setIsTransmitting(true);
    try {
      useAppStore.getState().initWebSocket();
      const profile = SIMULATOR_PROFILES.find((p) => p.id === selectedProfile);
      if (!profile) {
        console.error('Selected profile not found');
        return;
      }
      const payload = {
        source_kind: 'replay',
        source_path: profile.csv,
        window_seconds: 10.0,
        k_steps: 4,
        realtime_factor: 0.0,
        session_id: `sim_${Date.now()}`,
        mode: 'LIVE',
      };
      await startLiveIngestion(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-purple-400 font-bold mb-1">
          OPERATIONAL TOOL // SYNTHETIC DEFENSIVE TELEMETRY GENERATOR
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
              Mobile & Network Traffic Simulator
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                PROVENANCE: GENERATED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Transmit controlled synthetic flow bursts to validate neural stage transition dynamics and MITRE mapping in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {PROFILES.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedProfile(p.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedProfile === p.id
                ? 'bg-purple-600/15 border-purple-500/60 shadow-md shadow-purple-500/10'
                : 'bg-[#0b101c] border-[#1a2333] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{p.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                {p.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Ingestion Controls */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Flow Burst Count:</span>
          <input
            type="range"
            min="5"
            max="50"
            value={flowCount}
            onChange={(e) => setFlowCount(Number(e.target.value))}
            className="w-32 sm:w-48 accent-purple-500"
            disabled // disabled because backend replay does not use this value
          />
          <span className="text-xs font-mono font-bold text-purple-400">{flowCount} flows</span>
        </div>
        <button
          onClick={handleTransmit}
          disabled={isTransmitting}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all min-h-[40px]"
        >
          <Send className="w-3.5 h-3.5" />
          {isTransmitting ? 'Transmitting to Neural Model...' : 'Transmit Telemetry Batch'}
        </button>
      </div>

      {/* KPI Feedback */}
      {(lastForecast || lastEvent) && (
        <div className="bg-[#0b101c] border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Live Inference Feedback Received from CyberWorldModelV2
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#0d1424] p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px]">Inferred Stage</span>
              <div className="text-slate-100 font-bold mt-1">{lastForecast?.current_stage || lastEvent?.current_stage || '?'}</div>
            </div>
            <div className="bg-[#0d1424] p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px]">Forecast Next</span>
              <div className="text-blue-400 font-bold mt-1">{lastForecast?.predicted_next_stage || lastEvent?.predicted_next_stage || '?'}</div>
            </div>
            <div className="bg-[#0d1424] p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px]">Risk Score</span>
              <div className="text-red-400 font-bold mt-1">{(lastForecast?.risk_score ?? lastEvent?.risk_score)?.toFixed(0) || '0'}/100</div>
            </div>
            <div className="bg-[#0d1424] p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px]">Inference Latency</span>
              <div className="text-emerald-400 font-bold mt-1">{(lastEvent?.inference_latency_ms ?? lastForecast?.inference_latency_ms)?.toFixed(1) || '?'} ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};