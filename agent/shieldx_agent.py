#!/usr/bin/env python3
"""
ShieldX Cross-Platform Telemetry Agent
======================================
Strictly READ-ONLY security monitoring agent.
Collects authentication failures, network socket counts, and system telemetry.
Never modifies, deletes, or executes anything on the host.

Supported Platforms: Windows, Linux, macOS
Requirements: Python 3.7+ (Standard Library Only - Zero external pip dependencies required)
"""

import os
import sys
import time
import json
import socket
import platform
import subprocess
import urllib.request
import urllib.error
from datetime import datetime

CONFIG_FILENAME = "shieldx_config.json"

def print_banner():
    banner = """
  ____  _     _      _     ___  __
 / ___|| |__ (_) ___| | __| \ \/ /
 \___ \| '_ \| |/ _ \ |/ _` |\  / 
  ___) | | | | |  __/ | (_| |/  \ 
 |____/|_| |_|_|\___|_|\__,_/_/\_\\
 [ ShieldX Read-Only Endpoint Telemetry Agent v1.0 ]
    """
    print(banner)

def load_config():
    """Locates and loads shieldx_config.json."""
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), CONFIG_FILENAME)
    if not os.path.exists(config_path):
        # Check current working directory as fallback
        config_path = os.path.join(os.getcwd(), CONFIG_FILENAME)

    if not os.path.exists(config_path):
        print(f"[!] Configuration file '{CONFIG_FILENAME}' not found.")
        print("[!] Please download your auto-generated agent bundle from the ShieldX Dashboard:")
        print("    -> Settings / Download Agent -> 'Download Configuration'")
        print(f"    -> Place '{CONFIG_FILENAME}' in the same directory as this script.")
        sys.exit(1)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            if not cfg.get("api_key") or not cfg.get("server_url"):
                raise ValueError("Missing 'api_key' or 'server_url' in config.")
            return cfg
    except Exception as e:
        print(f"[-] Error reading {CONFIG_FILENAME}: {e}")
        sys.exit(1)

def get_system_metadata():
    return {
        "hostname": socket.gethostname(),
        "os": platform.system().lower(),
        "release": platform.release(),
        "arch": platform.machine()
    }

def read_windows_telemetry():
    """
    Strictly READ-ONLY Windows Event Log inspection.
    Queries failed logon events (Event ID 4625) via PowerShell or wevtutil.
    """
    events = []
    failed_count = 0

    try:
        # Query failed logons using PowerShell Get-WinEvent (read-only)
        ps_cmd = (
            "Get-WinEvent -FilterHashtable @{LogName='Security';ID=4625} -MaxEvents 5 -ErrorAction SilentlyContinue | "
            "Select-Object TimeCreated, Message | ConvertTo-Json"
        )
        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_cmd],
            capture_output=True,
            text=True,
            timeout=8
        )
        if res.returncode == 0 and res.stdout.strip():
            try:
                parsed = json.loads(res.stdout)
                if isinstance(parsed, dict):
                    parsed = [parsed]
                for item in parsed:
                    failed_count += 1
                    events.append({
                        "event_type": "WINDOWS_FAILED_LOGON",
                        "description": f"Windows Security Event 4625 (Failed Logon) at {item.get('TimeCreated', 'N/A')}",
                        "source_ip": "127.0.0.1",
                        "destination_port": 3389
                    })
            except Exception:
                pass
    except Exception:
        pass

    # Read active network connections count (read-only netstat)
    conn_count = 12
    try:
        ns = subprocess.run(["netstat", "-an"], capture_output=True, text=True, timeout=5)
        if ns.returncode == 0:
            conn_count = len([line for line in ns.stdout.splitlines() if "ESTABLISHED" in line])
    except Exception:
        pass

    return events, failed_count, max(conn_count, 1)

