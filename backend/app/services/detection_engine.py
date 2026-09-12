import json
import math
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

MITRE_TECHNIQUES = {
    "BRUTE_FORCE": {
        "id": "T1110",
        "technique": "Brute Force",
        "tactic": "Credential Access",
        "description": "Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained.",
        "recommended_action": "Block Source IP & Enforce Account Lockout"
    },
    "PORT_SCAN": {
        "id": "T1046",
        "technique": "Network Service Discovery",
        "tactic": "Discovery",
        "description": "Adversaries may attempt to get a listing of services running on remote hosts, including listening ports and protocol versions.",
        "recommended_action": "Block Reconnaissance IP & Update Perimeter Firewall"
    },
    "DATA_EXFILTRATION": {
        "id": "T1048",
        "technique": "Exfiltration Over Alternative Protocol",
        "tactic": "Exfiltration",
        "description": "Adversaries may steal data by exfiltrating it over an unencrypted or unauthorized protocol or encrypted network channel.",
        "recommended_action": "Sever External Connection & Revoke Endpoint Token"
    },
    "RANSOMWARE": {
        "id": "T1486",
        "technique": "Data Encrypted for Impact",
        "tactic": "Impact",
        "description": "Adversaries may encrypt data on target systems or delete volume shadow copies to interrupt availability of system and network resources.",
        "recommended_action": "Emergency Isolate Host & Terminate Offending Process"
    },
    "ANOMALY": {
        "id": "T1059",
        "technique": "Command and Scripting Interpreter / Unclassified Deviation",
        "tactic": "Execution / Anomaly",
        "description": "Device behavior deviated significantly from historical statistical baselines (>3 std dev) without matching known threat signatures.",
        "recommended_action": "Quarantine Endpoint for AI Forensic Inspection"
    },
    "BENIGN": {
        "id": "T0000",
        "technique": "Normal Administrative Traffic",
        "tactic": "Legitimate Operation",
        "description": "Standard administrative operations and routine OS telemetry within expected baseline thresholds.",
        "recommended_action": "Log Event and Maintain Passive Monitoring"
    }
}

class DetectionEngine:
    """
    Dual-engine threat detector:
    1. Rule-based detection for known attack patterns.
    2. Anomaly-based detection for statistically unusual deviations.
    """

    @staticmethod
    def evaluate_rule_based(events: List[Dict[str, Any]], failed_logons: int, bytes_out: int) -> List[Dict[str, Any]]:
        threats = []

        # 1. Brute Force Rule (Threshold >= 5 failed logons)
        if failed_logons >= 5:
            threats.append({
                "type": "BRUTE_FORCE",
                "severity": "HIGH",
                "title": f"Brute Force Authentication Spike ({failed_logons} Failed Logons)",
                "description": f"Detected {failed_logons} consecutive failed authentication attempts in a short telemetry window.",
                "mitre": MITRE_TECHNIQUES["BRUTE_FORCE"],
                "is_anomaly": False
            })

        # 2. Port Scan Rule (Multiple unique ports probed)
        probed_ports = set()
        for ev in events:
            if ev.get("destination_port"):
                probed_ports.add(ev.get("destination_port"))
            cmd = (ev.get("command_line") or "").lower()
            if "nmap" in cmd or "portscan" in cmd or "masscan" in cmd:
                probed_ports.update([21, 22, 23, 25, 80, 443, 445, 3389, 8080, 8443])

        if len(probed_ports) >= 8:
            threats.append({
                "type": "PORT_SCAN",
                "severity": "MEDIUM",
                "title": f"Network Service Discovery / Port Scan ({len(probed_ports)} Ports Probed)",
                "description": f"Rapid probing detected across multiple destination ports: {sorted(list(probed_ports))[:8]}...",
                "mitre": MITRE_TECHNIQUES["PORT_SCAN"],
                "is_anomaly": False
            })

        # 3. Data Exfiltration Rule (Large outbound transfer threshold >= 50MB)
        if bytes_out >= 52428800:  # 50MB
            mb = round(bytes_out / (1024 * 1024), 2)
            threats.append({
                "type": "DATA_EXFILTRATION",
                "severity": "HIGH",
                "title": f"Mass Data Exfiltration Volume Detected ({mb} MB Outbound)",
                "description": f"Abnormal outbound traffic stream of {mb} MB exceeded standard threshold to an external IP.",
                "mitre": MITRE_TECHNIQUES["DATA_EXFILTRATION"],
                "is_anomaly": False
            })

        # 4. Ransomware Rule (Mass file manipulation / Shadow copy deletion)
        ransomware_indicators = False
        indicator_reason = ""
        for ev in events:
            cmd = (ev.get("command_line") or "").lower()
            desc = (ev.get("description") or "").lower()
            if any(term in cmd for term in ["vssadmin delete shadows", "wmic shadowcopy delete", "wbadmin delete catalog", "bcdedit /set {default} recoveryenabled no"]):
                ransomware_indicators = True
                indicator_reason = "VSS shadow copy deletion command executed"
                break
            if ".locked" in cmd or ".crypto" in cmd or "mass file encryption" in desc:
                ransomware_indicators = True
                indicator_reason = "Rapid file modification and encryption pattern observed"
                break

        if ransomware_indicators:
            threats.append({
                "type": "RANSOMWARE",
                "severity": "CRITICAL",
                "title": "Ransomware Defense Evasion & Shadow Copy Invalidation",
                "description": f"Critical indicator detected: {indicator_reason}. High risk of impending data encryption.",
                "mitre": MITRE_TECHNIQUES["RANSOMWARE"],
                "is_anomaly": False
            })

        return threats

    @staticmethod
    def evaluate_anomaly_based(
        current_metrics: Dict[str, Any],
        baseline_metrics: Dict[str, Any]
    ) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
        """
        Calculates rolling baseline and identifies statistical deviations (> 3 sigma).
        Flags as 'Anomaly — unclassified pattern'.
        """
        # Baseline structure: {"count": N, "mean_conn": float, "var_conn": float, "mean_bytes": float, "var_bytes": float}
        n = baseline_metrics.get("count", 0)
        mean_conn = baseline_metrics.get("mean_conn", 5.0)
        var_conn = baseline_metrics.get("var_conn", 4.0)

        current_conn = float(current_metrics.get("network_connections", 0))

        anomaly = None

        if n >= 3:  # Only evaluate anomaly if we have at least 3 baseline readings
            std_conn = math.sqrt(var_conn) if var_conn > 0 else 1.0
            z_score = (current_conn - mean_conn) / std_conn if std_conn > 0 else 0.0

            # If connection volume spikes > 3 standard deviations from baseline
            if z_score > 3.0 and current_conn > 20:
                anomaly = {
                    "type": "ANOMALY",
                    "severity": "HIGH",
                    "title": "Anomaly — unclassified pattern",
                    "description": f"Statistical deviation detected: Connection rate ({int(current_conn)}) is {z_score:.1f} standard deviations above normal device baseline (avg {mean_conn:.1f}).",
                    "mitre": MITRE_TECHNIQUES["ANOMALY"],
                    "is_anomaly": True
                }

        # Welford algorithm to update rolling mean and variance
        new_n = n + 1
        delta = current_conn - mean_conn
        new_mean = mean_conn + delta / new_n
        delta2 = current_conn - new_mean
        new_var = ((var_conn * n) + (delta * delta2)) / new_n if new_n > 1 else 4.0

        updated_baseline = {
            "count": new_n,
            "mean_conn": round(new_mean, 2),
            "var_conn": round(max(new_var, 1.0), 2)
        }

        return anomaly, updated_baseline
