"""
CyberSentinel AI — Defensive Agent (Phase 10 & Gemini Integration).

Orchestrates analyst queries against deterministic ML tools and Gemini API.

DESIGN PRINCIPLES:
  1. The LLM is NOT the detector. CyberWorldModelV2 detects and forecasts threats.
  2. The LLM NEVER invents: stages, probabilities, MITRE IDs, feature changes.
  3. All facts come from structured telemetry & tool output FIRST.
  4. The LLM's role: explain, contextualize, prioritize, and recommend mitigations.
  5. Backend priority:
     1. Gemini API (when GEMINI_API_KEY is configured in backend environment)
     2. Ollama (local LLM — offline fallback)
     3. Deterministic template fallback (always available, guaranteed zero hallucination)
  6. Grounding structure: clearly distinguishes [OBSERVED], [FORECAST], and [RECOMMENDATION].
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple

try:
    import dotenv
    _current_dir = Path(__file__).resolve().parent
    dotenv.load_dotenv(_current_dir.parent.parent / ".env")
    dotenv.load_dotenv(_current_dir.parent / ".env")
    dotenv.load_dotenv()
except Exception:
    pass

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client & integration
# ---------------------------------------------------------------------------

_DEFAULT_GEMINI_MODEL = "gemini-3.6-flash"
_FALLBACK_GEMINI_MODEL = "gemini-3.5-flash-lite"


def _get_gemini_client() -> Tuple[Optional[Any], str]:
    """
    Initialize Google GenAI client if GEMINI_API_KEY is available in the backend environment.
    Returns (client, model_name) or (None, '').
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, ""

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=25000))
        model = os.environ.get("GEMINI_MODEL", _DEFAULT_GEMINI_MODEL).strip() or _DEFAULT_GEMINI_MODEL
        return client, model
    except Exception as exc:
        logger.error("Failed to initialize Google GenAI client: %s", exc)
        return None, ""


def _call_gemini(client: Any, model: str, prompt: str, system_instruction: str) -> str:
    """
    Call Gemini API using the official google-genai SDK.
    Includes automated fallback to gemini-3.5-flash-lite if primary model encounters error.
    """
    from google.genai import types

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.3,
        max_output_tokens=1500,
    )

    models_to_try = [model]
    if _FALLBACK_GEMINI_MODEL not in models_to_try:
        models_to_try.append(_FALLBACK_GEMINI_MODEL)
    if "gemini-flash-latest" not in models_to_try:
        models_to_try.append("gemini-flash-latest")

    last_exc = None
    for target_model in models_to_try:
        try:
            logger.info("Calling Gemini API with model: %s", target_model)
            resp = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config,
            )
            if resp and resp.text:
                return resp.text.strip()
        except Exception as exc:
            logger.warning("Gemini call with model %s failed: %s", target_model, exc)
            last_exc = exc
            continue

    if last_exc:
        raise last_exc
    return ""


# ---------------------------------------------------------------------------
# Ollama client (offline optional)
# ---------------------------------------------------------------------------

def _check_ollama_available() -> Tuple[bool, str]:
    """Check if Ollama is running locally. Returns (available, model_name)."""
    try:
        import requests
        resp = requests.get("http://localhost:11434/api/tags", timeout=1.5)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            if models:
                preferred = ["llama3.2", "llama3", "mistral", "gemma2", "phi3", "llama2"]
                names = [m.get("name", "").split(":")[0] for m in models]
                for p in preferred:
                    if p in names:
                        return True, p
                return True, models[0].get("name", "unknown")
        return False, ""
    except Exception:
        return False, ""


