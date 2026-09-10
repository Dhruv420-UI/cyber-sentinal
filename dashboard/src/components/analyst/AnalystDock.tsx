import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, Terminal, ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { queryAgent } from '../../services/api';

const STARTER_QUESTIONS = [
  "What's happening right now?",
  "Why is this considered risky?",
  "What is likely to happen next?",
  "What should I investigate first?",
  "Explain this incident in simple terms."
];

export const AnalystDock: React.FC = () => {
  const { chatMessages, addChatMessage, lastForecast, isMobileAnalystOpen, setIsMobileAnalystOpen } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return true;
  });

  // Lock body scroll only when mobile analyst drawer is open AND fully expanded
  useEffect(() => {
    if (isMobileAnalystOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileAnalystOpen, isMinimized]);

  // Resizing state and persistence
  const [isDragging, setIsDragging] = useState(false);

  const [desktopWidth, setDesktopWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cybersentinel_analyst_desktop_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 260 && parsed <= 900) return parsed;
        }
      } catch {}
    }
    return 320; // default w-80
  });

  const [tabletWidth, setTabletWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cybersentinel_analyst_tablet_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 280 && parsed <= 700) return parsed;
        }
      } catch {}
    }
    return 384; // default sm:w-96
  });

  const [mobileHeight, setMobileHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cybersentinel_analyst_mobile_height');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 220 && parsed <= window.innerHeight * 0.85) return parsed;
        }
      } catch {}
      return Math.round(window.innerHeight * 0.55);
    }
    return 380;
  });

  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop horizontal resize (left edge)
  const handleDesktopResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const onPointerMove = (ev: PointerEvent) => {
      const newWidth = window.innerWidth - ev.clientX;
      const minW = 260;
      const maxW = Math.min(Math.round(window.innerWidth * 0.55), 750);
      const clamped = Math.max(minW, Math.min(maxW, newWidth));
      setDesktopWidth(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setDesktopWidth((curr) => {
        try {
          sessionStorage.setItem('cybersentinel_analyst_desktop_width', String(curr));
        } catch {}
        return curr;
      });
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Tablet horizontal resize (left edge)
  const handleTabletResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const onPointerMove = (ev: PointerEvent) => {
      const newWidth = window.innerWidth - ev.clientX;
      const minW = 280;
      const maxW = Math.min(Math.round(window.innerWidth * 0.85), 640);
      const clamped = Math.max(minW, Math.min(maxW, newWidth));
      setTabletWidth(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setTabletWidth((curr) => {
        try {
          sessionStorage.setItem('cybersentinel_analyst_tablet_width', String(curr));
        } catch {}
        return curr;
      });
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Mobile vertical resize (top edge)
  const handleMobileHeightResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const onPointerMove = (ev: PointerEvent) => {
      const newHeight = window.innerHeight - ev.clientY;
      const minH = 220;
      const maxH = Math.round(window.innerHeight * 0.78);
      const clamped = Math.max(minH, Math.min(maxH, newHeight));
      setMobileHeight(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setMobileHeight((curr) => {
        try {
          sessionStorage.setItem('cybersentinel_analyst_mobile_height', String(curr));
        } catch {}
        return curr;
      });
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    addChatMessage({ role: 'analyst', content: query });
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const resp = await queryAgent(query, lastForecast, undefined, history);
      addChatMessage({
        role: 'agent',
        content: resp.answer,
        tools: resp.tool_calls,
        backend: resp.llm_backend
      });
    } catch (e: any) {
      addChatMessage({
        role: 'agent',
        content: `### [OBSERVED]\nCommunication with Defensive Agent interrupted: ${e.message}.\n\n### [FORECAST]\nOperating in fail-closed deterministic mode.\n\n### [RECOMMENDATION]\nCheck backend health and API connectivity.`,
        backend: 'fallback'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDockInner = (isMobile: boolean) => (
    <>
      {/* Header */}
      <div
        className={`h-16 px-4 border-b border-[#1a2333] flex items-center justify-between shrink-0 bg-[#090d16] ${
          isMinimized ? 'cursor-pointer hover:bg-[#0c121f] transition-colors' : ''
        }`}
        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
              CyberSentinel Analyst
            </div>
            <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GROUNDED INFERENCE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Minimize / Expand Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121927] border border-transparent hover:border-[#1e293b] transition-colors focus:outline-none min-w-[32px] min-h-[32px] flex items-center justify-center"
            title={isMinimized ? 'Expand AI Analyst' : 'Minimize AI Analyst'}
            aria-label={isMinimized ? 'Expand AI Analyst' : 'Minimize AI Analyst'}
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Close button on mobile */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileAnalystOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121927] transition-colors focus:outline-none min-w-[32px] min-h-[32px] flex items-center justify-center ml-0.5"
              aria-label="Close analyst panel"
              title="Close analyst panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Large Content: Messages, Quick Queries, Input (collapsed when minimized) */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="space-y-3 py-1">
                <div className="p-3 bg-[#0d1424] border border-[#1a2333] rounded-lg">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Defensive AI SOC Copilot</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Grounded strictly in real-time neural world model outputs and live telemetry. Select a starter question below or inquire directly.
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-xs leading-relaxed ${
                    msg.role === 'analyst'
                      ? 'bg-[#151e30] border border-[#22304d] text-slate-100 ml-3 sm:ml-4'
                      : 'bg-[#0d1424] border border-[#1a2333] text-slate-300 mr-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono gap-1">
                    <span className={msg.role === 'analyst' ? 'text-blue-400 font-bold' : 'text-slate-400 font-bold'}>
                      {msg.role === 'analyst' ? 'SOC ANALYST' : 'CYBERSENTINEL DEFENSE'}
                    </span>
                    {msg.backend && (
                      <span className="text-slate-500 text-[9px] flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {msg.backend.replace('ollama:', '')}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>

                  {msg.tools && msg.tools.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex flex-wrap gap-1 items-center">
                      <Terminal className="w-3 h-3 text-blue-400 shrink-0" />
                      {msg.tools.map((t, i) => (
                        <span key={i} className="bg-[#121a2d] px-1 py-0.5 rounded border border-slate-700/50">
                          {t.replace('route_classifier:', '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="bg-[#0d1424] border border-[#1a2333] text-slate-400 rounded-lg p-3 text-xs flex items-center gap-2 font-mono animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                Analyzing telemetry & model state...
              </div>
            )}
          </div>

          {/* Quick Queries */}
          <div className="border-t border-[#1a2333] bg-[#070b13] shrink-0">
            <button
              type="button"
              onClick={() => setShowSuggestedQuestions(!showSuggestedQuestions)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[#0c121f] transition-colors focus:outline-none"
              title={showSuggestedQuestions ? 'Hide suggested questions' : 'Show suggested questions'}
              aria-label={showSuggestedQuestions ? 'Hide suggested questions' : 'Show suggested questions'}
              aria-expanded={showSuggestedQuestions}
            >
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Suggested questions
              </span>
              <div className="p-0.5 text-slate-500 hover:text-slate-200 transition-colors shrink-0">
                {showSuggestedQuestions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>
            {showSuggestedQuestions && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="text-[10px] sm:text-[11px] font-medium bg-[#101726] hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-[#1c263a] rounded px-2.5 py-1.5 transition-colors disabled:opacity-50 min-h-[30px]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#1a2333] bg-[#090d16] shrink-0">
            <div className="flex items-center gap-2 bg-[#0e1526] border border-[#1e293b] rounded-lg px-2.5 py-1.5 focus-within:border-blue-500/50 transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask CyberSentinel..."
                disabled={isLoading}
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Dock (Side panel with horizontal resize handle on left edge) */}
      <aside
        style={isMinimized ? undefined : { width: `${desktopWidth}px` }}
        className={`hidden xl:flex flex-col bg-[#090d16] border-l border-[#1a2333] select-none shrink-0 relative ${
          isDragging ? 'transition-none select-none' : 'transition-all duration-300 ease-in-out'
        } ${
          isMinimized
            ? 'fixed bottom-0 right-0 w-80 h-16 border-t shadow-2xl z-30 rounded-tl-lg'
            : 'h-screen'
        }`}
      >
        {/* Horizontal Resize Handle (Left Edge) */}
        {!isMinimized && (
          <div
            onPointerDown={handleDesktopResizeStart}
            className="absolute top-0 bottom-0 -left-1.5 w-3 z-30 cursor-ew-resize flex items-center justify-center group touch-none select-none"
            title="Drag to resize AI Analyst panel width"
            aria-label="Resize AI Analyst panel width"
            role="separator"
            aria-orientation="vertical"
          >
            <div
              className={`w-0.5 h-12 rounded-full transition-all duration-150 ${
                isDragging
                  ? 'bg-blue-400 w-1 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                  : 'bg-transparent group-hover:bg-blue-400/70 group-hover:w-1'
              }`}
            />
          </div>
        )}
        {renderDockInner(false)}
      </aside>

      {/* 2. Mobile / Tablet Slide-over Backdrop (< xl screens, only active when drawer is expanded) */}
      {isMobileAnalystOpen && !isMinimized && (
        <div
          onClick={() => setIsMobileAnalystOpen(false)}
          className="xl:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile / Tablet Slide-over Drawer / Bottom Resizable Panel (< xl screens) */}
      <aside
        style={
          !isMobileAnalystOpen
            ? undefined
            : isMinimized
              ? undefined
              : isSmallScreen
                ? { height: `${mobileHeight}px` }
                : { width: `${tabletWidth}px` }
        }
        className={`xl:hidden fixed z-50 select-none shadow-2xl bg-[#090d16] ${
          isDragging ? 'transition-none select-none' : 'transition-all duration-300 ease-in-out'
        } ${
          !isMobileAnalystOpen
            ? 'translate-x-full pointer-events-none'
            : isMinimized
              ? 'bottom-0 left-0 right-0 h-16 border-t border-[#1a2333] translate-x-0'
              : isSmallScreen
                ? 'bottom-0 left-0 right-0 w-full border-t border-[#1a2333] flex flex-col translate-x-0 rounded-t-xl overflow-hidden'
                : 'top-0 right-0 bottom-0 max-w-[90vw] border-l border-[#1a2333] h-full flex flex-col translate-x-0'
        }`}
      >
        {/* Mobile Phone (<640px): Vertical Top Resize Handle */}
        {isSmallScreen && !isMinimized && (
          <div
            onPointerDown={handleMobileHeightResizeStart}
            onDoubleClick={() => {
              setMobileHeight((prev) => {
                const compact = 260;
                const expanded = Math.round(window.innerHeight * 0.74);
                const next = prev < (compact + expanded) / 2 ? expanded : compact;
                try {
                  sessionStorage.setItem('cybersentinel_analyst_mobile_height', String(next));
                } catch {}
                return next;
              });
            }}
            className="w-full h-5 shrink-0 z-20 cursor-ns-resize flex items-center justify-center group touch-none select-none bg-[#090d16] border-b border-[#1a2333]/50"
            title="Drag to resize panel height (double-tap to toggle size)"
            aria-label="Resize AI Analyst panel height"
            role="separator"
            aria-orientation="horizontal"
          >
            <div
              className={`w-9 h-1 rounded-full transition-colors ${
                isDragging ? 'bg-blue-400' : 'bg-slate-600/50 group-hover:bg-blue-400'
              }`}
            />
          </div>
        )}

        {/* Tablet (640px-1279px): Horizontal Left Resize Handle */}
        {!isSmallScreen && !isMinimized && (
          <div
            onPointerDown={handleTabletResizeStart}
            className="absolute top-0 bottom-0 -left-1.5 w-3 z-30 cursor-ew-resize flex items-center justify-center group touch-none select-none"
            title="Drag to resize panel width"
            aria-label="Resize AI Analyst panel width"
            role="separator"
            aria-orientation="vertical"
          >
            <div
              className={`w-0.5 h-12 rounded-full transition-all duration-150 ${
                isDragging
                  ? 'bg-blue-400 w-1 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                  : 'bg-transparent group-hover:bg-blue-400/70 group-hover:w-1'
              }`}
            />
          </div>
        )}

        {renderDockInner(true)}
      </aside>
    </>
  );
};
