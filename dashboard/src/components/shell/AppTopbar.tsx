import React from 'react';
import { Search, Bell, Radio, UserCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AppTopbar: React.FC = () => {
  const { isWsConnected, lastForecast } = useAppStore();

  return (
    <header className="h-16 bg-[#090d16] border-b border-[#1a2333] px-6 flex items-center justify-between shrink-0 select-none">
      {/* Global Search */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search threats, techniques, source IPs, stages..."
          className="w-full bg-[#0d1322] border border-[#1a2333] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 border border-slate-700/50 rounded px-1 font-mono">
          /
        </span>
      </div>

      {/* Live Stream & Session Status */}
      <div className="flex items-center gap-4">
        {/* Stream Indicator */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border ${
          isWsConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-semibold text-[11px] tracking-wide">
            {isWsConnected ? 'LIVE INGESTION: 30s' : 'RECONNECTING'}
          </span>
        </div>

        {/* Threat Level Chip */}
        {lastForecast && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-red-500/10 border border-red-500/30 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span className="text-[11px] font-bold tracking-wide">
              {lastForecast.risk_level} RISK ({lastForecast.risk_score.toFixed(0)}/100)
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#121927] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#1a2333]">
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">SOC Operator</div>
            <div className="text-[10px] text-slate-500 font-mono">Tier-2 Analyst</div>
          </div>
        </div>
      </div>
    </header>
  );
};
