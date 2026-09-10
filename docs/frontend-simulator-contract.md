# CyberSentinel AI ? Mobile Traffic Simulator Contract (`dashboard/simulator.html`)

> **Target Version**: Backend v2.0 (FastAPI Stream Ingestion)  
> **Source Files Inspected**:  
> - `dashboard/simulator.html` (960 lines)  
> - `backend/api/stream_endpoints.py` (`/api/v1/stream/ingest`)  
> - `backend/schemas/stream.py`  
> - `docs/mobile_simulator_guide.md`  

---

## 1. Purpose & Demonstration Value

The Mobile Traffic Simulator allows a presenter to use a smartphone or tablet connected to the local Wi-Fi to dynamically transmit controlled synthetic network telemetry bursts to the CyberSentinel backend laptop.

### Core Value for Judges & Evaluators:
- Demonstrates real-time reactive coupling: tapping a button on a phone instantly triggers stage transitions, risk escalations, and MITRE mapping on the laptop's SOC dashboard.
- Zero Hardcoding Integrity: All synthetic flows are emitted with `label="UNKNOWN"`. The laptop backend extracts physical features, standardizes them, and runs live `CyberWorldModelV2` inference without pre-programmed scripts.

---

## 2. Ingestion Endpoint Specification

- **Endpoint**: `POST /api/v1/stream/ingest`
- **Payload Schema** (`IngestTelemetryRequest`):
```json
{
  "flows": [
    {
      "src_ip": "192.168.1.105",
      "dst_ip": "192.168.1.10",
      "src_port": 45120,
      "dst_port": 80,
      "protocol": 6,
      "packets": 8,
      "bytes": 1040,
      "duration": 0.045,
      "syn_flag": 1,
      "ack_flag": 1,
      "rst_flag": 0,
      "fin_flag": 1,
      "psh_flag": 1,
      "urg_flag": 0,
      "failed": false,
      "timestamp": 1773199800.125,
      "label": "UNKNOWN"
    }
  ],
  "session_id": "mob_7x9q2p1",
  "source_id": "MobileSim-normal",
  "k_steps": 4,
  "window_seconds": 10.0
}
```

---

## 3. The 6 Synthetic Traffic Profiles

| Profile Name | Key Profile Attributes | Target Inferred Stage |
|---|---|---|
| **Normal Traffic** | Standard HTTP/HTTPS/DNS (ports 80, 443, 53), typical packet counts (6?18), zero failed flows, balanced SYN/ACK flags. | `BENIGN` |
| **Connection Burst** | High flow rate, rapid TCP SYNs, very short durations (2?15ms), high connection concurrency. | `BENIGN` / `RECONNAISSANCE` |
| **Recon Scanning** | Broad destination port entropy (ports 1?1024), small single-packet probes (44 bytes), elevated RST flag ratio (~40%), failed connections. | `RECONNAISSANCE` |
| **Credential Access** | Repeated connection attempts targeting authentication services (ports 22 SSH, 3389 RDP, 445 SMB), high failed flow ratio (>70%), elevated RST flags. | `CREDENTIAL_ACCESS` |
| **Large Transfer** | Heavy payload volumes (400?1200 packets/flow), full MTU segment sizes (1420 bytes/pkt), sustained durations (1?4s). | `EXFILTRATION` |
| **Bot Beaconing** | Strict periodic intervals (~1.0s), uniform payload size (128 bytes), minimal flag diversity, targeting custom port (8443). | `COMMAND_AND_CONTROL` |

---

## 4. Frontend Coupling Requirements
1. Every successful call to `POST /api/v1/stream/ingest` automatically broadcasts the resulting `StreamEvent` to all connected WebSocket subscribers (`/api/v1/stream/ws`).
2. The laptop SOC dashboard immediately updates its active threat event banner, feature attribution table, and attack lifecycle stepper without requiring manual page refresh.
