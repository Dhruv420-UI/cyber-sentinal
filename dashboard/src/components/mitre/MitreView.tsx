import React, { useState } from 'react';
import { Layers, Search, ExternalLink, ShieldCheck, Tag } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const STAGE_TECHNIQUES = [
  {
    stage: 'RECONNAISSANCE',
    techniques: [
      { id: 'T1595', name: 'Active Scanning', tactic: 'Reconnaissance', rationale: 'SYN flooding, port entropy spikes, and high unique-destination-port counts are characteristic of active network scanning.' },
      { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery', rationale: 'High unique_dst_ports, elevated syn_ratio, and broad dst_ip_entropy indicate active service enumeration of discovered hosts.' },
      { id: 'T1590', name: 'Gather Victim Network Information', tactic: 'Reconnaissance', rationale: 'Network scanning often precedes enumeration of network topology, live hosts, and exposed services.' }
    ]
  },
  {
    stage: 'INITIAL_ACCESS',
    techniques: [
      { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', rationale: 'High failed_flow_ratio and port_80_443_share indicate exploitation attempts targeting web-facing services.' },
      { id: 'T1133', name: 'External Remote Services', tactic: 'Initial Access', rationale: 'port_22_share and port_3389_share spikes indicate exploitation of SSH/RDP remote service access.' }
    ]
  },
  {
    stage: 'CREDENTIAL_ACCESS',
    techniques: [
      { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', rationale: 'Elevated failed_flow_count, failed_flow_ratio, and rst_ratio are signatures of brute-force authentication attempts.' },
      { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', rationale: 'High port_445_share combined with credential access stage may indicate SMB-based credential dumping.' }
    ]
  },
  {
    stage: 'LATERAL_MOVEMENT',
    techniques: [
      { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', rationale: 'Elevated port_445_share (SMB), port_3389_share (RDP), and port_22_share (SSH) combined with unique_dst_ips growth.' },
      { id: 'T1570', name: 'Lateral Tool Transfer', tactic: 'Lateral Movement', rationale: 'Increasing total_bytes and byte_rate during lateral movement indicates tool staging across compromised systems.' }
    ]
  },
  {
    stage: 'COMMAND_AND_CONTROL',
    techniques: [
      { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', rationale: 'Regular beacon intervals with high port_80_443_share and long mean_flow_duration indicate C2 over HTTP/S.' },
      { id: 'T1573', name: 'Encrypted Channel', tactic: 'Command and Control', rationale: 'Encrypted C2 channels often appear as long-duration, constant-rate flows with low packet counts.' }
    ]
  },
  {
    stage: 'EXFILTRATION',
    techniques: [
      { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', rationale: 'Large total_bytes and high byte_rate with unusual destination ports indicate exfiltration.' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', rationale: 'Data exfiltrated over established C2 channels with high bytes_per_packet and sustained byte_rate.' }
    ]
  }
];

export const MitreView: React.FC = () => {
  const { lastForecast } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const activeStage = lastForecast?.predicted_next_stage || lastForecast?.current_stage || 'CREDENTIAL_ACCESS';

  return (
    <div className="space-y-5">
      {/* --- Header --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-5 shadow-lg shadow-black/30">
        <div className="text-[10px] font-mono uppercase text-blue-400 font-bold mb-1">
          KNOWLEDGE ENGINE // MITRE ATT&CK ENTERPRISE V14
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Deterministic MITRE Mapping
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                STATIC LOOKUP MATRIX
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic rule-based mapping correlating predicted attack stages and physical network anomalies with verified ATT&CK techniques.
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>Current Active Stage: <span className="text-blue-400 font-bold">{activeStage}</span></div>
            <div>Knowledge Base: <span className="text-slate-200">Enterprise v14 (Zero LLM Hallucination)</span></div>
          </div>
        </div>
      </div>

      {/* --- Active Forecast Context Card --- */}
      <div className="bg-gradient-to-r from-[#0d1628] to-[#0a101f] border border-blue-500/30 rounded-xl p-5">
        <div className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Techniques Contextually Associated with Predicted Next Stage: <span className="text-blue-400">{activeStage}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lastForecast?.mitre_techniques && lastForecast.mitre_techniques.length > 0 ? (
            lastForecast.mitre_techniques.map((t, idx) => (
              <div key={idx} className="bg-[#090e18] border border-[#1e2a42] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/40">
                    {t.technique_id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{t.tactic}</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{t.name}</div>
                <div className="text-xs text-slate-400 leading-relaxed font-sans">{t.rationale}</div>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Provenance:</span>
                  <span>{t.mapping_provenance}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-slate-500 text-xs font-mono py-4 text-center">
              No active threat progression techniques mapped for nominal baseline state.
            </div>
          )}
        </div>
      </div>

      {/* --- Stage to Technique Reference Matrix --- */}
      <div className="bg-[#0b101c] border border-[#1a2333] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="text-xs font-bold text-slate-200 font-mono">
            Full Enterprise v14 Tactical Stage Mapping Matrix
          </div>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter techniques or stages..."
              className="w-full bg-[#0d1424] border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1 font-mono outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {STAGE_TECHNIQUES.filter(s => s.stage.toLowerCase().includes(searchTerm.toLowerCase()) || s.techniques.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()))).map((sec) => (
            <div key={sec.stage} className="border border-slate-800/80 rounded-lg p-3 bg-[#0d1322]">
              <div className="text-xs font-bold font-mono text-slate-300 mb-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                {sec.stage}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sec.techniques.map((t) => (
                  <div key={t.id} className="bg-[#090e18] border border-slate-800 p-3 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-400 font-mono">{t.id} - {t.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{t.tactic}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{t.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
