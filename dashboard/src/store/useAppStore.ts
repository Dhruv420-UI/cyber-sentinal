import { create } from 'zustand';
import type { CyberSentinelForecast, StreamEvent, SystemHealth } from '../types';
import { getWsStreamUrl, fetchHealth, fetchStreamHealth } from '../services/api';

export type ActiveNav =
  | 'overview'
  | 'forecast'
  | 'incidents'
  | 'replay'
  | 'telemetry'
  | 'mitre'
  | 'simulator'
  | 'analyst'
  | 'health'
  | 'model';

interface IncidentItem {
  id: string;
  timestamp: string;
  stage: string;
  nextStage: string;
  confidence: number;
  attackProbability: number;
  riskScore: number;
  riskLevel: string;
  primaryTechnique?: string;
  description: string;
}

interface AppStore {
  activeNav: ActiveNav;
  setActiveNav: (nav: ActiveNav) => void;

  // Mobile Drawer State
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  isMobileAnalystOpen: boolean;
  setIsMobileAnalystOpen: (open: boolean) => void;

  // Real-time stream state
  isWsConnected: boolean;
  wsError: string | null;
  lastEvent: StreamEvent | null;
  lastForecast: CyberSentinelForecast | null;
  historyEvents: StreamEvent[];
  incidents: IncidentItem[];
  observedStages: Set<string>;

  // System Health
  systemHealth: SystemHealth | null;
  refreshHealth: () => Promise<void>;

  // Chat/Analyst State
  chatMessages: Array<{
    role: 'analyst' | 'agent';
    content: string;
    tools?: string[];
    backend?: string;
  }>;
  addChatMessage: (msg: { role: 'analyst' | 'agent'; content: string; tools?: string[]; backend?: string }) => void;

  // WebSocket Controls
  initWebSocket: () => void;
  closeWebSocket: () => void;
}

let socketInstance: WebSocket | null = null;
let reconnectTimer: any = null;

export const useAppStore = create<AppStore>((set, get) => ({
  activeNav: 'overview',
  setActiveNav: (nav) => set({ activeNav: nav, isMobileNavOpen: false, isMobileAnalystOpen: false }),

  isMobileNavOpen: false,
  setIsMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  isMobileAnalystOpen: false,
  setIsMobileAnalystOpen: (open) => set({ isMobileAnalystOpen: open }),

  isWsConnected: false,
  wsError: null,
  lastEvent: null,
  lastForecast: null,
  historyEvents: [],
  incidents: [],
  observedStages: new Set<string>(),

  systemHealth: null,
  refreshHealth: async () => {
    try {
      const [h1, h2] = await Promise.allSettled([fetchHealth(), fetchStreamHealth()]);
      const merged: SystemHealth = {
        status: 'healthy',
        ...(h1.status === 'fulfilled' ? h1.value : {}),
        ...(h2.status === 'fulfilled' ? h2.value : {})
      };
      set({ systemHealth: merged });
    } catch {
      set({ systemHealth: { status: 'unavailable' } });
    }
  },

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  initWebSocket: () => {
    if (socketInstance && (socketInstance.readyState === WebSocket.OPEN || socketInstance.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsStreamUrl();
    try {
      socketInstance = new WebSocket(wsUrl);

      socketInstance.onopen = () => {
        set({ isWsConnected: true, wsError: null });
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };

      socketInstance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected' || data.type === 'heartbeat' || data.type === 'pong') {
            return;
          }

          if (data.status === 'FORECAST' || data.type === 'forecast' || data.current_stage) {
            const castedForecast: CyberSentinelForecast = data as unknown as CyberSentinelForecast;
            
            // Record observed stage
            const stages = new Set(get().observedStages);
            if (data.current_stage) stages.add(data.current_stage);

            // Record incident if risk is high or attack probability > 0.3
            const curIncidents = [...get().incidents];
            if ((data.attack_probability > 0.3 || data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH') && data.current_stage !== 'BENIGN') {
              const incidentId = `INC-${Date.now().toString().slice(-4)}`;
              // Prevent exact duplicate within 30 seconds
              const isRecent = curIncidents.some(inc => inc.stage === data.current_stage && Math.abs(new Date(inc.timestamp).getTime() - new Date(data.timestamp).getTime()) < 30000);
              if (!isRecent) {
                curIncidents.unshift({
                  id: incidentId,
                  timestamp: data.timestamp || new Date().toISOString(),
                  stage: data.current_stage,
                  nextStage: data.predicted_next_stage,
                  confidence: data.confidence,
                  attackProbability: data.attack_probability,
                  riskScore: data.risk_score || 0,
                  riskLevel: data.risk_level || 'ELEVATED',
                  primaryTechnique: data.primary_technique_id ? `${data.primary_technique_id} - ${data.primary_technique_name}` : undefined,
                  description: `Autonomous threat progression: ${data.current_stage} transitioning to ${data.predicted_next_stage} with ${(data.confidence * 100).toFixed(1)}% confidence.`
                });
              }
            }

            set((state) => ({
              lastEvent: data,
              lastForecast: castedForecast,
              historyEvents: [data, ...state.historyEvents].slice(0, 50),
              observedStages: stages,
              incidents: curIncidents.slice(0, 30)
            }));
          }
        } catch (e) {
          console.error('WS Parse Error:', e);
        }
      };

      socketInstance.onerror = () => {
        set({ isWsConnected: false, wsError: 'WebSocket connection error' });
      };

      socketInstance.onclose = () => {
        set({ isWsConnected: false });
        socketInstance = null;
        // Schedule auto-reconnect with 3s backoff
        reconnectTimer = setTimeout(() => {
          get().initWebSocket();
        }, 3000);
      };
    } catch (err: any) {
      set({ isWsConnected: false, wsError: err.message });
    }
  },

  closeWebSocket: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socketInstance) {
      socketInstance.close();
      socketInstance = null;
    }
    set({ isWsConnected: false });
  }
}));
