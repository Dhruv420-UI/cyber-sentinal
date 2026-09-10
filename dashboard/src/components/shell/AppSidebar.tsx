import React from 'react';
import {
  ShieldAlert,
  Radio,
  History,
  Activity,
  Layers,
  Terminal,
  Bot,
  HeartPulse,
  Cpu,
  LayoutDashboard
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { ActiveNav } from '../../store/useAppStore';

interface NavItem {
  id: ActiveNav;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'COMMAND',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { id: 'forecast', label: 'Forecast', icon: ShieldAlert },
      { id: 'incidents', label: 'Incidents', icon: Activity }
    ]
  },
  {
    title: 'ANALYSIS',
    items: [
      { id: 'replay', label: 'Replay', icon: History },
      { id: 'telemetry', label: 'Telemetry', icon: Radio },
      { id: 'mitre', label: 'MITRE ATT&CK', icon: Layers }
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { id: 'simulator', label: 'Simulator', icon: Terminal },
      { id: 'analyst', label: 'Analyst', icon: Bot }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'health', label: 'Health', icon: HeartPulse },
      { id: 'model', label: 'World Model', icon: Cpu }
    ]
  }
];

export const AppSidebar: React.FC = () => {
  const { activeNav, setActiveNav, systemHealth } = useAppStore();

  return (
    <aside className="w-64 bg-[#090d16] border-r border-[#1a2333] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-[#1a2333]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-slate-100 tracking-wide flex items-center gap-1.5">
            CyberSentinel AI
          </div>
          <div className="text-[10px] text-slate-500 font-mono tracking-wider">
            TEMPORAL WORLD MODEL
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 tracking-widest px-3 mb-2 font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121927]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Operational Badge */}
      <div className="p-3 border-t border-[#1a2333]">
        <div className="bg-[#0e1422] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemHealth?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                systemHealth?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <div>
              <div className="text-[11px] font-semibold text-slate-200">
                {systemHealth?.status === 'healthy' ? 'System Operational' : 'Connecting...'}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {systemHealth?.model_ready ? 'WorldModel v2.0 Ready' : 'Inference Pipeline'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
