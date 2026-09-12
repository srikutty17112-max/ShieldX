from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AuditLog, User
from backend.app.schemas import AuditLogOut
from backend.app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [AuditLogOut.from_orm(l) for l in logs]
