import React from 'react';
import { Cpu, ArrowDown, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

export const WorldModelView: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* --- Header --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1">
          NEURAL ARCHITECTURE // CYBERWORLDMODELV2
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
            Temporal Cyber World Model Architecture
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              PHYSICAL STATE DYNAMICS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Learning network state dynamics S_t ? P(S_t+1 | S_t) with closed-loop autoregressive forward simulation.
          </p>
        </div>
      </div>

      {/* --- Neural Pipeline Flow --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="text-xs font-bold text-slate-200 font-mono">End-to-End Deep Learning Pipeline</div>
        <div className="flex flex-col items-center gap-2 text-xs font-mono max-w-xl mx-auto">
          <div className="w-full bg-[#0d1424] border border-[#1e2a42] p-3 rounded-lg text-center font-bold text-slate-200">
            Raw Network Flow Records (Packets, Bytes, Flags, IPs, Ports)
          </div>
          <ArrowDown className="w-4 h-4 text-blue-400" />
          <div className="w-full bg-[#0d1424] border border-[#1e2a42] p-3 rounded-lg text-center font-bold text-emerald-400">
            30-Second Window Aggregation ? 24-D State Vector S_t (Zero Lookahead)
          </div>
          <ArrowDown className="w-4 h-4 text-blue-400" />
          <div className="w-full bg-[#0d1424] border border-[#1e2a42] p-3 rounded-lg text-center font-bold text-slate-200">
            Historical Sequence Construction (T=8 Windows, 4 Minutes Context)
          </div>
          <ArrowDown className="w-4 h-4 text-blue-400" />
          <div className="w-full bg-[#0d1424] border border-blue-500/40 p-3 rounded-lg text-center font-bold text-blue-300">
            Temporal Transformer Encoder (c_t Context Embedding)
          </div>
          <ArrowDown className="w-4 h-4 text-blue-400" />
          <div className="w-full bg-[#0d1424] border border-blue-500/40 p-3 rounded-lg text-center font-bold text-blue-300">
            Direct Physical State Predictor Head: S_hat_(t+1) = MLP(c_t)
          </div>
          <ArrowDown className="w-4 h-4 text-purple-400" />
          <div className="w-full bg-[#0d1424] border border-purple-500/40 p-3 rounded-lg text-center font-bold text-purple-300">
            Autoregressive K-Step Forward Rollout: S_t ? S_t+1 ? ... ? S_t+K
          </div>
          <ArrowDown className="w-4 h-4 text-purple-400" />
          <div className="w-full bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-purple-500/50 p-3 rounded-lg text-center font-bold text-slate-100">
            Next Stage Forecast + Multi-Factor Risk Score + MITRE Mapping
          </div>
        </div>
      </div>

      {/* --- Empirical Benchmark Comparison Table --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200 font-mono">
            Empirical Benchmark Validation (Hard Multi-Stage Holdout N=44)
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Phase 8C Immutable Artifact
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                <th className="pb-2">Model Architecture</th>
                <th className="pb-2">Top-1 Accuracy</th>
                <th className="pb-2">Top-3 Accuracy</th>
                <th className="pb-2">Transition Accuracy</th>
                <th className="pb-2">Calibrated Brier</th>
                <th className="pb-2">Attack FPR</th>
                <th className="pb-2">Autoregressive Rollout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              <tr className="text-emerald-400 font-bold bg-emerald-500/5">
                <td className="py-2.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> CyberWorldModelV2
                </td>
                <td>97.73%</td>
                <td>100.00%</td>
                <td>83.33% (5/6)</td>
                <td>0.0452</td>
                <td>0.00%</td>
                <td>? K=4 Support</td>
              </tr>
              <tr className="text-slate-400">
                <td className="py-2.5">Temporal GRU</td>
                <td>81.82%</td>
                <td>97.73%</td>
                <td>66.67% (4/6)</td>
                <td>0.2913</td>
                <td>53.33%</td>
                <td>?</td>
              </tr>
              <tr className="text-slate-500">
                <td className="py-2.5">Logistic Regression Baseline</td>
                <td>50.00%</td>
                <td>72.73%</td>
                <td>0.00% (0/6)</td>
                <td>0.7206</td>
                <td>0.00%</td>
                <td>?</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
