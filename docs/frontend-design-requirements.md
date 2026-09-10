# CyberSentinel AI ? Design System & Visual Requirements

---

## 1. Aesthetic Direction: Enterprise SOC Command Center

- **Guiding Vision**: "Google-level clarity, Linear-level polish, modern SOC usability."
- **Explicit Prohibition**: Avoid tacky cyberpunk aesthetics, Matrix rain animations, excessive neon glow, or illegible hacker fonts. The UI must feel like a mission-critical cybersecurity defense console.
- **Background Palette**: Deep charcoal and navy hues (`#0a0d14`, `#111827`, `#1a2035`).
- **Typography**: Clean, high-legibility sans-serif (`Inter`, `SF Pro`, or `Segoe UI`) paired with crisp monospace for numbers and hashes (`Cascadia Code`, `JetBrains Mono`).

---

## 2. Color Palette & Semantic Meaning

```css
:root {
  --bg-primary: #0a0d14;
  --surface-1: #111827;
  --surface-2: #1a2035;
  --surface-3: #222e45;
  --border-subtle: #2a3550;
  
  /* Tactical Three-Domain Segmentation */
  --domain-observed: #10b981;  /* Emerald Green: Historical telemetry */
  --domain-forecast: #3b82f6;  /* Royal Blue: Next-step forecast t+1 */
  --domain-simulated: #8b5cf6; /* Electric Violet: K-step simulation */
  
  /* Risk Tiers */
  --risk-low: #10b981;
  --risk-medium: #f59e0b;
  --risk-high: #f97316;
  --risk-critical: #ef4444;
}
```

---

## 3. Micro-Interactions & UI Hierarchy
- **Status Dots**: Soft pulsing animation for active live telemetry and WebSocket connection.
- **Stage Transitions**: When a stage transition is detected, the transition arrow glows blue with a subtle pulse animation.
- **Simulation Badges**: Simulated cards feature distinct dotted borders and purple badges to ensure operators never confuse simulated trajectories with observed physical evidence.
