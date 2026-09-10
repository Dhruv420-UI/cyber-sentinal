import React from 'react';
import { Search, Bell, Radio, UserCheck, Menu, X, Bot, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const AppTopbar: React.FC = () => {
  const { isWsConnected, lastForecast, isMobileNavOpen, toggleMobileNav, isMobileAnalystOpen, setIsMobileAnalystOpen } = useAppStore();

  return (
    <header className="h-16 bg-[#090d16] border-b border-[#1a2333] px-3 sm:px-6 flex items-center justify-between shrink-0 select-none gap-2">
      {/* Left: Hamburger (Mobile only) + Brand or Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={toggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#121927] border border-[#1e293b] focus:outline-none transition-colors shrink-0"
          aria-label={isMobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Mobile Brand (visible only when sidebar is hidden) */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs text-slate-100 tracking-wide truncate hidden sm:inline">
            CyberSentinel AI
          </span>
        </div>

        {/* Global Search (visible on md+) */}
        <div className="relative hidden md:block w-64 lg:w-80 xl:w-96">
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
      </div>

      {/* Right: Live Stream & Session Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Stream Indicator */}
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono border ${
          isWsConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse shrink-0" />
          <span className="font-semibold tracking-wide">
            {isWsConnected ? (
              <>
                <span className="hidden sm:inline">LIVE INGESTION: </span>
                <span>30s</span>
              </>
            ) : (
              'RECONNECTING'
            )}
          </span>
        </div>

        {/* Mobile AI Analyst Toggle Button (< xl only) */}
        <button
          onClick={() => setIsMobileAnalystOpen(!isMobileAnalystOpen)}
          aria-label="Toggle AI Analyst Panel"
          className={`xl:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
            isMobileAnalystOpen
              ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/20'
              : 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25'
          }`}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline text-[11px] font-semibold">Analyst</span>
        </button>

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
        <button className="relative p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#121927] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>

        {/* Operator Profile */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#1a2333]">
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
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
