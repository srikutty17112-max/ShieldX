# ShieldX: Voice-First AI Cybersecurity Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_(Vite)-61DAFB.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Design-TailwindCSS_Dark_Theme-06B6D4.svg)](https://tailwindcss.com)
[![AES-256](https://img.shields.io/badge/Encryption-AES--256_Field_Level-FFB703.svg)]()
[![Voice](https://img.shields.io/badge/AI_Assistant-Aegis_(EN_|_TA_|_HI)-00FF9D.svg)]()

> **ShieldX** is an enterprise-grade cybersecurity command center engineered with an autonomous dual-engine threat detector, Google Gemini AI reasoning, and **Aegis** — a voice-first AI assistant. After initial login, the platform is operable entirely by voice alone, requiring human voice authorization prior to executing simulated threat containment countermeasures.

---

## Pipeline Architecture

```
+---------------------------+       HTTPS Telemetry + API Key
| Cross-Platform Agent      | -------------------------------------\
| (Windows, Linux, macOS)   |                                       \
| Strictly READ-ONLY        |                                        v
+---------------------------+                              +-----------------------+
                                                           | Dual Detection Engine |
+---------------------------+                              | - Rule-Based (CVE)    |
| Manual Log Upload         | ---> [ FastAPI Backend ] --> | - Anomaly Baseline    |
| (.JSON or .CSV files)     |                              +-----------------------+
+---------------------------+                                          |
                                                                       v
+---------------------------+                              +-----------------------+
| Attack Simulation Drills  | ---> [ Rate Limiter    ] --> | MITRE ATT&CK Mapping  |
| (BruteForce, PortScan, ..)|      [ Field Crypto DB ]     +-----------------------+
+---------------------------+                                          |
                                                                       v
+----------------------------------------------------------------------------------+
| Aegis AI Voice Engine                                                            |
| 1. Gemini AI Analysis & Plain-Language Explanation (Offline Fallback Engine)      |
| 2. Proactive Spoken Alerts on High/Critical Threats                              |
| 3. Multi-Language Voice Support (English, Tamil, Hindi)                          |
| 4. Context-Aware Follow-Up Memory & Sentiment Urgency Modulation                 |
| 5. Emergency Voice Override ("STOP" to freeze network)                           |
| 6. Spoken Daily/Weekly Security Summary Briefings                                |
+----------------------------------------------------------------------------------+
                                       |
                                       v
                     +-----------------------------------+
                     | Explicit Operator Voice Approval   |
                     | (On-Screen Buttons Visible Fallback)
                     +-----------------------------------+
                                       |
                                       v
+----------------------------------------------------------------------------------+
| Simulated Defensive Containment Execution                                        |
| -> Immutable Audit Log Record (Actor: VOICE / UI)                                |
| -> Auto-Generated PDF Incident Investigation Report (ReportLab)                  |
| -> Geographic Radar Threat Pinning (Leaflet Map)                                 |
| -> Live Topology Network Flow Graph Visualization                                |
+----------------------------------------------------------------------------------+
```

---

## Core Capabilities

### 1. Dual Threat Detection Engine
- **Rule-Based Detection**:
  - **Brute Force Authentication**: Flagged when failed logons exceed $\ge 5$ within 60s $\rightarrow$ mapped to **MITRE T1110 (Brute Force)**.
  - **Port Scan Discovery**: Flagged when multiple unique ports ($\ge 8$) or reconnaissance scans are detected $\rightarrow$ mapped to **MITRE T1046 (Network Service Discovery)**.
  - **Data Exfiltration**: Flagged when outbound byte volume exceeds $50\text{ MB}$ or sudden spikes $\rightarrow$ mapped to **MITRE T1048 (Exfiltration Over Alternative Protocol)**.
  - **Ransomware Defense Evasion**: Flagged when Volume Shadow Copy deletion commands (`vssadmin delete shadows`, `wmic shadowcopy delete`, `.locked` extension bursts) are detected $\rightarrow$ mapped to **MITRE T1486 (Data Encrypted for Impact)**.
- **Anomaly-Based Baseline Engine**:
  - Automatically establishes a rolling statistical baseline per connected endpoint (connection rate, packet sizing, volume).
  - Flags deviations exceeding $3$ standard deviations ($>3\sigma$) as **`"Anomaly — unclassified pattern"`** in the command center.

### 2. Aegis Voice Assistant — 6 Advanced Features
1. **Multi-Language Voice Support**: English (`en-US`), Tamil (`ta-IN`), and Hindi (`hi-IN`) selectable in settings for both continuous voice recognition and spoken synthesized responses.
2. **Proactive Spoken Alerts**: When a High or Critical threat arrives, Aegis speaks up unprompted rather than waiting to be asked.
3. **Daily / Weekly Spoken Summary Briefings**: Request a vocal briefing anytime ("Aegis, give me a briefing") to hear 24-hour event metrics and defense posture.
4. **Context-Aware Follow-Up Memory**: Retains short-term conversation context so users can ask follow-ups ("What was the source IP?", "Explain the risk") without repeating details.
5. **Emergency Voice Override**: Say **"STOP"**, **"HALT"**, or **"EMERGENCY"** to immediately freeze all network traffic and quarantine affected assets.
6. **Sentiment-Aware Tone Calming**: Frantic or urgent speech triggers Aegis to modulate pitch, speed, and phrasing into a calm, steady, reassuring tone.

### 3. Cross-Platform Read-Only Agent (`shieldx_agent.py`)
- **Zero External Pip Dependencies**: Written entirely in standard library Python (`urllib.request`, `platform`, `subprocess`, `json`, `socket`).
- **Strictly Read-Only**: Inspects only standard OS authentication logs without ever modifying, executing, or deleting host files:
  - **Windows**: Windows Event Log Event ID 4625 (Failed Logon) and 4624 (Logon).
  - **Linux**: `/var/log/auth.log` or `/var/log/secure` or `journalctl`.
  - **macOS**: Unified logging via `log show`.
- **Zero-Copy Config Bundle**: Downloads `shieldx_config.json` containing the pre-authenticated per-user API key directly from the dashboard.

---

## Security & Cryptographic Guarantees

- **AES-256 Field-Level Encryption**: Per-user API keys and OAuth tokens are encrypted using `Fernet` (AES-256 in CBC mode with HMAC-SHA256) before insertion into the database.
- **Automated Key Rotation Policy**: Built-in CLI rotation utility (`backend/scripts/rotate_keys.py`) automatically re-encrypts all database records with a new key and generates an audit row.
- **Bcrypt Salted Passwords**: Passwords hashed with high-cost salt. OAuth users (Google / Apple) never store a local password at all.
- **Rate-Limiting Middleware**: Sliding-window rate limiters defend `/api/v1/telemetry/ingest` and `/api/v1/auth` from flooding.
- **CORS Protection**: Locked strictly to verified frontend origins via `CORS_ORIGINS`.

---

## Quickstart (Run Locally)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Configure Environment
```bash
# Clone the repository
git clone https://github.com/vasan-s/ShieldX.git
cd ShieldX

# Copy environment variables
copy .env.example .env   # Windows
# or: cp .env.example .env # Linux / Mac
```

### 2. Backend Setup
```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Run automated tests
pytest -v tests/test_shieldx.py

# Start the FastAPI server
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API interactive documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Running the Read-Only Agent
1. Open the ShieldX dashboard, navigate to **Agent** tab.
2. Click **Provision Device** $\rightarrow$ click **Download shieldx_config.json** and **Download shieldx_agent.py**.
3. Place both files in a folder on your Windows/Linux/Mac machine:
```bash
python shieldx_agent.py
```

---

## Deployment Guide

### Deploy Backend to Render.com
1. Create a new Web Service on [Render.com](https://render.com) connected to your repository.
2. Choose **Python** runtime.
3. Configure settings:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, configure:
   - `ENVIRONMENT` = `production`
   - `CORS_ORIGINS` = `https://your-shieldx-frontend.vercel.app`
   - `DATABASE_URL` = Connect to Render PostgreSQL or use default SQLite
   - `ENCRYPTION_KEY` = `generate a 32-byte urlsafe Fernet key`
   - `JWT_SECRET` = `generate a random 32-byte hex string`
   - `GEMINI_API_KEY` = `your Google AI Gemini API key`
   - `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` (optional)
   - `APPLE_OAUTH_CLIENT_ID` / `APPLE_OAUTH_CLIENT_SECRET` (optional)

### Deploy Frontend to Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Deploy! Vercel will build using `frontend/vercel.json` and host your command center.

---

## OAuth Setup Guide (Google & Apple)

### Setting Up "Sign in with Google"
1. Visit the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add Authorized JavaScript origins:
   - `http://localhost:5173` (local development)
   - `https://your-shieldx-frontend.vercel.app` (production)
4. Copy the **Client ID** and **Client Secret** into your `.env` as `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

### Setting Up "Sign in with Apple"
1. Visit the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId).
2. Register a new **Services ID** (e.g. `com.shieldx.web.service`).
3. Enable **Sign In with Apple**, configure your domains and return URLs.
4. Copy the identifier and generated private key into `.env` under `APPLE_OAUTH_CLIENT_ID` and `APPLE_OAUTH_CLIENT_SECRET`.

---

## Cryptographic Key Rotation Utility

To rotate database encryption keys every 30 days:
```bash
python backend/scripts/rotate_keys.py
```
This utility:
1. Generates a fresh 32-byte url-safe Fernet key.
2. Decrypts all existing device keys and OAuth tokens using the old key.
3. Re-encrypts all database records with the new key in a single atomic transaction.
4. Appends an audit entry into `key_rotation_audits`.
5. Prompts you to update `ENCRYPTION_KEY` in your production environment.

---

## Website Footer & Connect

*Styled in accordance with Cursor's multi-column footer architecture:*

- **Product**: Features, Voice Assistant, Pricing, Security
- **Resources**: Documentation, Download Agent, FAQ, Community, Status
- **Company**: About ShieldX, Contact, Blog
- **Legal**: Terms of Service, Privacy Policy, Acceptable Use Policy, Data Use, Security
- **Connect**:
  - Email: [srikutty9080@gmail.com](mailto:srikutty9080@gmail.com)
  - Instagram: [@_vasan__18](https://instagram.com/_vasan__18)
  - LinkedIn: [https://www.linkedin.com/in/vasan-s-profile](https://www.linkedin.com/in/vasan-s-profile)

&copy; 2026 ShieldX. All rights reserved.
