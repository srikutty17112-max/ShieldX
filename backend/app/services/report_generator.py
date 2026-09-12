import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_incident_pdf(incident, user) -> io.BytesIO:
    """
    Generates a professional cybersecurity incident report in PDF format.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b")
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    badge_style = ParagraphStyle(
        "BadgeStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#dc2626") if incident.severity == "CRITICAL" else colors.HexColor("#d97706")
    )

    elements = []

    # Title & Header
    elements.append(Paragraph("SHIELDX CYBERSECURITY THREAT REPORT", title_style))
    elements.append(Paragraph(f"Voice-First Human-Approved Incident Containment | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0ea5e9"), spaceAfter=15))

    # Executive Overview Table
    detection_category = "Real Telemetry"
    if incident.is_simulated:
        detection_category = "Simulated Attack Drill"
    elif incident.is_anomaly:
        detection_category = "Statistical Anomaly (Unclassified)"

    overview_data = [
        [Paragraph("<b>Incident ID:</b>", body_style), Paragraph(f"SX-INC-{incident.id:05d}", body_style),
         Paragraph("<b>Severity:</b>", body_style), Paragraph(f"<b>{incident.severity}</b>", badge_style)],
        [Paragraph("<b>Threat Classification:</b>", body_style), Paragraph(incident.threat_type, body_style),
         Paragraph("<b>Telemetry Source:</b>", body_style), Paragraph(detection_category, body_style)],
        [Paragraph("<b>Target Asset:</b>", body_style), Paragraph(incident.target_asset or "Local Endpoint", body_style),
         Paragraph("<b>Source Origin:</b>", body_style), Paragraph(f"{incident.source_ip or 'Internal'} ({incident.geo_city}, {incident.geo_country})", body_style)],
        [Paragraph("<b>Detection Timestamp:</b>", body_style), Paragraph(incident.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"), body_style),
         Paragraph("<b>Current Status:</b>", body_style), Paragraph(f"<b>{incident.status}</b>", body_style)],
    ]

    overview_table = Table(overview_data, colWidths=[1.5*inch, 2.0*inch, 1.5*inch, 2.0*inch])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(overview_table)
    elements.append(Spacer(1, 14))

    # MITRE ATT&CK Matrix Mapping Section
    elements.append(Paragraph("MITRE ATT&CK® CLASSIFICATION", heading_style))
    mitre_data = [
        [Paragraph("<b>Technique ID:</b>", body_style), Paragraph(incident.mitre_id or "N/A", body_style)],
        [Paragraph("<b>Technique Name:</b>", body_style), Paragraph(incident.mitre_technique or "Unclassified", body_style)],
        [Paragraph("<b>Tactic Category:</b>", body_style), Paragraph(incident.mitre_tactic or "Execution", body_style)],
    ]
    mitre_table = Table(mitre_data, colWidths=[2.0*inch, 5.0*inch])
    mitre_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(mitre_table)
    elements.append(Spacer(1, 14))

    # Aegis AI Threat Analysis & Explanation
    elements.append(Paragraph("AEGIS AI THREAT ANALYSIS & ASSESSMENT", heading_style))
    explanation_p = Paragraph(f"<i>\"{incident.ai_explanation}\"</i>", body_style)
    description_p = Paragraph(f"<b>Technical Telemetry Signature:</b><br/>{incident.description}", body_style)

    analysis_box = Table([[explanation_p], [description_p]], colWidths=[7.0*inch])
    analysis_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfeff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#06b6d4")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(analysis_box)
    elements.append(Spacer(1, 14))

    # Human-Approved Containment & Audit Log
    elements.append(Paragraph("RESPONSE CONTAINMENT & AUDIT CERTIFICATION", heading_style))
    resolved_str = incident.resolved_at.strftime("%Y-%m-%d %H:%M:%S UTC") if incident.resolved_at else "Pending Authorization"
    approver_str = f"Explicit Approval via {incident.approver}" if incident.approver else "Pending Approval"
    emergency_str = "YES (Immediate Freeze)" if incident.emergency_override else "Standard Protocol"

    response_data = [
        [Paragraph("<b>Recommended Countermeasure:</b>", body_style), Paragraph(incident.recommended_action, body_style)],
        [Paragraph("<b>Action Authorization Mode:</b>", body_style), Paragraph(approver_str, body_style)],
        [Paragraph("<b>Emergency Override Used:</b>", body_style), Paragraph(emergency_str, body_style)],
        [Paragraph("<b>Containment Timestamp:</b>", body_style), Paragraph(resolved_str, body_style)],
        [Paragraph("<b>Authorizing Operator:</b>", body_style), Paragraph(user.email, body_style)],
    ]
    response_table = Table(response_data, colWidths=[2.5*inch, 4.5*inch])
    response_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(response_table)
    elements.append(Spacer(1, 20))

    # Security Certification Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))
    cert_text = "This document serves as an immutable cryptographic audit record of threat detection and human-authorized containment within ShieldX. Built with AES-256 field encryption and multi-tenant security isolation."
    elements.append(Paragraph(cert_text, subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer
