import React, { useState, useEffect } from 'react';
import { Play, SkipForward, Pause, RefreshCw, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { fetchReplayScenarios, startReplaySession, stepReplaySession } from '../../services/api';
import type { CyberSentinelForecast } from '../../types';

export const ReplayView: React.FC = () => {
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentWindow, setCurrentWindow] = useState(0);
  const [totalWindows, setTotalWindows] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [forecast, setForecast] = useState<CyberSentinelForecast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchReplayScenarios().then((res) => {
      setScenarios(res.scenarios || []);
      if (res.scenarios && res.scenarios.length > 0) {
        setSelectedScenario(res.scenarios[0]);
      }
    }).catch(console.error);
  }, []);

  const handleStart = async () => {
    if (!selectedScenario) return;
    try {
      setIsPlaying(false);
      setHistory([]);
      const res = await startReplaySession(selectedScenario, 4);
      setSessionId(res.session_id);
      setTotalWindows(res.total_windows);
      setCurrentWindow(0);
      setIsComplete(false);
      // Auto-step first window
      const stepRes = await stepReplaySession(res.session_id);
      if (stepRes.forecast) {
        setForecast(stepRes.forecast);
        setCurrentWindow(1);
        setHistory([stepRes.forecast]);
      }
    } catch (e) {
      console.error('Error starting replay:', e);
    }
  };

  const handleStep = async () => {
    if (!sessionId || isComplete) return;
    try {
      const res = await stepReplaySession(sessionId);
      setCurrentWindow(res.window_index + 1);
      setIsComplete(res.is_complete);
      if (res.forecast) {
        setForecast(res.forecast);
        setHistory((prev) => [res.forecast!, ...prev]);
      }
      if (res.is_complete) {
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('Error stepping replay:', e);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying && sessionId && !isComplete) {
      timer = setInterval(() => {
        handleStep();
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, sessionId, isComplete, currentWindow]);

  const groundTruthMatch = forecast?.predicted_next_stage === forecast?.ground_truth_next_stage;

  return (
    <div className="space-y-5">
      {/* --- Header & Controls (Screenshot 4 Reference) --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1">
          FORENSIC ENGINE // TEMPORAL REPLAY & VALIDATION
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Threat Replay & Ground-Truth Validation
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                LIVE NEURAL INFERENCE
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Step chronologically through recorded multi-stage attack scenarios to evaluate forecast accuracy vs. physical reality.
            </p>
          </div>

          {/* Session Controller */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="bg-[#0d1424] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-blue-500"
            >
              {scenarios.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={handleStart}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Initialize
            </button>

            <button
              onClick={handleStep}
              disabled={!sessionId || isComplete}
              className="px-3 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1f2e48] disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5 text-blue-400" /> Step Window
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!sessionId || isComplete}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-40 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Auto Play'}
            </button>
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        {sessionId && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Timeline Progress: Window W{currentWindow} / W{totalWindows}</span>
              <span>{isComplete ? 'REPLAY COMPLETED ?' : `${Math.round((currentWindow / (totalWindows || 1)) * 100)}%`}</span>
            </div>
            <div className="w-full bg-[#121927] rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                style={{ width: `${(currentWindow / (totalWindows || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* --- Forecast vs. Ground Truth Reality (Matches Screenshot 4) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Observed Telemetry Reality */}
        <div className="bg-[#0b101c] border border-emerald-500/30 rounded-xl p-4 shadow-sm shadow-emerald-500/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex justify-between">
            <span>OBSERVED TELEMETRY</span>
            <span>State @ W{currentWindow}</span>
          </div>
          <div className="my-3">
            <div className="text-xl font-bold text-slate-100">{forecast?.current_stage || '?'}</div>
            <div className="text-xs text-slate-400 font-mono mt-1">Ground Truth Observed Flow State</div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Packet Rate:</span>
              <span className="text-slate-200">{forecast?.telemetry_features?.pkt_rate?.toFixed(1) || '?'} pps</span>
            </div>
            <div className="flex justify-between">
              <span>SYN Ratio:</span>
              <span className="text-slate-200">{forecast?.telemetry_features?.syn_ratio ? `${(forecast.telemetry_features.syn_ratio * 100).toFixed(0)}%` : '?'}</span>
            </div>
          </div>
        </div>

        {/* Model Forecast */}
        <div className="bg-[#0b101c] border border-blue-500/40 rounded-xl p-4 shadow-sm shadow-blue-500/10 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-blue-400 font-bold flex justify-between">
            <span>MODEL FORECAST</span>
            <span>Predicted t+1</span>
          </div>
          <div className="my-3">
            <div className="text-xl font-bold text-blue-300">{forecast?.predicted_next_stage || '?'}</div>
            <div className="text-xs text-blue-400 font-mono mt-1">
              Confidence: {forecast?.confidence ? `${(forecast.confidence * 100).toFixed(1)}%` : '?'}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Attack Prob:</span>
              <span className="text-slate-200">{forecast?.attack_probability ? `${(forecast.attack_probability * 100).toFixed(1)}%` : '?'}</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Score:</span>
              <span className="text-red-400 font-bold">{forecast?.risk_score?.toFixed(0) || '?'}/100</span>
            </div>
          </div>
        </div>

        {/* Actual Ground Truth Verification */}
        <div className="bg-[#0b101c] border border-purple-500/30 rounded-xl p-4 shadow-sm shadow-purple-500/5 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase text-purple-400 font-bold flex justify-between">
            <span>ACTUAL GROUND TRUTH</span>
            <span>Post-Incident Verified</span>
          </div>
          <div className="my-3">
            <div className="text-xl font-bold text-purple-200">{forecast?.ground_truth_next_stage || '?'}</div>
            <div className="text-xs text-purple-400 font-mono mt-1">
              Recorded Next Window Reality
            </div>
          </div>
          <div className="text-[11px] font-mono border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Validation Result:</span>
            {forecast ? (
              groundTruthMatch ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> EXACT MATCH
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> DEVIATION
                </span>
              )
            ) : (
              <span className="text-slate-500">?</span>
            )}
          </div>
        </div>
      </div>

      {/* --- Chronological Step History Table --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-5">
        <div className="text-xs font-bold text-slate-200 mb-3 font-mono">Replay Chronological Step Log</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Observed (t)</th>
                <th className="pb-2">Predicted Next (t+1)</th>
                <th className="pb-2">Confidence</th>
                <th className="pb-2">Actual Next</th>
                <th className="pb-2">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {history.map((h, idx) => (
                <tr key={idx} className="hover:bg-[#111928]">
                  <td className="py-2 text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</td>
                  <td className="text-emerald-400 font-semibold">{h.current_stage}</td>
                  <td className="text-blue-400 font-semibold">{h.predicted_next_stage}</td>
                  <td className="text-slate-300">{(h.confidence * 100).toFixed(1)}%</td>
                  <td className="text-purple-300 font-semibold">{h.ground_truth_next_stage || '?'}</td>
                  <td>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 font-bold">
                      {h.risk_score?.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
