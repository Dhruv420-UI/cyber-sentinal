import { ArrowRight, TrendingUp, AlertTriangle, Activity, Cpu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { CyberSentinelForecast, RolloutStep, FeatureDelta } from '../../types';

function stageBadge(stage: string | null) {
  if (!stage) return <span className="text-gray-500">--</span>;
  const map: Record<string, string> = {
    NORMAL: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700',
    RECONNAISSANCE: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
    SCANNING: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
    EXPLOITATION: 'bg-orange-900/40 text-orange-300 border border-orange-700',
    LATERAL_MOVEMENT: 'bg-red-900/40 text-red-300 border border-red-700',
    DATA_EXFILTRATION: 'bg-red-900/40 text-red-300 border border-red-700',
    COMMAND_AND_CONTROL: 'bg-purple-900/40 text-purple-300 border border-purple-700',
  };
  const cls = map[stage] ?? 'bg-gray-800 text-gray-300 border border-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${cls}`}>
      {stage.replace(/_/g, ' ')}
    </span>
  );
}

function riskChip(risk: string | null) {
  if (!risk) return <span className="text-gray-500">--</span>;
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-900/50 text-red-300 border border-red-600',
    HIGH: 'bg-orange-900/50 text-orange-300 border border-orange-600',
    MEDIUM: 'bg-yellow-900/50 text-yellow-300 border border-yellow-600',
    LOW: 'bg-emerald-900/50 text-emerald-300 border border-emerald-600',
    MINIMAL: 'bg-blue-900/50 text-blue-300 border border-blue-600',
  };
  const cls = map[risk] ?? 'bg-gray-800 text-gray-400 border border-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${cls}`}>
      {risk}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`bg-gray-900 border rounded-lg p-4 flex flex-col gap-2 ${accent}`}>
      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-medium">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold text-gray-100">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

interface TrajectoryNode {
  label: string;
  stage: string | null;
  kind: 'observed' | 'forecast' | 'simulation';
}

