import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import User, ThreatIncident, AuditLog, Device
from backend.app.schemas import VoiceChatRequest, VoiceChatResponse, VoiceBriefingResponse
from backend.app.security.auth import get_current_user
from backend.app.services.voice_service import VoiceService

router = APIRouter(prefix="/api/v1/voice", tags=["Voice Interaction Engine"])

@router.post("/chat", response_model=VoiceChatResponse)
def handle_voice_chat(
    payload: VoiceChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses natural spoken input from the user.
    Executes voice-authorized containment, emergency stops, briefings, or conversational Q&A.
    """
    lang = payload.language or current_user.voice_language or "en"

    # Find candidate incident if not provided
    active_inc = None
    if payload.incident_id:
        active_inc = db.query(ThreatIncident).filter(
            ThreatIncident.id == payload.incident_id,
            ThreatIncident.user_id == current_user.id
        ).first()
    else:
        # Latest unresolved incident
        active_inc = db.query(ThreatIncident).filter(
            ThreatIncident.user_id == current_user.id,
            ThreatIncident.status == "DETECTED"
        ).order_by(ThreatIncident.created_at.desc()).first()

    target_id = active_inc.id if active_inc else None

    # Parse command through Aegis Voice Service
    parsed = VoiceService.parse_voice_command(
        transcript=payload.transcript,
        user_id=current_user.id,
        active_incident_id=target_id,
        language=lang
    )

    action = parsed.get("detected_action")

    # If action was APPROVE and we have an active incident
    if action == "APPROVE" and active_inc and active_inc.status == "DETECTED":
        active_inc.status = "CONTAINED"
        active_inc.approver = "VOICE"
        active_inc.resolved_at = datetime.utcnow()
        db.commit()

        audit = AuditLog(
            user_id=current_user.id,
            incident_id=active_inc.id,
            action="VOICE_APPROVED_CONTAINMENT",
            actor="VOICE",
            result="SUCCESS",
            details=f"Voice approval executed {active_inc.recommended_action}."
        )
        db.add(audit)
        db.commit()

    # If action was EMERGENCY_STOP
    elif action == "EMERGENCY_STOP":
        open_incs = db.query(ThreatIncident).filter(
            ThreatIncident.user_id == current_user.id,
            ThreatIncident.status == "DETECTED"
        ).all()
        for inc in open_incs:
            inc.status = "CONTAINED"
            inc.approver = "VOICE"
            inc.emergency_override = True
            inc.resolved_at = datetime.utcnow()
            audit = AuditLog(
                user_id=current_user.id,
                incident_id=inc.id,
                action="VOICE_EMERGENCY_OVERRIDE",
                actor="VOICE",
                result="SUCCESS",
                details="Emergency voice freeze containment executed."
            )
            db.add(audit)
        db.commit()

    # If action was REJECT
    elif action == "REJECT" and active_inc and active_inc.status == "DETECTED":
        active_inc.status = "REJECTED"
        active_inc.approver = "VOICE"
        active_inc.resolved_at = datetime.utcnow()
        db.commit()

        audit = AuditLog(
            user_id=current_user.id,
            incident_id=active_inc.id,
            action="VOICE_REJECTED_INCIDENT",
            actor="VOICE",
            result="REJECTED",
            details=f"Incident dismissed via voice command: '{payload.transcript}'"
        )
        db.add(audit)
        db.commit()

    return VoiceChatResponse(
        reply_text=parsed["reply_text"],
        spoken_text=parsed["spoken_text"],
        language=lang,
        detected_action=parsed["detected_action"],
        incident_id=target_id,
        sentiment_urgency=parsed["sentiment_urgency"],
        action_taken=parsed["action_taken"]
    )

@router.get("/briefing", response_model=VoiceBriefingResponse)
def get_voice_briefing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates spoken daily/weekly security summary.
    """
    one_day_ago = datetime.utcnow() - timedelta(days=1)

    devices_count = db.query(Device).filter(Device.user_id == current_user.id, Device.is_active == True).count()
    incidents = db.query(ThreatIncident).filter(
        ThreatIncident.user_id == current_user.id,
        ThreatIncident.created_at >= one_day_ago
    ).all()

    total_events = len(incidents)
    flagged = sum(1 for i in incidents if i.severity in ["HIGH", "CRITICAL"])
    blocked = sum(1 for i in incidents if i.status == "CONTAINED")

    threat_level = "LOW"
    if flagged >= 3:
        threat_level = "CRITICAL"
    elif flagged >= 1:
        threat_level = "ELEVATED"

    spoken = VoiceService.format_briefing(
        total_events=total_events,
        flagged=flagged,
        blocked=blocked,
        active_devices=max(devices_count, 1),
        language=current_user.voice_language
    )

    return VoiceBriefingResponse(
        briefing_text=spoken,
        spoken_text=spoken,
        total_events=total_events,
        flagged_threats=flagged,
        blocked_threats=blocked,
        active_devices=max(devices_count, 1),
        threat_level=threat_level
    )

@router.get("/proactive-alerts")
def get_proactive_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves unprompted spoken alerts for recent critical/high incidents.
    Assistant speaks up automatically when high/critical threat arrives.
    """
    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
    urgent_incidents = db.query(ThreatIncident).filter(
        ThreatIncident.user_id == current_user.id,
        ThreatIncident.severity.in_(["HIGH", "CRITICAL"]),
        ThreatIncident.status == "DETECTED",
        ThreatIncident.created_at >= ten_mins_ago
    ).order_by(ThreatIncident.created_at.desc()).all()

    alerts = []
    for inc in urgent_incidents:
        spoken_alert = VoiceService.format_proactive_alert(inc, language=current_user.voice_language)
        alerts.append({
            "incident_id": inc.id,
            "title": inc.title,
            "severity": inc.severity,
            "spoken_alert": spoken_alert
        })

    return {"alerts": alerts}

@router.websocket("/ws")
async def live_voice_chat_websocket(websocket: WebSocket):
    """
    Enhanced Live Voice Chat WebSocket endpoint for bidirectional audio/conversational stream.
    Gracefully falls back to real-time text-speech pipeline if Gemini Live API is not streaming raw audio.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                transcript = msg.get("transcript", "")
                user_id = msg.get("user_id", 1)
                lang = msg.get("language", "en")

                parsed = VoiceService.parse_voice_command(
                    transcript=transcript,
                    user_id=user_id,
                    language=lang
                )

                response_payload = {
                    "type": "live_voice_response",
                    "reply_text": parsed["reply_text"],
                    "spoken_text": parsed["spoken_text"],
                    "detected_action": parsed["detected_action"],
                    "sentiment_urgency": parsed["sentiment_urgency"],
                    "timestamp": datetime.utcnow().isoformat()
                }
                await websocket.send_text(json.dumps(response_payload))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid payload format"}))
    except WebSocketDisconnect:
        pass
