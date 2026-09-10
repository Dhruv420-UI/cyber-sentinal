import React, { useEffect } from 'react';
import { AppSidebar } from './components/shell/AppSidebar';
import { AppTopbar } from './components/shell/AppTopbar';
import { AnalystDock } from './components/analyst/AnalystDock';
import { AnalystView } from './components/analyst/AnalystView';
import { OverviewView } from './components/threat/OverviewView';
import ForecastView from './components/forecast/ForecastView';
import { IncidentsView } from './components/incidents/IncidentsView';
import { ReplayView } from './components/replay/ReplayView';
import { TelemetryView } from './components/telemetry/TelemetryView';
import { MitreView } from './components/mitre/MitreView';
import { SimulatorView } from './components/simulator/SimulatorView';
import { HealthView } from './components/system/HealthView';
import { WorldModelView } from './components/system/WorldModelView';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const { activeNav, initWebSocket, refreshHealth } = useAppStore();

  useEffect(() => {
    initWebSocket();
    refreshHealth();
  }, []);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewView />;
      case 'forecast':
        return <ForecastView />;
      case 'incidents':
        return <IncidentsView />;
      case 'replay':
        return <ReplayView />;
      case 'telemetry':
        return <TelemetryView />;
      case 'mitre':
        return <MitreView />;
      case 'simulator':
        return <SimulatorView />;
      case 'analyst':
        return <AnalystView />;
      case 'health':
        return <HealthView />;
      case 'model':
        return <WorldModelView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans antialiased">
      {/* --- 1. Persistent Sidebar (Desktop) / Slide-in Drawer (Mobile) --- */}
      <AppSidebar />

      {/* --- 2. Center Main Workspace --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
          {renderActiveView()}
        </main>
      </div>

      {/* --- 3. Persistent Analyst Assistant Dock (Desktop) / Slide-over (Mobile) --- */}
      <AnalystDock />
    </div>
  );
};

export default App;