def _ollama_generate(model: str, prompt: str, system: str) -> str:
    """Call Ollama /api/generate endpoint."""
    import requests
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 450},
    }
    resp = requests.post("http://localhost:11434/api/generate", json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


# ---------------------------------------------------------------------------
# Query routing (keyword-based intent classification)
# ---------------------------------------------------------------------------

_ROUTE_PATTERNS = {
    "threat_rationale":  [r"why.*(threat|considered|dangerous|harmful|malicious|risky)", r"what makes this (a )?threat"],
    "defensive_actions": [r"defensive action", r"what (defensive|countermeasures?|mitigation)", r"defensive responses?"],
    "prioritize":        [r"what should i prioritize", r"what.*prioritize", r"how to prioritize"],
    "investigate":       [r"investigate|what should the analyst|what should i investigate", r"analyst.*investigate", r"action.*analyst"],
    "evidence":          [r"evidence|what evidence|supports? this prediction|attribution"],
    "incident_summary":  [r"summarize|summary|executive summary|incident overview|briefing|simple terms"],
    "current_state":     [r"what.*(happening|going on|current|right now|is it)", r"status"],
    "forecast":          [r"what.*(happen|next|likely|predict|coming|expect)", r"forecast", r"future"],
    "transition":        [r"transition", r"stage.*(change|shift)", r"moving to"],
    "features":          [r"why|reason|indicator|feature|signal|change|because"],
    "mitre":             [r"mitre|att.?ck|technique|tactic|T\d{4}"],
    "confidence":        [r"confident|certain|sure|probability|how (likely|sure|confident)"],
    "risk":              [r"risk|urgent|severity|dangerous|threat level|how (bad|serious|dangerous)"],
    "rollout":           [r"k=|rollout|simulate|next (2|3|4|five|four|three)|future (states?|steps?)"],
    "metrics":           [r"benchmark|metric|accuracy|performance|compare|better|gru|logistic|baseline"],
}


def _route_query(query: str) -> str:
    """Classify analyst query into one of the routing categories."""
    q = query.lower()
    for route, patterns in _ROUTE_PATTERNS.items():
        for p in patterns:
            if re.search(p, q):
                return route
    return "current_state"


# ---------------------------------------------------------------------------
# System Prompt & Context Builder
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are CyberSentinel AI Analyst — an intelligent cybersecurity SOC copilot embedded in the CyberSentinel cyber-defense platform.

## Behavior Rules

### Rule 1: Conversational by default
Answer questions naturally and conversationally. Be concise. Do NOT always produce long structured reports.

### Rule 2: Two modes

**Mode A — General / off-topic questions** (e.g. "What's the weather?", "Explain Python", "Tell me a joke"):
- Answer naturally and helpfully as a knowledgeable assistant.
- Do NOT force the answer into [OBSERVED] / [FORECAST] / [RECOMMENDATION] sections.
- Do NOT invent CyberSentinel telemetry to fill those sections.
- If you genuinely cannot help (e.g. you need real-time data you don't have), say so honestly and briefly.

**Mode B — CyberSentinel / cybersecurity questions** (e.g. "What's happening right now?", "Why is the risk high?", "What should I investigate?"):
- Use the structured CyberSentinel context provided below the system prompt.
- Explain the current security situation using the actual values from that context.
- Use markdown headings **[OBSERVED]**, **[FORECAST]**, **[RECOMMENDATION]** only when they genuinely help structure the answer.
- For brief/simple CyberSentinel questions, a conversational prose answer is fine — you do NOT have to use all three sections every time.

### Rule 3: Zero hallucination
- NEVER invent attack stages, risk scores, probabilities, MITRE IDs, CVE numbers, or telemetry values.
- If the CyberSentinel context says "NO ACTIVE TELEMETRY", tell the analyst that no active session is running and suggest starting a replay or simulator scenario.
- If a field is not in the context, say it's not available — do not fabricate it.

### Rule 4: Clearly separate facts from forecasts
- Observed stage and telemetry = confirmed facts from the monitoring system.
- Predicted next stage, transition probability = CyberWorldModelV2 neural forecasts, not certainties.
- Always label predictions as predictions. "The model forecasts..." not "The next stage is...".

### Rule 5: Preserve conversation context
- Use the conversation history to understand follow-up questions.
- "Why?" after a CyberSentinel answer → explain the CyberSentinel reasoning further.
- "Explain that simply." → rephrase your previous answer in plain language.
- "What changed?" → refer to the feature divergence vectors in context.

### Rule 6: Attribution
- Attribute neural predictions to CyberWorldModelV2.
- Attribute MITRE technique mappings to MITRE ATT&CK Enterprise v14 static mapping.
- Do NOT attribute facts to yourself.
"""



# ---------------------------------------------------------------------------
# Query intent classifier  (cybersecurity vs. general)
# ---------------------------------------------------------------------------

_CYBER_KEYWORDS = re.compile(
    r'\b('
    r'happening|going on|right now|current(ly)?|status'
    r'|risk|threat|dangerous|malicious|attack|stage|stag(e|es)'
    r'|predict|forecast|next stage|transition|lateral|recon|exfil|dos|c2|benign'
    r'|investigate|investigation|analyst|soc|incident|alert|anomal'
    r'|mitre|att.?ck|technique|tactic|T\d{4}'
    r'|telemetry|flow|netflow|packet|window|session|replay|simulator'
    r'|confidence|probability|risk score|entropy|brier|accuracy'
    r'|cybersentinel|cyber.?sentinel|worldmodel|world model'
    r'|firewall|ids|ips|endpoint|isolat|quarantin|playbook|mitigat|countermeasure'
    r'|what changed|what.s changed|feature|divergence|vector|indicator|signal'
    r')\b',
    re.IGNORECASE,
)

_GENERAL_OVERRIDES = re.compile(
    r'\b(weather|forecast for tomorrow|temperature outside'
    r'|python|javascript|typescript|c\+\+|rust\b|golang|ruby|php|java\b'
    r'|recursion|algorithm|sorting|binary tree|linked list|dynamic programming'
    r'|joke|pun|poem|story|recipe|cooking|cook|music|song|movie|sport'
    r'|who invented|who created|history of|what is [a-z0-9_-]+\?*$'
    r'|what does .* mean|dns\b|internet\b'
    r'|capital of|president|prime minister|country|language'
    r'|math|calculus|physics|chemistry|biology'
    r')\b',
    re.IGNORECASE,
)


def _is_cybersentinel_query(query: str) -> bool:
    """
    Return True if the query is about CyberSentinel / cybersecurity topics.
    Return False for general / off-topic questions.

    A short ambiguous follow-up like "why?" or "explain that" is treated as
    a CyberSentinel question so we preserve the right conversation mode.
    """
    q = query.strip()
    # Very short follow-ups: assume they continue the security conversation
    if len(q.split()) <= 4 and not _GENERAL_OVERRIDES.search(q):
        return True
    # Explicit general topic overrides
    if _GENERAL_OVERRIDES.search(q) and not _CYBER_KEYWORDS.search(q):
        return False
    # Keyword match
    if _CYBER_KEYWORDS.search(q):
        return True
    # Default: treat as general if nothing matches
    return False


def _build_agent_prompt(
    query: str,
    fc: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
    live_event: Optional[Dict[str, Any]] = None,
    is_cyber: bool = True,
) -> str:
    """
    Assemble the prompt for Gemini or Ollama.

    For general questions (is_cyber=False): only conversation history + question,
    no security context block, no forced-format suffix.

    For CyberSentinel questions (is_cyber=True): full grounded telemetry context
    + conversation history + question with a neutral ask suffix.
    """
    # -- History block (shared by both modes) --------------------------------
    history_lines: List[str] = []
    if history:
        for turn in history[-8:]:
            role = turn.get("role", "")
            content = turn.get("content", "").strip()
            if not content:
                continue
            if role in ("analyst", "user"):
                history_lines.append(f"Analyst: {content}")
            elif role in ("agent", "assistant", "system"):
                history_lines.append(f"CyberSentinel AI: {content}")

    prompt_parts: List[str] = []

    # -- General question mode -----------------------------------------------
    if not is_cyber:
        if history_lines:
            prompt_parts.append(
                "=== RECENT CONVERSATION HISTORY ===\n"
                + "\n".join(history_lines)
                + "\n=== END HISTORY ==="
            )
        prompt_parts.append(f"User question: {query}")
        return "\n\n".join(prompt_parts)

    # -- CyberSentinel question mode -----------------------------------------
    merged: Dict[str, Any] = {}
    if live_event:
        merged.update(live_event)
    if fc:
        merged.update(fc)

    has_active_state = bool(
        merged.get("current_stage")
        or merged.get("flow_count")
        or (merged.get("risk_score") is not None and merged.get("risk_score") > 0)
    )

    context_lines: List[str] = []
    if not has_active_state:
        context_lines.append("=== RUNTIME STATUS: NO ACTIVE TELEMETRY OR INFERENCE SESSION ===")
        context_lines.append(
            "Current State: Idle / Standby. No real-time network flows or inference results have been ingested yet.\n"
            "Platform Capabilities: CyberSentinel monitors 24-dimensional NetFlow telemetry vectors across 30-second sliding windows. "
            "It runs CyberWorldModelV2 (97.73% Next-Stage Top-1 accuracy, 83.33% Transition accuracy, Brier=0.0452) to forecast multi-stage attack transitions and simulate forward trajectories.\n"
            "Action Guidance: Inform the analyst that no active session or telemetry inference is running right now. "
            "Suggest starting a scenario replay (e.g. 'trace_multistage_03' or 'trace_recon_01') in the Replay or Simulator tab."
        )
        context_lines.append("=== END STATUS ===")
    else:
        cur = merged.get("current_stage", "UNKNOWN")
        nxt = merged.get("predicted_next_stage", "UNKNOWN")
        conf = float(merged.get("confidence") or 0.0)
        atk = float(merged.get("attack_probability") or 0.0)
        trans = bool(merged.get("transition_detected", False))
        trans_prob = float(merged.get("transition_probability") or (conf if trans else 0.0))
        risk = merged.get("risk_level", "UNKNOWN")
        score = float(merged.get("risk_score") or 0.0)
        prio = merged.get("recommended_priority", "Standard monitoring")
        tid = merged.get("primary_technique_id") or "None"
        tname = merged.get("primary_technique_name") or "None"
        hint = merged.get("time_to_transition_hint", "")
        narrative = merged.get("explanation_narrative", "")
        cal_temp = float(merged.get("calibrated_temperature") or merged.get("temperature", 1.5680))
        flows = merged.get("flow_count", "N/A")
        fps = merged.get("flows_per_second", "N/A")
        source = merged.get("source_id", "N/A")
        win_id = merged.get("window_id", "N/A")

        feats = merged.get("top_features", []) or merged.get("stage_relevant_features", [])
        rollout = merged.get("rollout_steps", [])
        mitre_list = merged.get("mitre_techniques", [])
        raw_telem = merged.get("telemetry_features") or {}

        context_lines.append("=== STRUCTURED CYBERSENTINEL RUNTIME CONTEXT (DO NOT OVERRIDE OR INVENT) ===")
        context_lines.append(f"Window ID: {win_id} | Source: {source} | Flow Count: {flows} | Flows/sec: {fps}")
        context_lines.append(f"Current Observed Stage: {cur} (Attack Probability: {atk:.1%})")
        context_lines.append(f"Predicted Next Stage: {nxt} (Confidence: {conf:.1%}, Calibrated Temp T={cal_temp:.4f})")
        context_lines.append(f"Stage Transition Detected: {trans} (Transition Probability: {trans_prob:.1%})")
        context_lines.append(f"Operational Risk Level: {risk} | Risk Score: {score:.0f}/100")
        context_lines.append(f"Recommended Analyst Priority: {prio}")
        context_lines.append(f"Time-to-Transition Hint: {hint}")
        context_lines.append(f"Primary MITRE ATT&CK: {tid} — {tname}")

        if mitre_list:
            m_strs = [f"{m.get('technique_id')}: {m.get('name')} ({m.get('tactic')})" for m in mitre_list[:4]]
            context_lines.append(f"Associated MITRE Techniques: {'; '.join(m_strs)}")

        if narrative:
            context_lines.append(f"Physics Engine Narrative: {narrative}")

        if feats:
            feat_strs = []
            for f in feats[:4]:
                fname = f.get("feature", "feature")
                c_val = f.get("current", 0.0)
                p_val = f.get("predicted", 0.0)
                chg = f.get("rel_change_pct", 0.0)
                feat_strs.append(f"  • {fname}: baseline={c_val:.3f} → predicted={p_val:.3f} ({chg:+.1f}% shift)")
            context_lines.append("Physical State Divergence Vectors (|S_hat_{t+1} - S_t|):\n" + "\n".join(feat_strs))

        if raw_telem:
            sample_keys = list(raw_telem.keys())[:6]
            telem_strs = [f"{k}={raw_telem[k]}" for k in sample_keys]
            context_lines.append(f"Key Telemetry Metrics: {', '.join(telem_strs)}")

        if rollout:
            rollout_strs = [f"Step {r.get('step', i+1)}: {r.get('predicted_stage')} ({float(r.get('confidence', 0)):.0%})" for i, r in enumerate(rollout)]
            context_lines.append(f"K={len(rollout)} Forward Trajectory Rollout (Simulated by CyberWorldModelV2): {' → '.join(rollout_strs)}")

        context_lines.append("=== END STRUCTURED CONTEXT ===")

    prompt_parts.append("\n".join(context_lines))

    if history_lines:
        prompt_parts.append(
            "\n=== RECENT CONVERSATION HISTORY ===\n"
            + "\n".join(history_lines)
            + "\n=== END HISTORY ==="
        )

    # Neutral suffix — does NOT mandate [OBSERVED]/[FORECAST]/[RECOMMENDATION]
    prompt_parts.append(f"\nAnalyst Question: {query}\n\nAnswer using the CyberSentinel context above. Be concise and accurate.")

    return "\n\n".join(prompt_parts)



# ---------------------------------------------------------------------------
# Deterministic template fallback
# ---------------------------------------------------------------------------

def _template_answer(route: str, fc: Dict[str, Any], query: str) -> str:
    """
    Build a grounded natural-language answer from structured forecast fields only.
    Adheres strictly to [OBSERVED], [FORECAST], and [RECOMMENDATION] structure.
    """
    if route != "metrics" and (not fc or "current_stage" not in fc):
        return (
            "### [OBSERVED]\n"
            "- **Status**: No active telemetry stream or inference results currently active.\n"
            "- **Telemetry**: 0 flows received in current buffer.\n\n"
            "### [FORECAST]\n"
            "- **Model**: CyberWorldModelV2 is loaded and awaiting NetFlow state sequences.\n"
            "- **Benchmark**: Next-stage Top-1 accuracy: 97.73%, Transition accuracy: 83.33%, Brier: 0.0452.\n\n"
            "### [RECOMMENDATION]\n"
            "1. Navigate to the **Replay** or **Simulator** tab.\n"
            "2. Select a scenario trace (e.g. `trace_multistage_03` or `trace_recon_01`) and start playback.\n"
            "3. Alternatively, stream live NetFlow CSV telemetry to observe real-time predictions."
        )

    cur = fc.get("current_stage", "BENIGN")
    nxt = fc.get("predicted_next_stage", "BENIGN")
    conf = float(fc.get("confidence") or 0.0)
    atk = float(fc.get("attack_probability") or 0.0)
    trans = bool(fc.get("transition_detected", False))
    risk = fc.get("risk_level", "LOW")
    score = float(fc.get("risk_score") or 0.0)
    tid = fc.get("primary_technique_id") or "N/A"
    tname = fc.get("primary_technique_name") or "Unmapped"
    hint = fc.get("time_to_transition_hint", "")
    priority = fc.get("recommended_priority", "Standard operational monitoring")
    unc = float(fc.get("uncertainty_entropy") or 0.0)
    narrative = fc.get("explanation_narrative", "")
    rollout = fc.get("rollout_steps", [])
    feats = fc.get("top_features", []) or fc.get("stage_relevant_features", [])
    cal_temp = float(fc.get("calibrated_temperature") or fc.get("temperature", 1.5680))
    flows = fc.get("flow_count", "active")

    feat_lines = []
    if feats:
        for f in feats[:3]:
            feat_lines.append(f"  - **{f['feature']}**: {f['current']:.3f} → {f['predicted']:.3f} ({f['rel_change_pct']:+.1f}% shift)")
    feat_text = "\n".join(feat_lines) if feat_lines else "  - Physical state metrics stable within baseline bounds."

    rollout_text = " → ".join(f"**{r.get('predicted_stage')}** ({float(r.get('confidence', 0)):.0%})" for r in rollout) if rollout else "Single-window forecast only"

    if route == "current_state":
        return (
            f"### [OBSERVED]\n"
            f"- Current verified network stage: **{cur}**.\n"
            f"- Attack probability in current window: **{atk:.1%}**.\n"
            f"- Active flow monitoring: {flows} flows evaluated.\n\n"
            f"### [FORECAST]\n"
            f"- Predicted next stage: **{nxt}** (Confidence: **{conf:.1%}**, Calibrated T={cal_temp:.4f}).\n"
            f"- Stage transition status: **{'TRANSITION IMMINENT' if trans else 'STABLE CONTINUATION'}**.\n"
            f"- Physical divergence:\n{feat_text}\n\n"
            f"### [RECOMMENDATION]\n"
            f"- Operational Risk: **{risk}** (Score: {score:.0f}/100).\n"
            f"- Priority: {priority}.\n"
            f"- Mitigations: Cross-reference MITRE technique **{tid}** ({tname})."
        )

    elif route in ("threat_rationale", "risk"):
        return (
            f"### [OBSERVED]\n"
            f"- Monitored Stage: **{cur}** with an attack probability of **{atk:.1%}**.\n"
            f"- Operational Risk Score: **{score:.0f}/100** categorized as **{risk}** severity.\n\n"
            f"### [FORECAST]\n"
            f"- Model projects advancement to **{nxt}** with **{conf:.1%}** confidence.\n"
            f"- Time horizon hint: {hint or 'Within next 30-60s window'}.\n"
            f"- Autoregressive trajectory: {rollout_text}.\n\n"
            f"### [RECOMMENDATION]\n"
            f"- Action: {priority}.\n"
            f"- Deploy detection rules targeting MITRE **{tid}** ({tname}).\n"
            f"- Inspect network interfaces exhibiting sharp variance in `{feats[0]['feature'] if feats else 'traffic volume'}`."
        )

    elif route in ("forecast", "transition"):
        return (
            f"### [OBSERVED]\n"
            f"- Present state baseline: **{cur}**.\n\n"
            f"### [FORECAST]\n"
            f"- CyberWorldModelV2 forecasts a transition to **{nxt}** (Confidence: **{conf:.1%}**, T={cal_temp:.4f}).\n"
            f"- Transition Detected: **{'YES — genuine transition predicted' if trans else 'NO — stage continuing'}**.\n"
            f"- Uncertainty Entropy: **{unc:.3f}**.\n"
            f"- Simulated K-step Rollout: {rollout_text}.\n\n"
            f"### [RECOMMENDATION]\n"
            f"- Preemptively stage firewall and IDS rules for **{nxt}**.\n"
            f"- Priority: {priority}."
        )

    elif route in ("investigate", "defensive_actions", "prioritize"):
        return (
            f"### [OBSERVED]\n"
            f"- Active threat indicators identified under **{cur}** (Attack Probability: {atk:.1%}).\n"
            f"- Key state divergence:\n{feat_text}\n\n"
            f"### [FORECAST]\n"
            f"- Attack progression forecast: **{cur} → {nxt}** ({conf:.1%} confidence).\n"
            f"- Risk escalation: **{risk}** ({score:.0f}/100).\n\n"
            f"### [RECOMMENDATION]\n"
            f"1. **Isolate Affected Endpoints**: Restrict outbound traffic matching anomalous flows.\n"
            f"2. **Audit Telemetry Shifts**: Investigate `{feats[0]['feature'] if feats else 'connection counts'}` spikes.\n"
            f"3. **Deploy MITRE Playbook**: Activate playbook for **{tid}** ({tname}).\n"
            f"4. **Analyst Priority**: {priority}."
        )

    elif route == "incident_summary":
        return (
            f"### [OBSERVED]\n"
            f"- Telemetry indicates network activity in the **{cur}** phase (Attack Probability: {atk:.1%}).\n\n"
            f"### [FORECAST]\n"
            f"- Neural World Model predicts subsequent progression to **{nxt}** with {conf:.1%} confidence.\n"
            f"- Projected attack path: {rollout_text}.\n\n"
            f"### [RECOMMENDATION]\n"
            f"- Severity: **{risk}** ({score:.0f}/100).\n"
            f"- Target MITRE Technique: **{tid}** — {tname}.\n"
            f"- Action: {priority}."
        )

    elif route == "evidence":
        return (
            f"### [OBSERVED]\n"
            f"- Evaluated physical telemetry divergence vectors (|S_hat_{{t+1}} - S_t|):\n{feat_text}\n\n"
            f"### [FORECAST]\n"
            f"- Forecasted state **{nxt}** driven by state divergence with **{conf:.1%}** confidence.\n"
            f"- Physics Narrative: {narrative or 'Autoregressive state transition across latent dimension.'}\n\n"
            f"### [RECOMMENDATION]\n"
            f"- Verify endpoint logs against the predicted divergence features.\n"
            f"- Priority: {priority}."
        )

    elif route == "metrics":
        return (
            f"### [OBSERVED]\n"
            f"- Hard Multi-Stage Holdout Benchmark (N=44, 6 genuine attack transitions):\n\n"
            f"| Model | Top-1 Accuracy | Transition Accuracy | Brier Score |\n"
            f"| :--- | :--- | :--- | :--- |\n"
            f"| **CyberWorldModelV2** | **97.73%** | **83.33%** | **0.0452** |\n"
            f"| Temporal GRU | 81.82% | 66.67% | 0.2913 |\n"
            f"| Logistic Regression | 50.00% | 0.00% | 0.7206 |\n\n"
            f"### [FORECAST]\n"
            f"• CyberWorldModelV2 provides significantly superior early transition detection (+16.66% over GRU) with calibrated probabilities.\n\n"
            f"### [RECOMMENDATION]\n"
            f"• Use calibrated model confidence (T={cal_temp:.4f}) directly in automated SOAR playbooks."
        )

    # Fallback
    return _template_answer("current_state", fc, query)


# ---------------------------------------------------------------------------
# MITRE Sanitizer Guard
# ---------------------------------------------------------------------------

_KNOWN_MITRE_IDS = {
    "T1046", "T1595", "T1059", "T1203", "T1021", "T1078", "T1041",
    "T1567", "T1048", "T1498", "T1499", "T1071", "T1571", "T1003",
    "T1055", "T1082", "T1083", "T1090", "T1070", "T1110", "T1190"
}


def _sanitize_mitre_output(text: str, fc: Dict[str, Any]) -> str:
    """
    Remove any MITRE IDs from output that are hallucinated or ungrounded.
    """
    known_ids = set(_KNOWN_MITRE_IDS)
    if fc:
        for t in fc.get("mitre_techniques", []):
            tid = t.get("technique_id")
            if tid:
                known_ids.add(tid)
        primary = fc.get("primary_technique_id")
        if primary:
            known_ids.add(primary)

    found = set(re.findall(r'\bT\d{4}(?:\.\d{3})?\b', text))
    hallucinated = found - known_ids
    if hallucinated:
        logger.warning("Redacting hallucinated MITRE IDs %s", hallucinated)
        for hid in hallucinated:
            text = text.replace(hid, "[TECHNIQUE_UNVERIFIED]")
    return text


# ---------------------------------------------------------------------------
# CyberSentinelDefensiveAgent
# ---------------------------------------------------------------------------

class CyberSentinelDefensiveAgent:
    """
    Orchestrates analyst queries against deterministic ML tools, Gemini API, and Ollama.

    Priority:
      1. Gemini API (when GEMINI_API_KEY is configured in backend environment)
      2. Ollama (local offline LLM if running)
      3. Deterministic template fallback (always available, guaranteed zero hallucination)
    """

    def __init__(self) -> None:
        self._ollama_available: Optional[bool] = None
        self._ollama_model: str = ""

    @property
    def gemini_available(self) -> bool:
        """Check if GEMINI_API_KEY is configured in the backend environment."""
        return bool(os.environ.get("GEMINI_API_KEY", "").strip())

    def _ensure_ollama_checked(self) -> None:
        if self._ollama_available is None:
            self._ollama_available, self._ollama_model = _check_ollama_available()
            if self._ollama_available:
                logger.info("Ollama available with model: %s", self._ollama_model)
            else:
                logger.debug("Ollama not available.")

    def answer(
        self,
        query: str,
        current_forecast: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        live_event: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Answer an analyst question strictly grounded in structured model & telemetry output
        when related to CyberSentinel, or naturally/conversationally when general.
        """
        self._ensure_ollama_checked()
        fc = current_forecast or {}
        tools_used: List[str] = []

        is_cyber = _is_cybersentinel_query(query)
        route = _route_query(query)

        if is_cyber:
            tools_used.append(f"route_classifier:{route}")
            route_to_tools = {
                "current_state":    ["get_current_state"],
                "forecast":         ["get_attack_forecast"],
                "transition":       ["get_transition_analysis"],
                "features":         ["get_feature_importance"],
                "evidence":         ["get_feature_importance", "get_attack_forecast"],
                "threat_rationale": ["get_current_state", "get_risk_assessment"],
                "defensive_actions":["get_risk_assessment", "get_mitre_mapping"],
                "prioritize":       ["get_risk_assessment"],
                "incident_summary": ["get_current_state", "get_attack_forecast", "get_risk_assessment"],
                "mitre":            ["get_mitre_mapping"],
                "confidence":       ["get_attack_forecast"],
                "risk":             ["get_risk_assessment"],
                "rollout":          ["get_rollout"],
                "metrics":          ["get_model_metrics"],
                "investigate":      ["get_attack_forecast", "get_feature_importance",
                                     "get_mitre_mapping", "get_risk_assessment"],
            }
            tools_used.extend(route_to_tools.get(route, ["get_current_state"]))
        else:
            tools_used.append("conversational_agent")

        answer_text = ""
        backend = "template_fallback"

        # 1. Primary: Gemini API
        if self.gemini_available:
            try:
                gemini_client, model_name = _get_gemini_client()
                if gemini_client is not None:
                    prompt = _build_agent_prompt(
                        query, fc, history=history, live_event=live_event, is_cyber=is_cyber
                    )
                    answer_text = _call_gemini(gemini_client, model_name, prompt, _SYSTEM_PROMPT)
                    if answer_text:
                        backend = f"gemini:{model_name}"
                        if is_cyber:
                            answer_text = _sanitize_mitre_output(answer_text, fc)
                        logger.info("Generated answer via %s (%d chars)", backend, len(answer_text))
            except Exception as exc:
                logger.warning("Gemini query failed: %s. Proceeding to fallback...", exc)
                answer_text = ""

        # 2. Secondary: Ollama (if Gemini wasn't configured or failed)
        if not answer_text and self._ollama_available and fc:
            try:
                prompt = _build_agent_prompt(
                    query, fc, history=history, live_event=live_event, is_cyber=is_cyber
                )
                answer_text = _ollama_generate(self._ollama_model, prompt, _SYSTEM_PROMPT)
                if answer_text:
                    backend = f"ollama:{self._ollama_model}"
                    if is_cyber:
                        answer_text = _sanitize_mitre_output(answer_text, fc)
                    logger.info("Generated answer via %s", backend)
            except Exception as exc:
                logger.warning("Ollama query failed: %s", exc)
                answer_text = ""

        # 3. Tertiary: Fallback
        if not answer_text:
            if not is_cyber:
                answer_text = "Gemini is currently unavailable, so I can't answer general questions right now."
                backend = "gemini_unavailable_fallback"
            else:
                answer_text = _template_answer(route, fc, query)
                backend = "template_fallback"

        return {
            "answer": answer_text,
            "tool_calls": tools_used,
            "provenance": "CyberSentinel_defensive_agent",
            "llm_backend": backend,
            "grounded_in_model_output": is_cyber,
        }
