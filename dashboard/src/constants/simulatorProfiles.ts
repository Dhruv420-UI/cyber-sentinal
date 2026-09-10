export interface SimulatorProfile {
  id: string; // matches the profile id used in the UI
  name: string;
  csv: string; // path relative to the backend project root
  tag: string;
  desc: string;
}

export const SIMULATOR_PROFILES: SimulatorProfile[] = [
  {
    id: 'normal',
    name: 'Normal Background',
    csv: 'datasets/sample/trace_benign_01.csv',
    tag: 'BENIGN',
    desc: 'Standard HTTP/HTTPS/DNS traffic, typical packet counts, balanced SYN/ACK flags.',
  },
  {
    id: 'burst',
    name: 'Connection Burst',
    csv: 'datasets/sample/trace_benign_02.csv',
    tag: 'BENIGN',
    desc: 'High flow rate, rapid TCP SYNs, very short durations simulating bursty activity.',
  },
  {
    id: 'recon',
    name: 'Recon Scanning',
    csv: 'datasets/sample/trace_recon_01.csv',
    tag: 'RECON',
    desc: 'Broad destination port entropy, small probes, elevated RST flag ratio.',
  },
  {
    id: 'credential',
    name: 'Credential Access',
    csv: 'datasets/sample/trace_bruteforce_01.csv',
    tag: 'AUTH',
    desc: 'Repeated connection attempts targeting authentication services with elevated failed ratios.',
  },
  {
    id: 'exfil',
    name: 'Large Data Transfer',
    csv: 'datasets/sample/trace_exfil_01.csv',
    tag: 'EXFIL',
    desc: 'Heavy payload volumes, sustained connection durations and high outbound bytes.',
  },
  {
    id: 'beacon',
    name: 'Bot Beaconing',
    csv: 'datasets/sample/trace_lateral_01.csv',
    tag: 'C2',
    desc: 'Strict periodic intervals, uniform payload size and persistent beaconing signatures.',
  },
];
