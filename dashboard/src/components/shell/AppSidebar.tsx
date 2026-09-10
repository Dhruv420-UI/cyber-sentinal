import React, { useEffect } from 'react';
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
  LayoutDashboard,
  X
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
  const { activeNav, setActiveNav, systemHealth, isMobileNavOpen, setIsMobileNavOpen } = useAppStore();

  // Lock body scroll when mobile navigation drawer is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  const renderNavContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#1a2333] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
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
        {isMobile && (
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121927] transition-colors focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
                  onClick={() => {
                    setActiveNav(item.id);
                    if (isMobile) setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121927]'
                  } ${isMobile ? 'min-h-[40px]' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Operational Badge */}
      <div className="p-3 border-t border-[#1a2333] shrink-0">
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
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Completely Unchanged on Desktop) */}
      <aside className="hidden lg:flex w-64 bg-[#090d16] border-r border-[#1a2333] flex-col h-screen select-none shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Slide-in Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[#090d16] border-r border-[#1a2333] flex flex-col h-full select-none shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
};
