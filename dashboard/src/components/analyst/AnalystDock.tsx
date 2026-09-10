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

export const AnalystDock: React.FC = () => {
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
    <aside className="w-80 bg-[#090d16] border-l border-[#1a2333] flex flex-col h-screen select-none shrink-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-[#1a2333] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              CyberSentinel Analyst
            </div>
            <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              GROUNDED INFERENCE
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-3 text-xs leading-relaxed ${
              msg.role === 'analyst'
                ? 'bg-[#151e30] border border-[#22304d] text-slate-100 ml-4'
                : 'bg-[#0d1424] border border-[#1a2333] text-slate-300 mr-2'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono">
              <span className={msg.role === 'analyst' ? 'text-blue-400 font-bold' : 'text-slate-400 font-bold'}>
                {msg.role === 'analyst' ? 'SOC ANALYST' : 'CYBERSENTINEL DEFENSE'}
              </span>
              {msg.backend && (
                <span className="text-slate-500 text-[9px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {msg.backend.replace('ollama:', '')}
                </span>
              )}
            </div>
            <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

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
        ))}
        {isLoading && (
          <div className="bg-[#0d1424] border border-[#1a2333] text-slate-400 rounded-lg p-3 text-xs flex items-center gap-2 font-mono animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            Analyzing telemetry & model state...
          </div>
        )}
      </div>

      {/* Quick Queries */}
      <div className="px-3 py-2 border-t border-[#1a2333] bg-[#070b13]">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
          Quick Inquiries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-[10px] font-medium bg-[#101726] hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-[#1c263a] rounded px-2 py-1 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1a2333] bg-[#090d16]">
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
            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
