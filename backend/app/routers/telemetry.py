import json
import csv
import io
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Device, TelemetryLog, ThreatIncident, AuditLog, User
from app.schemas import TelemetryPayload, TelemetryResponse
from app.security.crypto import decrypt_field
from app.security.rate_limiter import telemetry_limiter
from app.services.detection_engine import DetectionEngine, MITRE_TECHNIQUES
from app.services.gemini_service import generate_threat_explanation
from app.services.geo_service import resolve_ip_geo
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry Ingestion"])

def authenticate_agent(x_api_key: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Device:
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key authentication header."
        )

    # Fast lookup by prefix
    prefix = x_api_key[:12] + "..."
    candidate_devices = db.query(Device).filter(Device.api_key_prefix == prefix, Device.is_active == True).all()

    for device in candidate_devices:
        decrypted = decrypt_field(device.api_key_encrypted)
        if decrypted == x_api_key:
            device.last_seen = datetime.utcnow()
            db.commit()
            return device

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or revoked agent API key."
    )

@router.post("/ingest", response_model=TelemetryResponse)
async def ingest_telemetry(
    request: Request,
    payload: TelemetryPayload,
    device: Device = Depends(authenticate_agent),
    db: Session = Depends(get_db)
):
    telemetry_limiter.check(request, identifier=str(device.id))

    # Log telemetry record
    events_json = json.dumps([e.dict() for e in payload.events])
    t_log = TelemetryLog(
        device_id=device.id,
        raw_events=events_json,
        event_count=len(payload.events),
        failed_logons=payload.failed_logons,
        network_connections=payload.network_connections,
        bytes_out=payload.bytes_out,
        suspicious_flags="[]"
    )
    db.add(t_log)

    # 1. Rule-based detection
    detected_threats = DetectionEngine.evaluate_rule_based(
        events=[e.dict() for e in payload.events],
        failed_logons=payload.failed_logons,
        bytes_out=payload.bytes_out
    )

    # 2. Anomaly-based detection
    try:
        baseline = json.loads(device.baseline_metrics or "{}")
    except Exception:
        baseline = {}

    current_metrics = {
        "network_connections": payload.network_connections,
        "bytes_out": payload.bytes_out
    }
    anomaly, updated_baseline = DetectionEngine.evaluate_anomaly_based(current_metrics, baseline)
    device.baseline_metrics = json.dumps(updated_baseline)

    if anomaly:
        detected_threats.append(anomaly)

    created_incident_ids = []
    user = db.query(User).filter(User.id == device.user_id).first()
    lang = user.voice_language if user else "en"

    for th in detected_threats:
        # Determine source IP from events or fallback
        source_ip = "194.26.29.112"
        for ev in payload.events:
            if ev.source_ip and ev.source_ip not in ["127.0.0.1", "localhost"]:
                source_ip = ev.source_ip
                break

        geo = resolve_ip_geo(source_ip)
        mitre_data = th.get("mitre", MITRE_TECHNIQUES.get(th.get("type"), MITRE_TECHNIQUES["ANOMALY"]))

        ai_expl = await generate_threat_explanation(
            threat_type=th["type"],
            title=th["title"],
            description=th["description"],
            mitre_info=mitre_data,
            language=lang
        )

        incident = ThreatIncident(
            user_id=device.user_id,
            device_id=device.id,
            title=th["title"],
            threat_type=th["type"],
            severity=th["severity"],
            is_simulated=False,
            is_anomaly=th.get("is_anomaly", False),
            source_ip=source_ip,
            target_asset=device.hostname or device.device_name,
            mitre_id=mitre_data.get("id"),
            mitre_technique=mitre_data.get("technique"),
            mitre_tactic=mitre_data.get("tactic"),
            description=th["description"],
            ai_explanation=ai_expl,
            recommended_action=mitre_data.get("recommended_action", "Isolate Host"),
            status="DETECTED",
            geo_country=geo["country"],
            geo_city=geo["city"],
            geo_lat=geo["lat"],
            geo_lon=geo["lon"]
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        created_incident_ids.append(incident.id)

        # Audit log entry
        audit = AuditLog(
            user_id=device.user_id,
            incident_id=incident.id,
            action="THREAT_DETECTED",
            actor="SYSTEM",
            result="DETECTED",
            details=f"Detection engine flagged {th['title']} ({th['type']}) on {device.device_name}"
        )
        db.add(audit)
        db.commit()

    db.commit()

    return TelemetryResponse(
        status="processed",
        threats_detected=len(detected_threats),
        anomalies_detected=1 if anomaly else 0,
        incident_ids=created_incident_ids
    )

@router.post("/upload-log", response_model=TelemetryResponse)
async def upload_log_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manual upload of a real log file (JSON or CSV) as an alternative to running the agent.
    """
    content = await file.read()
    filename = file.filename.lower()
    events = []
    failed_logons = 0
    bytes_out = 0

    if filename.endswith(".json"):
        try:
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list):
                events = data
            elif isinstance(data, dict):
                events = data.get("events", [data])
                failed_logons = data.get("failed_logons", 0)
                bytes_out = data.get("bytes_out", 0)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON file format.")
    elif filename.endswith(".csv"):
        try:
            reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
            events = list(reader)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid CSV file format.")
    else:
        raise HTTPException(status_code=400, detail="Please upload a .json or .csv log file.")

    # Calculate metrics from parsed events
    for ev in events:
        desc = str(ev.get("description", "")).lower()
        cmd = str(ev.get("command_line", "")).lower()
        if "failed" in desc or "failed logon" in cmd:
            failed_logons += 1
        if ev.get("bytes_transferred"):
            try:
                bytes_out += int(ev["bytes_transferred"])
            except ValueError:
                pass

    # Evaluate
    detected_threats = DetectionEngine.evaluate_rule_based(events, failed_logons, bytes_out)
    if not detected_threats:
        # If no hard rule triggered, check if volume is anomalous
        if len(events) > 50:
            anomaly_mitre = MITRE_TECHNIQUES["ANOMALY"]
            detected_threats.append({
                "type": "ANOMALY",
                "severity": "MEDIUM",
                "title": "Anomaly — unclassified pattern",
                "description": f"Manual log upload contained an unusually dense burst of {len(events)} events in a single batch.",
                "mitre": anomaly_mitre,
                "is_anomaly": True
            })

    created_incident_ids = []
    for th in detected_threats:
        mitre_data = th.get("mitre", MITRE_TECHNIQUES.get(th["type"], MITRE_TECHNIQUES["ANOMALY"]))
        source_ip = "185.220.101.5"
        for ev in events:
            if ev.get("source_ip"):
                source_ip = ev["source_ip"]
                break

        geo = resolve_ip_geo(source_ip)
        ai_expl = await generate_threat_explanation(
            threat_type=th["type"],
            title=th["title"],
            description=th["description"],
            mitre_info=mitre_data,
            language=current_user.voice_language
        )

        incident = ThreatIncident(
            user_id=current_user.id,
            device_id=None,
            title=th["title"],
            threat_type=th["type"],
            severity=th["severity"],
            is_simulated=False,
            is_anomaly=th.get("is_anomaly", False),
            source_ip=source_ip,
            target_asset=f"Uploaded Log: {file.filename}",
            mitre_id=mitre_data.get("id"),
            mitre_technique=mitre_data.get("technique"),
            mitre_tactic=mitre_data.get("tactic"),
            description=th["description"],
            ai_explanation=ai_expl,
            recommended_action=mitre_data.get("recommended_action", "Isolate Host"),
            status="DETECTED",
            geo_country=geo["country"],
            geo_city=geo["city"],
            geo_lat=geo["lat"],
            geo_lon=geo["lon"]
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        created_incident_ids.append(incident.id)

        audit = AuditLog(
            user_id=current_user.id,
            incident_id=incident.id,
            action="MANUAL_LOG_THREAT_DETECTED",
            actor="SYSTEM",
            result="DETECTED",
            details=f"Threat detected from uploaded log {file.filename}: {th['title']}"
        )
        db.add(audit)
        db.commit()

    return TelemetryResponse(
        status="processed",
        threats_detected=len(detected_threats),
        anomalies_detected=sum(1 for t in detected_threats if t.get("is_anomaly")),
        incident_ids=created_incident_ids
    )
