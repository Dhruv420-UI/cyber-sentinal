import React, { useState } from 'react';
import { Activity, ShieldAlert, ChevronRight, Filter, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const IncidentsView: React.FC = () => {
  const { incidents, setActiveNav } = useAppStore();
  const [selectedIncident, setSelectedIncident] = useState<string | null>(incidents[0]?.id || null);

  const activeInc = incidents.find(i => i.id === selectedIncident) || incidents[0];

  return (
    <div className="space-y-5">
      {/* --- Header --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-red-400 font-bold mb-1">
          INTELLIGENCE / INCIDENTS TRIAGE
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
              Detected Incident Queue
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                {incidents.length} Active Events
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous detections flagged when attack probability exceeds threshold or stage transitions occur.
            </p>
          </div>
        </div>
      </div>

      {/* --- Incident Triage & Investigation Layout (Screenshot 3 Reference) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Incident List (Left Column) */}
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Incident Queue</span>
            <Filter className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {incidents.length > 0 ? (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    (selectedIncident === inc.id || (!selectedIncident && inc === incidents[0]))
                      ? 'bg-blue-600/15 border-blue-500/50 shadow-sm shadow-blue-500/10'
                      : 'bg-[#0e1424] border-[#1a2438] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-slate-200">{inc.id}</span>
                    <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{inc.stage} ? {inc.nextStage}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {inc.riskLevel}
                    </span>
                    <span className="text-slate-400">
                      Conf: {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-12 text-xs font-mono">
                No active threat incidents detected.
              </div>
            )}
          </div>
        </div>

        {/* Selected Incident Detail (Right 2 Columns - Screenshot 3) */}
        <div className="lg:col-span-2 bg-[#0b101c] border border-[#1a2333] rounded-xl p-5 space-y-5">
          {activeInc ? (
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div>
                  <div className="text-[10px] font-mono text-slate-500">INCIDENT DETAILS // {activeInc.id}</div>
                  <h2 className="text-lg font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                    {activeInc.stage} Suspicious Campaign Progression
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Detected: {new Date(activeInc.timestamp).toLocaleString()} | Source: Live Telemetry Stream
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                    {activeInc.riskLevel} RISK ({activeInc.riskScore.toFixed(0)}/100)
                  </span>
                </div>
              </div>

              {/* Transition & Reasoning Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0e1424] border border-[#1a2438] rounded-lg p-3 text-xs font-mono">
                  <div className="text-slate-400 text-[10px]">CURRENT STAGE</div>
                  <div className="text-base font-bold text-slate-100 mt-1">{activeInc.stage}</div>
                </div>
                <div className="bg-[#0e1424] border border-blue-500/30 rounded-lg p-3 text-xs font-mono">
                  <div className="text-blue-400 text-[10px]">PREDICTED NEXT STAGE</div>
                  <div className="text-base font-bold text-blue-300 mt-1">{activeInc.nextStage}</div>
                </div>
                <div className="bg-[#0e1424] border border-[#1a2438] rounded-lg p-3 text-xs font-mono">
                  <div className="text-slate-400 text-[10px]">FORECAST CONFIDENCE</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">{(activeInc.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Narrative & Guidance */}
              <div className="bg-[#0e1526] border border-[#1e2a42] rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-slate-200">Incident Narrative & Attribution</div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {activeInc.description}
                </p>
                {activeInc.primaryTechnique && (
                  <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-slate-500 font-bold">Associated MITRE Technique:</span>
                    <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {activeInc.primaryTechnique}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => setActiveNav('forecast')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[38px]"
                >
                  View Full Forecast & Trajectory <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveNav('analyst')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#141b2c] hover:bg-[#1a243c] text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center justify-center min-h-[38px]"
                >
                  Ask Analyst About This Incident
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-24 text-xs font-mono">
              Select an incident from the queue to inspect detailed evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
