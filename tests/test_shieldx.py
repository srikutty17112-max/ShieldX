import pytest
import os
import sys

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.security.auth import get_password_hash, verify_password, create_access_token
from backend.app.security.crypto import encrypt_field, decrypt_field, rotate_field_value, Fernet
from backend.app.services.detection_engine import DetectionEngine
from backend.app.services.voice_service import VoiceService
from backend.app.services.report_generator import generate_incident_pdf
from backend.app.models import ThreatIncident, User
from datetime import datetime

def test_password_hashing():
    pwd = "SecureSecretPassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_aes_field_encryption_and_rotation():
    secret = "sx_live_super_secret_agent_token_999"
    encrypted = encrypt_field(secret)
    assert encrypted != secret

    decrypted = decrypt_field(encrypted)
    assert decrypted == secret

    # Test key rotation
    old_key = Fernet.generate_key().decode()
    new_key = Fernet.generate_key().decode()
    from backend.app.security.crypto import get_cipher

    old_cipher = get_cipher(old_key)
    old_ciphertext = old_cipher.encrypt(secret.encode()).decode()

    rotated_ciphertext = rotate_field_value(old_ciphertext, old_key, new_key)
    new_cipher = get_cipher(new_key)
    assert new_cipher.decrypt(rotated_ciphertext.encode()).decode() == secret

def test_rule_based_detection():
    # 1. Brute force
    threats = DetectionEngine.evaluate_rule_based(events=[], failed_logons=7, bytes_out=100)
    assert any(t["type"] == "BRUTE_FORCE" for t in threats)

    # 2. Port scan
    events_scan = [{"destination_port": p} for p in [21, 22, 23, 25, 80, 443, 8080, 8443, 3389]]
    threats_scan = DetectionEngine.evaluate_rule_based(events=events_scan, failed_logons=0, bytes_out=100)
    assert any(t["type"] == "PORT_SCAN" for t in threats_scan)

    # 3. Data exfiltration
    threats_exfil = DetectionEngine.evaluate_rule_based(events=[], failed_logons=0, bytes_out=60 * 1024 * 1024)
    assert any(t["type"] == "DATA_EXFILTRATION" for t in threats_exfil)

    # 4. Ransomware
    events_vss = [{"command_line": "vssadmin delete shadows /all /quiet"}]
    threats_ransom = DetectionEngine.evaluate_rule_based(events=events_vss, failed_logons=0, bytes_out=100)
    assert any(t["type"] == "RANSOMWARE" for t in threats_ransom)

def test_anomaly_detection_baseline():
    baseline = {"count": 10, "mean_conn": 5.0, "var_conn": 2.0}
    # A massive sudden burst of 50 connections (> 3 sigma)
    current = {"network_connections": 50, "bytes_out": 5000}
    anomaly, updated_baseline = DetectionEngine.evaluate_anomaly_based(current, baseline)
    assert anomaly is not None
    assert anomaly["type"] == "ANOMALY"
    assert "unclassified pattern" in anomaly["title"].lower()
    assert updated_baseline["count"] == 11

def test_voice_engine_commands():
    user_id = 999
    # 1. Approval
    res_app = VoiceService.parse_voice_command("Aegis please approve the threat", user_id=user_id, active_incident_id=42, language="en")
    assert res_app["detected_action"] == "APPROVE"
    assert "authorization confirmed" in res_app["reply_text"].lower()

    # 2. Emergency Override
    res_stop = VoiceService.parse_voice_command("EMERGENCY STOP NOW!", user_id=user_id, language="en")
    assert res_stop["detected_action"] == "EMERGENCY_STOP"
    assert res_stop["sentiment_urgency"] is True

    # 3. Multilanguage Tamil & Hindi
    res_ta = VoiceService.parse_voice_command("அங்கீகரி", user_id=user_id, active_incident_id=42, language="ta")
    assert res_ta["detected_action"] == "APPROVE"

    res_hi = VoiceService.parse_voice_command("स्वीकार", user_id=user_id, active_incident_id=42, language="hi")
    assert res_hi["detected_action"] == "APPROVE"

def test_pdf_report_generation():
    user = User(id=1, email="analyst@shieldx.io")
    incident = ThreatIncident(
        id=101,
        user_id=1,
        title="Simulated Brute Force Attack Drill",
        threat_type="BRUTE_FORCE",
        severity="HIGH",
        is_simulated=True,
        is_anomaly=False,
        source_ip="185.220.101.5",
        target_asset="Host-Primary",
        mitre_id="T1110",
        mitre_technique="Brute Force",
        mitre_tactic="Credential Access",
        description="Consecutive failed authentication events detected.",
        ai_explanation="Aegis identified unauthorized password spraying.",
        recommended_action="Block Source IP",
        status="CONTAINED",
        approver="VOICE",
        emergency_override=False,
        geo_country="United States",
        geo_city="Ashburn",
        created_at=datetime.utcnow(),
        resolved_at=datetime.utcnow()
    )

    pdf_buffer = generate_incident_pdf(incident, user)
    content = pdf_buffer.getvalue()
    assert len(content) > 1000
    assert content[:4] == b"%PDF"