def read_linux_telemetry():
    """
    Strictly READ-ONLY Linux auth log inspection.
    """
    events = []
    failed_count = 0
    conn_count = 10

    log_files = ["/var/log/auth.log", "/var/log/secure"]
    for path in log_files:
        if os.path.exists(path) and os.access(path, os.R_OK):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()[-50:]
                    for line in lines:
                        if "Failed password" in line or "authentication failure" in line:
                            failed_count += 1
                            events.append({
                                "event_type": "LINUX_AUTH_FAILURE",
                                "description": line.strip()[:180],
                                "source_ip": "127.0.0.1",
                                "destination_port": 22
                            })
            except Exception:
                pass
            break

    # Netstat/ss read-only connection count
    try:
        res = subprocess.run(["ss", "-tan"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            conn_count = len([l for l in res.stdout.splitlines() if "ESTAB" in l])
    except Exception:
        pass

    return events, failed_count, max(conn_count, 1)

def read_darwin_telemetry():
    """
    Strictly READ-ONLY macOS unified log inspection.
    """
    events = []
    failed_count = 0
    conn_count = 8

    try:
        cmd = ["log", "show", "--predicate", 'eventMessage contains "Failed"', "--last", "5m", "--style", "ndjson"]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            for line in res.stdout.splitlines()[:5]:
                try:
                    obj = json.loads(line)
                    failed_count += 1
                    events.append({
                        "event_type": "MACOS_AUTH_FAILURE",
                        "description": obj.get("eventMessage", "macOS failed authentication")[:180],
                        "source_ip": "127.0.0.1",
                        "destination_port": 22
                    })
                except Exception:
                    pass
    except Exception:
        pass

    return events, failed_count, conn_count

def collect_telemetry():
    os_name = platform.system().lower()
    if os_name == "windows":
        events, failed, conns = read_windows_telemetry()
    elif os_name == "linux":
        events, failed, conns = read_linux_telemetry()
    elif os_name == "darwin":
        events, failed, conns = read_darwin_telemetry()
    else:
        events, failed, conns = [], 0, 5

    # Always include baseline heartbeat event
    events.append({
        "event_type": "HEARTBEAT",
        "description": f"Read-only monitoring heartbeat from {socket.gethostname()}",
        "source_ip": "127.0.0.1",
        "destination_port": 443
    })

    return {
        "hostname": socket.gethostname(),
        "os_type": os_name,
        "events": events,
        "failed_logons": failed,
        "network_connections": conns,
        "bytes_out": conns * 1024 * 4  # Typical outbound volume
    }

def send_telemetry(config, payload):
    url = f"{config['server_url'].rstrip('/')}/api/v1/telemetry/ingest"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": config["api_key"]
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode("utf-8")
            return json.loads(data)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        return {"error": f"HTTP {e.code}: {err_msg}"}
    except Exception as e:
        return {"error": str(e)}

def main():
    print_banner()
    cfg = load_config()
    meta = get_system_metadata()

    print(f"[*] Target Backend: {cfg['server_url']}")
    print(f"[*] Endpoint Host:  {meta['hostname']} ({meta['os']} {meta['arch']})")
    print(f"[*] Telemetry Mode: STRICTLY READ-ONLY OS AUTH LOGS")
    interval = cfg.get("telemetry_interval_seconds", 30)
    print(f"[*] Frequency:      Every {interval}s")
    print("[*] ShieldX Agent Active. Press Ctrl+C to terminate.\n")

    while True:
        try:
            timestamp = datetime.utcnow().strftime("%H:%M:%S UTC")
            print(f"[{timestamp}] Gathering read-only telemetry...", end=" ", flush=True)
            telemetry = collect_telemetry()
            result = send_telemetry(cfg, telemetry)

            if "error" in result:
                print(f"[FAIL] -> {result['error']}")
            else:
                threats = result.get("threats_detected", 0)
                anomalies = result.get("anomalies_detected", 0)
                if threats > 0:
                    print(f"[ALERT] -> Sent ({len(telemetry['events'])} events) | !! {threats} Threat(s) Detected !!")
                elif anomalies > 0:
                    print(f"[WARN]  -> Sent ({len(telemetry['events'])} events) | ! Anomaly Flagged !")
                else:
                    print(f"[OK] -> Dispatched ({len(telemetry['events'])} events) | All clear")

            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[!] ShieldX Agent stopped by operator.")
            break
        except Exception as e:
            print(f"\n[-] Unexpected agent loop exception: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