function TrajectoryFlow({ nodes }: { nodes: TrajectoryNode[] }) {
  const kindColor: Record<string, string> = {
    observed: 'border-emerald-600 text-emerald-300',
    forecast: 'border-blue-600 text-blue-300',
    simulation: 'border-purple-600 text-purple-300',
  };
  const kindDot: Record<string, string> = {
    observed: 'bg-emerald-500',
    forecast: 'bg-blue-500',
    simulation: 'bg-purple-500',
  };
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {nodes.map((n, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`border rounded-lg px-3 py-2 flex flex-col items-center gap-1 min-w-[110px] ${kindColor[n.kind]}`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${kindDot[n.kind]}`} />
              <span className="text-[10px] uppercase tracking-widest text-gray-400">{n.label}</span>
            </div>
            <div className="text-xs font-mono font-medium text-center">
              {n.stage ? n.stage.replace(/_/g, ' ') : '--'}
            </div>
          </div>
          {i < nodes.length - 1 && (
            <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function RolloutTable({ steps }: { steps: RolloutStep[] }) {
  if (!steps.length) return <p className="text-gray-500 text-sm">No rollout steps available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="text-left py-2 pr-4 font-medium">Step</th>
            <th className="text-left py-2 pr-4 font-medium">Stage</th>
            <th className="text-left py-2 pr-4 font-medium">Confidence</th>
            <th className="text-right py-2 font-medium">Attack Prob.</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <td className="py-1.5 pr-4 text-gray-500">{i + 1}</td>
              <td className="py-1.5 pr-4">{stageBadge(s.predicted_stage)}</td>
              <td className="py-1.5 pr-4">{s.confidence != null ? `${(s.confidence * 100).toFixed(1)}%` : '--'}</td>
              <td className="py-1.5 text-right text-blue-300">
                {s.attack_probability != null ? `${(s.attack_probability * 100).toFixed(1)}%` : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureDeltaTable({ forecast }: { forecast: CyberSentinelForecast }) {
  const deltas = forecast.top_features ?? [];
  if (!deltas.length) return <p className="text-gray-500 text-sm">No feature deltas in this forecast.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="text-left py-2 pr-4 font-medium">Feature</th>
            <th className="text-right py-2 pr-4 font-medium">Current</th>
            <th className="text-right py-2 pr-4 font-medium">Forecasted</th>
            <th className="text-right py-2 font-medium">Delta</th>
          </tr>
        </thead>
        <tbody>
          {deltas.map((d, i) => {
            const sign = (d.abs_change ?? 0) >= 0 ? '+' : '';
            const deltaColor =
              (d.abs_change ?? 0) > 0.1
                ? 'text-red-400'
                : (d.abs_change ?? 0) < -0.1
                ? 'text-emerald-400'
                : 'text-gray-400';
            return (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-1.5 pr-4 text-gray-300">{d.feature}</td>
                <td className="py-1.5 pr-4 text-right text-gray-400">
                  {d.current?.toFixed(4) ?? '--'}
                </td>
                <td className="py-1.5 pr-4 text-right text-blue-300">
                  {d.predicted?.toFixed(4) ?? '--'}
                </td>
                <td className={`py-1.5 text-right font-semibold ${deltaColor}`}>
                  {d.abs_change != null ? `${sign}${d.abs_change.toFixed(4)}` : '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ForecastView() {
  const lastForecast = useAppStore((s) => s.lastForecast);
  const lastEvent = useAppStore((s) => s.lastEvent);

  if (!lastForecast) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
        <TrendingUp className="w-12 h-12 text-gray-700" />
        <p className="text-lg font-medium">No Active Forecast</p>
        <p className="text-sm text-center max-w-xs">
          Waiting for the model to produce a forecast. Ensure telemetry is flowing and the backend is online.
        </p>
      </div>
    );
  }

  const rolloutSteps: RolloutStep[] = lastForecast.rollout_steps ?? [];
  const simK = rolloutSteps.length;

  const trajectoryNodes: TrajectoryNode[] = [
    { label: 'Observed', stage: lastForecast.current_stage, kind: 'observed' },
    { label: 'Forecast T+1', stage: lastForecast.predicted_next_stage, kind: 'forecast' },
  ];
  rolloutSteps.forEach((step, i) => {
    trajectoryNodes.push({ label: `Sim T+${i + 2}`, stage: step.predicted_stage, kind: 'simulation' });
  });

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Forecast and Trajectory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Autoregressive K-step attack trajectory prediction</p>
        </div>
        {lastEvent && (
          <div className="text-xs text-gray-500 font-mono">
            Event ID: {lastEvent.event_id?.slice(0, 8) ?? '--'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Current Stage"
          value={stageBadge(lastForecast.current_stage)}
          sub="Observed state"
          accent="border-emerald-800"
        />
        <MetricCard
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          label="Next Stage"
          value={stageBadge(lastForecast.predicted_next_stage)}
          sub="T+1 prediction"
          accent="border-blue-800"
        />
        <MetricCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Risk Level"
          value={riskChip(lastForecast.risk_level)}
          sub={
            lastForecast.attack_probability != null
              ? `${(lastForecast.attack_probability * 100).toFixed(1)}% attack probability`
              : 'Attack probability unavailable'
          }
          accent="border-orange-800"
        />
        <MetricCard
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="Simulation Depth"
          value={<span className="font-mono">K = {simK}</span>}
          sub="Autoregressive rollout steps"
          accent="border-purple-800"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-200">Attack Trajectory</h2>
          <div className="flex items-center gap-3 ml-auto text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Observed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Forecast</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Simulation</span>
          </div>
        </div>
        <TrajectoryFlow nodes={trajectoryNodes} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-3">Rollout Steps</h2>
        <RolloutTable steps={rolloutSteps} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-3">Feature Deltas</h2></div>
    </div>
  );
}