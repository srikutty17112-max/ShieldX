import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Device, ThreatIncident, User
from app.schemas import DashboardStats, NetworkNode, NetworkEdge
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/stats", tags=["Dashboard Statistics"])

@router.get("", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    devices = db.query(Device).filter(Device.user_id == current_user.id).all()
    total_dev = len(devices)
    active_dev = sum(1 for d in devices if d.is_active)

    incidents = db.query(ThreatIncident).filter(ThreatIncident.user_id == current_user.id).all()
    total_inc = len(incidents)
    active_threats = sum(1 for i in incidents if i.status == "DETECTED")
    blocked_threats = sum(1 for i in incidents if i.status == "CONTAINED")
    anomalies = sum(1 for i in incidents if i.is_anomaly)

    # Compute overall threat level
    high_critical = sum(1 for i in incidents if i.status == "DETECTED" and i.severity in ["HIGH", "CRITICAL"])
    if high_critical >= 3:
        overall_level = "CRITICAL"
    elif high_critical >= 1:
        overall_level = "ELEVATED"
    elif active_threats > 0:
        overall_level = "MODERATE"
    else:
        overall_level = "SECURE"

    # Tactical Network Activity Graph Nodes & Edges
    nodes = [
        NetworkNode(id="core-gateway", label="ShieldX Core Gateway", type="firewall", status="healthy"),
        NetworkNode(id="cloud-mesh", label="Secure Cloud Mesh", type="cloud", status="healthy")
    ]
    edges = [
        NetworkEdge(source="core-gateway", target="cloud-mesh", protocol="TLS 1.3", volume="1.2 Gbps", threat=False)
    ]

    # Add user devices as network nodes
    for idx, d in enumerate(devices[:5]):
        node_id = f"dev-{d.id}"
        is_targeted = any(i.device_id == d.id and i.status == "DETECTED" for i in incidents)
        status_val = "critical" if is_targeted else "healthy"
        nodes.append(NetworkNode(
            id=node_id,
            label=f"{d.device_name} ({d.os_type})",
            type="agent",
            status=status_val
        ))
        edges.append(NetworkEdge(
            source=node_id,
            target="core-gateway",
            protocol="HTTPS/Telemetry",
            volume="48 KB/s",
            threat=is_targeted
        ))

    # Add active threat source nodes
    recent_threats = [i for i in incidents if i.status == "DETECTED"][:4]
    for idx, t in enumerate(recent_threats):
        threat_node_id = f"threat-{t.id}"
        nodes.append(NetworkNode(
            id=threat_node_id,
            label=f"{t.source_ip or 'Inbound'} ({t.mitre_id or t.threat_type})",
            type="threat",
            status="critical"
        ))
        edges.append(NetworkEdge(
            source=threat_node_id,
            target="core-gateway",
            protocol=t.threat_type,
            volume="MALICIOUS",
            threat=True
        ))

    return DashboardStats(
        total_devices=total_dev,
        active_devices=active_dev,
        total_incidents=total_inc,
        active_threats=active_threats,
        blocked_threats=blocked_threats,
        anomalies_detected=anomalies,
        overall_threat_level=overall_level,
        network_nodes=nodes,
        network_edges=edges
    )
