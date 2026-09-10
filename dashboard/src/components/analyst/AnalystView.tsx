import React, { useState } from 'react';
import { Bot, Send, Sparkles, Terminal, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { queryAgent } from '../../services/api';

const QUICK_QUERIES = [
  'What should I prioritize?',
  'Why is this a threat?',
  'What evidence supports this?',
  'What MITRE techniques?',
  'Summarize incident'
];

export const AnalystView: React.FC = () => {
  const { chatMessages, addChatMessage, lastForecast } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    addChatMessage({ role: 'analyst', content: query });
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const resp = await queryAgent(query, lastForecast);
      addChatMessage({
        role: 'agent',
        content: resp.answer,
        tools: resp.tool_calls,
        backend: resp.llm_backend
      });
    } catch (e: any) {
      addChatMessage({
        role: 'agent',
        content: `Error communicating with Defensive Agent: ${e.message}. System is operating in fail-closed deterministic mode.`,
        backend: 'fallback'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px]">
      {/* Header Banner */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/30 shrink-0">
        <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5" />
          <span>NEURAL COPILOT // DEFENSIVE AGENT TERMINAL</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              CyberSentinel Analyst Interactive Console
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                GROUNDED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct reasoning engine strictly grounded in live CyberWorldModelV2 physical state vectors and calibrated predictions.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px]">Zero-Hallucination Guard Active</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="flex-1 bg-[#090d16] border border-[#1a2333] rounded-xl flex flex-col overflow-hidden shadow-xl min-h-0">
        {/* Messages History */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'analyst'
                  ? 'bg-[#151e30] border border-[#22304d] text-slate-100 ml-4 sm:ml-12'
                  : 'bg-[#0d1424] border border-[#1a2333] text-slate-200 mr-2 sm:mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[10px] sm:text-xs font-mono gap-1">
                <span className={msg.role === 'analyst' ? 'text-blue-400 font-bold' : 'text-slate-400 font-bold'}>
                  {msg.role === 'analyst' ? 'SOC ANALYST' : 'CYBERSENTINEL DEFENSE'}
                </span>
                {msg.backend && (
                  <span className="text-slate-500 text-[10px] flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {msg.backend.replace('ollama:', '')}
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>

              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex flex-wrap gap-1.5 items-center">
                  <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-slate-500">Evidence queries:</span>
                  {msg.tools.map((t, i) => (
                    <span key={i} className="bg-[#121a2d] px-1.5 py-0.5 rounded border border-slate-700/50 text-blue-300">
                      {t.replace('route_classifier:', '')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-[#0d1424] border border-[#1a2333] text-slate-400 rounded-xl p-3 sm:p-4 text-xs flex items-center gap-2 font-mono animate-pulse">
              <Sparkles className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <span>Analyzing telemetry, stage transitions, and MITRE correlations...</span>
            </div>
          )}
        </div>

        {/* Quick Inquiries */}
        <div className="px-3 sm:px-4 py-2 border-t border-[#1a2333] bg-[#070b13] shrink-0">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
            Quick Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {QUICK_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] sm:text-xs font-medium bg-[#101726] hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-[#1c263a] rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50 min-h-[32px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#1a2333] bg-[#090d16] shrink-0">
          <div className="flex items-center gap-2 bg-[#0e1526] border border-[#1e293b] rounded-xl px-3 py-2 focus-within:border-blue-500/50 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask CyberSentinel SOC Analyst about threat evidence, attack paths, or mitigations..."
              disabled={isLoading}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold min-h-[36px]"
              aria-label="Send query"
            >
              <span className="hidden sm:inline">Inquire</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
