import React from 'react';
import { Radio, Database, Filter, ArrowUpRight, Cpu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const TelemetryView: React.FC = () => {
  const { lastForecast, lastEvent, historyEvents, isWsConnected } = useAppStore();

  const telem = lastForecast?.telemetry_features || lastEvent?.telemetry_features || {};

  return (
    <div className="space-y-5">
      {/* --- Header (Screenshot 5 Reference) --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold mb-1">
          PHYSICAL SENSOR LAYER // NETWORK STATE BUILDER
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
              Live Network Flow Telemetry (30s Windows)
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                isWsConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {isWsConnected ? 'STREAMING' : 'IDLE'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Aggregating raw network flows into 24-dimensional normalized physical state vectors S_t.
            </p>
          </div>
          <div className="text-left md:text-right text-xs font-mono text-slate-400">
            <div>Window Duration: <span className="text-slate-200 font-bold">30.0s</span></div>
            <div>Dimension: <span className="text-blue-400 font-bold">24 Curated Features</span></div>
          </div>
        </div>
      </div>

      {/* --- Telemetry Statistics Grid (Screenshot 5 Reference) --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Flow Count</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-1">{telem.flow_count ?? '0'}</div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Records/Window</div>
        </div>

        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Throughput</div>
          <div className="text-lg font-bold text-blue-400 font-mono mt-1">{telem.pkt_rate?.toFixed(1) ?? '0'}</div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Packets / sec</div>
        </div>

        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Byte Rate</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-1">
            {telem.byte_rate ? `${(telem.byte_rate / 1024).toFixed(1)} KB/s` : '0 KB/s'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Bandwidth</div>
        </div>

        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">TCP SYN Ratio</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-1">
            {telem.syn_ratio ? `${(telem.syn_ratio * 100).toFixed(0)}%` : '0%'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Handshake Share</div>
        </div>

        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">TCP RST Ratio</div>
          <div className={`text-lg font-bold font-mono mt-1 ${telem.rst_ratio && telem.rst_ratio > 0.1 ? 'text-red-400' : 'text-slate-100'}`}>
            {telem.rst_ratio ? `${(telem.rst_ratio * 100).toFixed(0)}%` : '0%'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Connection Resets</div>
        </div>

        <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Port Entropy</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-1">
            {telem.dst_port_entropy?.toFixed(2) ?? '0.00'}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Shannon Bits</div>
        </div>
      </div>

      {/* --- 24-D State Vector Inspection Table --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold text-slate-200">The 24-D State Vector Dimensions (S_t)</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Computed strictly from flow records inside the active 30s window
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            NetworkStateBuilder.py
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
          {Object.entries(telem).map(([key, val]) => (
            <div key={key} className="bg-[#0d1424] border border-[#1a2438] p-2 rounded">
              <div className="text-[10px] text-slate-500 truncate" title={key}>{key}</div>
              <div className="text-slate-200 font-bold mt-1 truncate">
                {typeof val === 'number' ? (val < 1 && val > 0 ? val.toFixed(4) : val.toFixed(2)) : String(val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Live Ingestion Event History Table (Screenshot 5 Bottom) --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5">
        <div className="text-xs font-bold text-slate-200 mb-3 font-mono">Recent Stream Ingestion Events</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Event ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Current Stage</th>
                <th className="pb-2">Next Forecast</th>
                <th className="pb-2">Confidence</th>
                <th className="pb-2">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {historyEvents.slice(0, 10).map((ev, idx) => (
                <tr key={idx} className="hover:bg-[#111928]">
                  <td className="py-2 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td className="text-slate-500">{ev.event_id || '?'}</td>
                  <td>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                      {ev.status}
                    </span>
                  </td>
                  <td className="text-emerald-400 font-semibold">{ev.current_stage || '?'}</td>
                  <td className="text-blue-400 font-semibold">{ev.predicted_next_stage || '?'}</td>
                  <td className="text-slate-300">{ev.confidence ? `${(ev.confidence * 100).toFixed(1)}%` : '?'}</td>
                  <td className="text-slate-400">{ev.inference_latency_ms ? `${ev.inference_latency_ms.toFixed(1)} ms` : '?'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
