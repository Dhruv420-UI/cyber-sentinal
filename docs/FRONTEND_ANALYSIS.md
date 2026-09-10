# CyberSentinel AI ? Master Frontend & Backend Integration Analysis

> **Platform**: CyberSentinel AI (SIH Problem Statement SIH26153)  
> **Core Innovation**: Temporal Cyber World Model ($S_t 	o P(S_{t+1} \mid S_t)$) with Autoregressive $K$-Step Forward Simulation  
> **Status**: Comprehensive Analysis & Contract Specification (Phase 1 ? Discovery & Documentation)  
> **Backend Reality**: FastAPI, PyTorch `CyberWorldModelV2`, Pydantic v2, WebSockets, SSE, Deterministic Risk & MITRE Layers  

---

## Executive Summary

This master document synthesizes the deep codebase inspection of CyberSentinel AI. The system formulates proactive cybersecurity monitoring as **temporal world modeling** rather than static flow classification. It aggregates network flows into discrete 30-second window state vectors $S_t \in \mathbb{R}^{24}$, encodes history with a Temporal Transformer, predicts latent state transitions $\hat{h}_{t+1}$, and simulates future attack campaigns $K$ steps forward ($t+1 \dots t+K$) before physical execution occurs.

This analysis details all architectural contracts, data schemas, API routes, streaming protocols, security boundaries, and gap analyses necessary to engineer a modern, production-grade frontend without breaking the backend.

---

## Index of Detailed Specification Documents

All specialized contract documents reside in the `docs/` directory of the repository:

1. [`docs/frontend-backend-contract.md`](frontend-backend-contract.md) ? Comprehensive REST API endpoint contracts, schemas, headers, status codes, and error payloads.
2. [`docs/frontend-websocket-contract.md`](frontend-websocket-contract.md) ? Real-time bidirectional WebSocket streaming protocol (`/api/v1/stream/ws`), connection limits, heartbeat, and frame specifications.
3. [`docs/frontend-sse-contract.md`](frontend-sse-contract.md) ? Unidirectional Server-Sent Events stream specification (`/api/v1/stream/events`) for firewalled SOC environments.
4. [`docs/frontend-data-model.md`](frontend-data-model.md) ? Complete TypeScript definitions, canonical schemas, the 24-D feature vector, and the 10-stage attack taxonomy.
5. [`docs/current-dashboard-analysis.md`](current-dashboard-analysis.md) ? Architectural assessment of `dashboard/index.html` and `dashboard/simulator.html`.
6. [`docs/frontend-backend-gaps.md`](frontend-backend-gaps.md) ? Explicit audit of implementation gaps, hardcoded assumptions, and mitigations.
7. [`docs/frontend-feature-map.md`](frontend-feature-map.md) ? UI feature to backend route dependency matrix.
8. [`docs/frontend-replay-contract.md`](frontend-replay-contract.md) ? Step-by-step chronological trace replay session protocol.
9. [`docs/frontend-simulator-contract.md`](frontend-simulator-contract.md) ? Mobile Traffic Simulator specification (`simulator.html`) and 6 traffic generation profiles.
10. [`docs/frontend-agent-contract.md`](frontend-agent-contract.md) ? Defensive Analyst Agent contract, grounding rules, query routing, and offline fallbacks.
11. [`docs/frontend-security.md`](frontend-security.md) ? Security boundaries, rate limiting, connection capping, payload bounds, and sanitization.
12. [`docs/frontend-environment.md`](frontend-environment.md) ? Environment variables, dynamic origin resolution, and LAN access configuration.
13. [`docs/frontend-constraints.md`](frontend-constraints.md) ? Non-negotiable architectural ground rules and fail-closed policies.
14. [`docs/frontend-build-plan.md`](frontend-build-plan.md) ? Modern React + TypeScript + Vite + Tailwind migration blueprint.
15. [`docs/frontend-design-requirements.md`](frontend-design-requirements.md) ? Enterprise SOC command center aesthetic guide and design system tokens.

---

## Core System Highlights

### 1. Three-Domain Visual Segregation
To eliminate operator confusion, the frontend strictly segregates telemetry domains:
- **Observed (Green `#10b981`)**: Historical telemetry up to window $t$.
- **Forecast (Blue `#3b82f6`)**: Calibrated prediction for window $t+1$ ($T^*=1.568$).
- **Simulated (Purple `#8b5cf6`)**: Autoregressive rollout $t+2 \dots t+K$, explicitly badged as **MODEL SIMULATION**.

### 2. Zero Hardcoding & Strict Research Honesty
Every stage prediction, transition probability, risk score, and feature attribution is computed dynamically at runtime from scaled 24-D physical state vectors. The system strictly forbids canned predictions, synthetic accuracies, or hardcoded stage sequences.

### 3. Fail-Closed Resilience
If model checkpoints, feature scalers, or telemetry flows are missing or degraded, the system emits unambiguous status codes (`MODEL_UNAVAILABLE`, `SCALER_UNAVAILABLE`, `INVALID_TELEMETRY`, `BUFFERING`) rather than mock predictions.
