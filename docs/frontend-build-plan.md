# CyberSentinel AI ? Frontend Rebuild & Migration Plan

---

## 1. Recommended Modern Technology Stack

- **Framework**: React 19 + Vite (or Next.js 15 App Router)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS v4 + CSS Variables
- **UI Components**: shadcn/ui (Radix UI primitives for accessible tabs, dialogs, dropdowns, tooltips)
- **Icons**: Lucide React (offline SVG icons)
- **State Management**: Zustand (lightweight reactive store for stream events, replay state, and agent chat)
- **Data Fetching & Cache**: TanStack Query v5 (automatic caching, background refetching, retry logic)
- **Charts & Data Viz**: Recharts or Tremor (calibrated probability bars, telemetry sparklines, feature attribution charts)
- **Animations**: Framer Motion (smooth transition between attack stages and simulation step highlights)

---

## 2. Multi-Step Migration Roadmap

### Phase 1: Project Setup & Contracts Scaffolding
- Initialize React + TypeScript + Vite project inside `frontend/` directory.
- Configure Tailwind CSS, shadcn/ui primitives, and Lucide icons.
- Import data models and TypeScript types generated in `frontend-data-model.md`.
- Set up API client with dynamic origin detection and WebSocket subscription hook.

### Phase 2: Core Command Center Layout
- Build top navigation bar with live subsystem status strip.
- Build left sidebar: Threat Status Card and Attack Lifecycle Stepper.
- Build center workspace: Active Threat Detection Banner and 7-tab navigation container.
- Build right sidebar: Dynamic Risk Escalation Meter, MITRE ATT&CK Card, and Defensive Agent Chat.

### Phase 3: Tab Views Implementation
- **Tab 1: Live Telemetry Pipeline**: 12 metric boxes with live sparklines.
- **Tab 2: Incident Progression Timeline**: Filterable chronological table with ground truth vs. forecast comparison.
- **Tab 3: K=4 Forward Simulation**: Animated autoregressive path showing simulated steps $t+1 \dots t+4$.
- **Tab 4: Feature Attribution**: Interactive delta table with color-coded directional divergence bars.
- **Tab 5: Incident Response Recommendations**: Evidence-grounded action checklist.
- **Tab 6: Empirical Benchmark**: Immutable Phase 8C Hard Holdout performance comparison table.
- **Tab 7: System Observability & Health**: Latency, throughput, socket counts, and backpressure monitors.

### Phase 4: Replay Engine & Stream Controls
- Replay controls: scenario dropdown, step button, auto-play with speed toggle, progress slider.
- Live streaming controls: NetFlow/PCAP/Replay source switcher, socket toggle.

### Phase 5: Mobile Simulator Redesign
- Responsive PWA view tailored for mobile touch screens.
- 6 traffic profile cards with vibration feedback on transmission.
- Real-time model intelligence feedback card.

### Phase 6: Production Build & Backend Integration
- Build production assets: `npm run build`.
- Serve static assets via FastAPI mounting at `/ui` or standalone Node/Vercel server.
- Verify 100% offline functionality.
