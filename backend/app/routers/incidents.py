from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ThreatIncident, AuditLog, User, Device
from app.schemas import IncidentOut, IncidentActionRequest, IncidentSimulateRequest
from app.security.auth import get_current_user
from app.services.detection_engine import MITRE_TECHNIQUES
from app.services.gemini_service import generate_threat_explanation
from app.services.geo_service import resolve_ip_geo
from app.services.report_generator import generate_incident_pdf

router = APIRouter(prefix="/api/v1/incidents", tags=["Threat Incidents"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ThreatIncident).filter(ThreatIncident.user_id == current_user.id)
    if status_filter:
        query = query.filter(ThreatIncident.status == status_filter.upper())
    incidents = query.order_by(ThreatIncident.created_at.desc()).all()
    return [IncidentOut.from_orm(i) for i in incidents]

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(ThreatIncident).filter(
        ThreatIncident.id == incident_id,
        ThreatIncident.user_id == current_user.id
    ).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return IncidentOut.from_orm(incident)

@router.post("/{incident_id}/action", response_model=IncidentOut)
def take_action_on_incident(
    incident_id: int,
    payload: IncidentActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(ThreatIncident).filter(
        ThreatIncident.id == incident_id,
        ThreatIncident.user_id == current_user.id
    ).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    act = payload.action.upper()
    actor_mode = payload.actor.upper() if payload.actor.upper() in ["VOICE", "UI"] else "VOICE"

    if act == "APPROVE":
        incident.status = "CONTAINED"
        incident.approver = actor_mode
        incident.resolved_at = datetime.utcnow()
        result_str = "SUCCESS"
        details_str = f"Executed {incident.recommended_action} via {actor_mode} approval."
    elif act == "EMERGENCY_STOP":
        incident.status = "CONTAINED"
        incident.approver = "VOICE"
        incident.emergency_override = True
        incident.resolved_at = datetime.utcnow()
        result_str = "SUCCESS"
        details_str = "Emergency voice override activated. Immediate network freeze and host containment executed."
    elif act in ["REJECT", "DISMISS"]:
        incident.status = "REJECTED"
        incident.approver = actor_mode
        incident.resolved_at = datetime.utcnow()
        result_str = "REJECTED"
        details_str = f"Incident dismissed by user via {actor_mode}."
    else:
        raise HTTPException(status_code=400, detail="Invalid action.")

    db.commit()

    # Log to Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        incident_id=incident.id,
        action=f"CONTAINMENT_{act}",
        actor=actor_mode,
        result=result_str,
        details=details_str
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return IncidentOut.from_orm(incident)

@router.post("/simulate", response_model=IncidentOut)
async def simulate_threat(
    payload: IncidentSimulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulated attack scenarios clearly tagged with is_simulated=True.
    Options: BRUTE_FORCE, PORT_SCAN, DATA_EXFILTRATION, RANSOMWARE, BENIGN.
    """
    th_type = payload.threat_type.upper()
    mitre = MITRE_TECHNIQUES.get(th_type, MITRE_TECHNIQUES["ANOMALY"])

    sim_scenarios = {
        "BRUTE_FORCE": {
            "title": "Simulated Brute Force Attack Drill (12 Failed Logons)",
            "severity": "HIGH",
            "source_ip": "185.220.101.5",
            "description": "Drill Simulation: Automated hydra credential stuffing against SSH/RDP port.",
            "recommended_action": "Block Source IP 185.220.101.5 & Enforce 2FA"
        },
        "PORT_SCAN": {
            "title": "Simulated Network Reconnaissance & Port Probe",
            "severity": "MEDIUM",
            "source_ip": "45.146.165.37",
            "description": "Drill Simulation: Fast SYN scan probed ports 21, 22, 80, 443, 445, 3389, 8080.",
            "recommended_action": "Blacklist Reconnaissance IP on Perimeter Firewall"
        },
        "DATA_EXFILTRATION": {
            "title": "Simulated Sensitive Data Exfiltration (78.4 MB Outbound)",
            "severity": "HIGH",
            "source_ip": "194.26.29.112",
            "description": "Drill Simulation: High-volume encrypted stream pushed to unclassified external cloud droplet.",
            "recommended_action": "Sever Active TCP Session & Revoke Cloud Credentials"
        },
        "RANSOMWARE": {
            "title": "Simulated Ransomware Shadow Copy Purge & Encryption Drill",
            "severity": "CRITICAL",
            "source_ip": "103.152.220.4",
            "description": "Drill Simulation: Attempted execution of 'vssadmin delete shadows /all /quiet' and rapid file renaming.",
            "recommended_action": "Emergency Network Isolation & Kill Process PID 4982"
        },
        "BENIGN": {
            "title": "Simulated Routine Administrative Telemetry",
            "severity": "LOW",
            "source_ip": "192.168.1.50",
            "description": "Drill Simulation: Windows Update health check and scheduled telemetry checkin.",
            "recommended_action": "Log Event & Continue Passive Monitoring"
        }
    }

    scen = sim_scenarios.get(th_type, sim_scenarios["BENIGN"])
    geo = resolve_ip_geo(scen["source_ip"])

    # Generate AI explanation
    ai_expl = await generate_threat_explanation(
        threat_type=th_type,
        title=scen["title"],
        description=scen["description"],
        mitre_info=mitre,
        language=current_user.voice_language
    )

    incident = ThreatIncident(
        user_id=current_user.id,
        device_id=payload.device_id,
        title=scen["title"],
        threat_type=th_type,
        severity=scen["severity"],
        is_simulated=True,
        is_anomaly=False,
        source_ip=scen["source_ip"],
        target_asset="Production Host (Drill Range)",
        mitre_id=mitre.get("id"),
        mitre_technique=mitre.get("technique"),
        mitre_tactic=mitre.get("tactic"),
        description=scen["description"],
        ai_explanation=ai_expl,
        recommended_action=scen["recommended_action"],
        status="DETECTED",
        geo_country=geo["country"],
        geo_city=geo["city"],
        geo_lat=geo["lat"],
        geo_lon=geo["lon"]
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    audit = AuditLog(
        user_id=current_user.id,
        incident_id=incident.id,
        action="SIMULATED_ATTACK_LAUNCHED",
        actor="UI",
        result="DETECTED",
        details=f"Drill scenario '{th_type}' initiated by operator."
    )
    db.add(audit)
    db.commit()

    return IncidentOut.from_orm(incident)

@router.get("/{incident_id}/report.pdf")
def download_pdf_report(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(ThreatIncident).filter(
        ThreatIncident.id == incident_id,
        ThreatIncident.user_id == current_user.id
    ).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    pdf_buffer = generate_incident_pdf(incident, current_user)
    filename = f"ShieldX_Report_INC-{incident.id:05d}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
