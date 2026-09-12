import os
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Device, User
from backend.app.schemas import DeviceCreate, DeviceOut, DeviceConfigOut
from backend.app.security.auth import get_current_user
from backend.app.security.crypto import encrypt_field, decrypt_field
from backend.app.config import settings

router = APIRouter(prefix="/api/v1/agents", tags=["Agent Provisioning"])

@router.post("/register", response_model=DeviceConfigOut)
def register_device(
    payload: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate fresh cryptographically secure API key
    raw_api_key = f"sx_live_{secrets.token_urlsafe(32)}"
    api_prefix = raw_api_key[:12] + "..."

    # Field-level AES-256 encryption
    encrypted_key = encrypt_field(raw_api_key)

    new_device = Device(
        user_id=current_user.id,
        device_name=payload.device_name,
        hostname=payload.hostname or payload.device_name.lower().replace(" ", "-"),
        os_type=payload.os_type.lower(),
        ip_address=payload.ip_address or "127.0.0.1",
        api_key_encrypted=encrypted_key,
        api_key_prefix=api_prefix,
        is_active=True,
        baseline_metrics="{}"
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    # Server URL for config
    server_url = f"http://localhost:{settings.PORT}"

    return DeviceConfigOut(
        device_id=new_device.id,
        device_name=new_device.device_name,
        api_key=raw_api_key,
        server_url=server_url
    )

@router.get("/list", response_model=List[DeviceOut])
def list_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Strict multi-tenant isolation
    devices = db.query(Device).filter(Device.user_id == current_user.id).order_by(Device.created_at.desc()).all()
    return [DeviceOut.from_orm(d) for d in devices]

@router.delete("/revoke/{device_id}")
def revoke_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    device.is_active = False
    db.commit()
    return {"status": "success", "message": f"Device {device.device_name} access revoked."}

@router.get("/config/{device_id}")
def download_config_file(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if not device or not device.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found or inactive")

    raw_key = decrypt_field(device.api_key_encrypted)
    config_data = {
        "device_id": device.id,
        "device_name": device.device_name,
        "api_key": raw_key,
        "server_url": f"http://localhost:{settings.PORT}",
        "telemetry_interval_seconds": 30
    }
    return JSONResponse(
        content=config_data,
        headers={"Content-Disposition": f"attachment; filename=shieldx_config.json"}
    )

@router.get("/download-agent")
def download_agent_script():
    agent_path = os.path.join(os.getcwd(), "agent", "shieldx_agent.py")
    if not os.path.exists(agent_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent script not found on server")
    return FileResponse(
        path=agent_path,
        filename="shieldx_agent.py",
        media_type="text/x-python"
    )
