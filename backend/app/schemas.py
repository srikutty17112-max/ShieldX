from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth
class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    oauth_provider: str
    voice_language: str
    live_voice_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OAuthLoginRequest(BaseModel):
    provider: str = Field(..., pattern="^(google|apple)$")
    id_token: str
    full_name: Optional[str] = None
    email: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    voice_language: Optional[str] = None  # 'en', 'ta', 'hi'
    live_voice_enabled: Optional[bool] = None

# Device & Agent
class DeviceCreate(BaseModel):
    device_name: str
    hostname: Optional[str] = None
    os_type: str = "windows"
    ip_address: Optional[str] = None

class DeviceOut(BaseModel):
    id: int
    device_name: str
    hostname: Optional[str] = None
    os_type: str
    ip_address: Optional[str] = None
    api_key_prefix: str
    is_active: bool
    last_seen: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeviceConfigOut(BaseModel):
    device_id: int
    device_name: str
    api_key: str
    server_url: str

# Telemetry
class TelemetryEvent(BaseModel):
    event_type: str
    source_ip: Optional[str] = None
    target_asset: Optional[str] = None
    bytes_transferred: Optional[int] = 0
    destination_port: Optional[int] = None
    command_line: Optional[str] = None
    description: Optional[str] = None
    timestamp: Optional[str] = None

class TelemetryPayload(BaseModel):
    device_id: Optional[int] = None
    hostname: Optional[str] = None
    os_type: Optional[str] = None
    events: List[TelemetryEvent] = []
    failed_logons: int = 0
    network_connections: int = 0
    bytes_out: int = 0
    cpu_percent: Optional[float] = 0.0
    memory_percent: Optional[float] = 0.0

class TelemetryResponse(BaseModel):
    status: str
    threats_detected: int
    anomalies_detected: int
    incident_ids: List[int] = []

# Threats & Incidents
class IncidentOut(BaseModel):
    id: int
    device_id: Optional[int] = None
    title: str
    threat_type: str
    severity: str
    is_simulated: bool
    is_anomaly: bool
    source_ip: Optional[str] = None
    target_asset: Optional[str] = None
    mitre_id: Optional[str] = None
    mitre_technique: Optional[str] = None
    mitre_tactic: Optional[str] = None
    description: str
    ai_explanation: str
    recommended_action: str
    status: str
    approver: Optional[str] = None
    emergency_override: bool
    geo_country: Optional[str] = "Unknown"
    geo_city: Optional[str] = "Unknown"
    geo_lat: Optional[float] = 20.0
    geo_lon: Optional[float] = 0.0
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class IncidentActionRequest(BaseModel):
    action: str  # 'APPROVE', 'REJECT', 'DISMISS', 'EMERGENCY_STOP'
    actor: str = "VOICE"  # 'VOICE', 'UI'

class IncidentSimulateRequest(BaseModel):
    threat_type: str = Field(..., pattern="^(BRUTE_FORCE|PORT_SCAN|DATA_EXFILTRATION|RANSOMWARE|BENIGN)$")
    device_id: Optional[int] = None

# Voice
class VoiceChatRequest(BaseModel):
    transcript: str
    incident_id: Optional[int] = None
    language: Optional[str] = "en"  # 'en', 'ta', 'hi'

class VoiceChatResponse(BaseModel):
    reply_text: str
    spoken_text: str
    language: str
    detected_action: Optional[str] = None  # 'APPROVE', 'REJECT', 'EMERGENCY_STOP', 'BRIEFING', 'QUERY'
    incident_id: Optional[int] = None
    sentiment_urgency: bool = False
    action_taken: Optional[str] = None

class VoiceBriefingResponse(BaseModel):
    briefing_text: str
    spoken_text: str
    total_events: int
    flagged_threats: int
    blocked_threats: int
    active_devices: int
    threat_level: str

# Audit Log
class AuditLogOut(BaseModel):
    id: int
    incident_id: Optional[int] = None
    action: str
    actor: str
    result: str
    details: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard Stats & Network Graph
class NetworkNode(BaseModel):
    id: str
    label: str
    type: str  # 'agent', 'firewall', 'cloud', 'external_ip', 'threat'
    status: str  # 'healthy', 'warning', 'critical'

class NetworkEdge(BaseModel):
    source: str
    target: str
    protocol: str
    volume: str
    threat: bool

class DashboardStats(BaseModel):
    total_devices: int
    active_devices: int
    total_incidents: int
    active_threats: int
    blocked_threats: int
    anomalies_detected: int
    overall_threat_level: str
    network_nodes: List[NetworkNode]
    network_edges: List[NetworkEdge]
