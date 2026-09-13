from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Null for OAuth users
    full_name = Column(String(255), nullable=True)
    oauth_provider = Column(String(50), default="local")  # 'local', 'google', 'apple'
    oauth_sub = Column(String(255), index=True, nullable=True)
    oauth_access_token_encrypted = Column(Text, nullable=True)
    voice_language = Column(String(10), default="en")  # 'en', 'ta', 'hi'
    live_voice_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    incidents = relationship("ThreatIncident", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_name = Column(String(255), nullable=False)
    hostname = Column(String(255), nullable=True)
    os_type = Column(String(50), default="windows")  # 'windows', 'linux', 'darwin'
    ip_address = Column(String(64), nullable=True)
    api_key_encrypted = Column(Text, nullable=False)
    api_key_prefix = Column(String(32), index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    baseline_metrics = Column(Text, default="{}")  # JSON string of baseline
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")
    telemetry_logs = relationship("TelemetryLog", back_populates="device", cascade="all, delete-orphan")
    incidents = relationship("ThreatIncident", back_populates="device")

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    raw_events = Column(Text, default="[]")
    event_count = Column(Integer, default=0)
    failed_logons = Column(Integer, default=0)
    network_connections = Column(Integer, default=0)
    bytes_out = Column(Integer, default=0)
    suspicious_flags = Column(Text, default="[]")
    timestamp = Column(DateTime, default=datetime.utcnow)

    device = relationship("Device", back_populates="telemetry_logs")

class ThreatIncident(Base):
    __tablename__ = "threat_incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    title = Column(String(255), nullable=False)
    threat_type = Column(String(64), nullable=False)  # BRUTE_FORCE, PORT_SCAN, DATA_EXFILTRATION, RANSOMWARE, ANOMALY, BENIGN
    severity = Column(String(32), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    is_simulated = Column(Boolean, default=False)
    is_anomaly = Column(Boolean, default=False)
    source_ip = Column(String(64), nullable=True)
    target_asset = Column(String(255), nullable=True)
    mitre_id = Column(String(32), nullable=True)
    mitre_technique = Column(String(255), nullable=True)
    mitre_tactic = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    ai_explanation = Column(Text, nullable=False)
    recommended_action = Column(String(255), default="Isolate Host")
    status = Column(String(32), default="DETECTED")  # DETECTED, APPROVED, REJECTED, CONTAINED, DISMISSED
    approver = Column(String(32), nullable=True)  # 'VOICE', 'UI'
    emergency_override = Column(Boolean, default=False)
    geo_country = Column(String(100), default="Unknown")
    geo_city = Column(String(100), default="Unknown")
    geo_lat = Column(Float, default=20.0)
    geo_lon = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="incidents")
    device = relationship("Device", back_populates="incidents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("threat_incidents.id"), nullable=True)
    action = Column(String(255), nullable=False)
    actor = Column(String(32), default="VOICE")  # VOICE, UI, SYSTEM
    result = Column(String(64), default="SUCCESS")  # SUCCESS, FAILED, REJECTED, BLOCKED
    details = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

class KeyRotationAudit(Base):
    __tablename__ = "key_rotation_audits"

    id = Column(Integer, primary_key=True, index=True)
    rotated_at = Column(DateTime, default=datetime.utcnow)
    old_key_prefix = Column(String(32), nullable=False)
    new_key_prefix = Column(String(32), nullable=False)
    records_updated = Column(Integer, default=0)
