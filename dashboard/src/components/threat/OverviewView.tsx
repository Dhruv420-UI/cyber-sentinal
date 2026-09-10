import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const STAGES = [
  'BENIGN',
  'RECONNAISSANCE',
  'INITIAL_ACCESS',
  'EXECUTION',
  'CREDENTIAL_ACCESS',
  'DISCOVERY',
  'LATERAL_MOVEMENT',
  'COMMAND_AND_CONTROL',
  'EXFILTRATION'
];

export const OverviewView: React.FC = () => {
  const { lastForecast, lastEvent, isWsConnected } = useAppStore();

  const curStage = lastForecast?.current_stage || lastEvent?.current_stage || 'BENIGN';
  const nextStage = lastForecast?.predicted_next_stage || lastEvent?.predicted_next_stage || 'BENIGN';
  const atkProb = lastForecast?.attack_probability ?? lastEvent?.attack_probability ?? 0;
  const conf = lastForecast?.confidence ?? lastEvent?.confidence ?? 0.95;
  const riskScore = lastForecast?.risk_score ?? lastEvent?.risk_score ?? 0;
  const riskLevel = lastForecast?.risk_level ?? lastEvent?.risk_level ?? 'LOW';
  const primaryMitre = lastForecast?.primary_technique_id || lastEvent?.primary_technique_id || 'T1046';
  const mitreName = lastForecast?.primary_technique_name || lastEvent?.primary_technique_name || 'Network Service Discovery';

  const rollout = lastForecast?.rollout_steps || lastEvent?.rollout_steps || [];
  const topFeatures = lastForecast?.top_features || lastEvent?.top_features || [];
  const telem = lastForecast?.telemetry_features || lastEvent?.telemetry_features || {};

  return (
    <div className="space-y-5">
      {/* --- 1. Header & Active Threat Headline --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-[#0d1424] to-[#090e18] p-5 rounded-xl border border-[#1b2538] shadow-lg shadow-black/40">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            SOC COMMAND CENTER // REAL-TIME EVALUATION
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            {curStage === 'BENIGN' && atkProb < 0.3 ? (
              <span className="text-emerald-400">Baseline Network Activity Nominal</span>
            ) : (
              <span className="text-red-400 flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-red-500 animate-bounce" />
                Active Attack Progression Detected
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            CyberWorldModelV2 temporal forecast horizon: 30s Lead Time | Calibrated Temperature T*=1.5680
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-500">Inference Window</div>
            <div className="text-slate-200 font-bold">W-30s [AUTOREGRESSIVE]</div>
          </div>
        </div>
      </div>

      {/* --- 2. Top Metric Cards (Matches Screenshot 1) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Stage */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CURRENT OBSERVED STAGE</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              OBSERVED
            </span>
          </div>
          <div className="my-3">
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="truncate">{curStage}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Physical Window Telemetry Ingestion
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between font-mono">
            <span>Severity Weight</span>
            <span className="text-slate-200">{(curStage === 'BENIGN' ? 0.0 : 0.75).toFixed(2)}</span>
          </div>
        </div>

        {/* Next Predicted Stage */}
        <div className="bg-[#0b101c] border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between shadow-sm shadow-blue-500/5">
          <div className="flex items-center justify-between text-xs font-mono text-blue-400">
            <span>NEXT PREDICTED STAGE</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
              FORECAST (t+1)
            </span>
          </div>
          <div className="my-3">
            <div className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="truncate">{nextStage}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Confidence: {(conf * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between font-mono">
            <span>Transition Alert</span>
            <span className={curStage !== nextStage ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {curStage !== nextStage ? 'STAGE TRANSITION DETECTED' : 'STATE PERSISTENCE'}
            </span>
          </div>
        </div>

        {/* Attack Probability */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ATTACK PROBABILITY</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
              P(Attack)
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-3">
            <div className={`text-3xl font-extrabold font-mono ${atkProb > 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
              {(atkProb * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
              calibrated
            </div>
          </div>
          <div className="w-full bg-[#162032] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${atkProb > 0.4 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.max(5, atkProb * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>RISK ASSESSMENT</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
              riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
              'bg-emerald-500/10 text-emerald-400'
            }`}>
              {riskLevel}
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-3">
            <div className="text-3xl font-extrabold font-mono text-slate-100">
              {riskScore.toFixed(0)}
              <span className="text-sm font-normal text-slate-500">/100</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 truncate font-mono">
            {lastForecast?.recommended_priority || 'Routine Baseline Monitoring'}
          </div>
        </div>
      </div>

      {/* --- 3. Attack Trajectory (Matches Screenshot 1 & 2 Centerpiece) --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <span>Attack Trajectory & Autoregressive Sequence</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Three-Domain Paradigm: Observed Telemetry (Green) ? Forecast t+1 (Blue) ? Autoregressive Simulation t+2..4 (Purple)
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-1 rounded bg-purple-600/15 border border-purple-500/30 text-purple-300">
              MODEL SIMULATION (K=4) · NO FUTURE TELEMETRY
            </span>
          </div>
        </div>

        {/* Stepper Visualization */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 px-1">
          {/* Observed Node */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-lg p-3 min-w-36 text-center shadow-md shadow-emerald-500/10">
              <div className="text-[9px] font-mono uppercase font-bold text-emerald-400">? OBSERVED (t)</div>
              <div className="text-xs font-bold text-slate-100 mt-1 truncate">{curStage}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Physical Stream</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          {/* Forecast Node (t+1) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-500/10 border-2 border-blue-500 rounded-lg p-3 min-w-36 text-center shadow-md shadow-blue-500/15">
              <div className="text-[9px] font-mono uppercase font-bold text-blue-400">? FORECAST (t+1)</div>
              <div className="text-xs font-bold text-blue-300 mt-1 truncate">{nextStage}</div>
              <div className="text-[10px] text-blue-400 font-mono mt-0.5">{(conf * 100).toFixed(0)}% Confidence</div>
            </div>
            {rollout.length > 0 && <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />}
          </div>

          {/* Simulated Nodes (t+2 ... t+K) */}
          {rollout.slice(1).map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-3 min-w-36 text-center">
                <div className="text-[9px] font-mono uppercase font-bold text-purple-400">?? SIMULATION (t+{step.step})</div>
                <div className="text-xs font-bold text-purple-200 mt-1 truncate">{step.predicted_stage}</div>
                <div className="text-[10px] text-purple-400/80 font-mono mt-0.5">{(step.confidence * 100).toFixed(0)}% Prob</div>
              </div>
              {idx < rollout.slice(1).length - 1 && <ArrowRight className="w-4 h-4 text-purple-500/40 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* --- 4. Secondary Row: Telemetry Overview & Feature Attribution & MITRE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Telemetry Overview (Matches Screenshot 1) */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-200">Current 30s Window Telemetry</span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Flow Count</span>
              <span className="text-slate-100 font-bold">{telem.flow_count ?? '?'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Packets / sec</span>
              <span className="text-slate-100 font-bold">{telem.pkt_rate ? telem.pkt_rate.toFixed(1) : '?'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Bytes / sec</span>
              <span className="text-slate-100 font-bold">{telem.byte_rate ? `${telem.byte_rate.toFixed(0)} B/s` : '?'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Unique Src / Dst IPs</span>
              <span className="text-slate-100 font-bold">{telem.unique_src_ips ?? '?'} / {telem.unique_dst_ips ?? '?'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">TCP SYN / RST Ratio</span>
              <span className="text-slate-100 font-bold">
                {telem.syn_ratio ? `${(telem.syn_ratio * 100).toFixed(0)}%` : '?'} / {telem.rst_ratio ? `${(telem.rst_ratio * 100).toFixed(0)}%` : '?'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Dst Port Entropy</span>
              <span className="text-slate-100 font-bold">{telem.dst_port_entropy ? telem.dst_port_entropy.toFixed(2) : '?'}</span>
            </div>
          </div>
        </div>

        {/* Feature Deltas (Matches Screenshot 1 & 2) */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-200">Physical Feature Attribution</span>
            <span className="text-[10px] font-mono text-slate-500">|S_hat - S_t|</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56">
            {topFeatures.length > 0 ? (
              topFeatures.slice(0, 5).map((f, i) => (
                <div key={i} className="bg-[#0e1526] border border-[#1a2538] rounded-lg p-2 text-xs font-mono flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-semibold">{f.feature}</div>
                    <div className="text-[10px] text-slate-500">
                      {f.current.toFixed(2)} ? {f.predicted.toFixed(2)}
                    </div>
                  </div>
                  <div className={`font-bold ${f.direction === 'increase' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {f.direction === 'increase' ? '+' : ''}{f.rel_change_pct.toFixed(0)}%
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-xs font-mono">
                No active feature attribution deltas
              </div>
            )}
          </div>
        </div>

        {/* MITRE ATT&CK Mapping (Matches Screenshot 1) */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-200">MITRE ATT&CK Mapping</span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Enterprise v14
            </span>
          </div>

          <div className="bg-[#0e1526] border border-[#1e2a42] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/40">
                {primaryMitre}
              </span>
              <span className="text-xs font-bold text-slate-200 truncate">{mitreName}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {lastForecast?.mitre_techniques?.[0]?.rationale || 'Technique deterministically associated with predicted stage progression.'}
            </div>
            <div className="pt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800 flex justify-between">
              <span>Mapping Provenance</span>
              <span>MITRE ATT&CK v14 Static</span>
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[11px] text-slate-300 font-sans flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-400">Analyst Directive:</span> {lastForecast?.recommended_priority || 'Monitor endpoint telemetry for abnormal connection patterns.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
