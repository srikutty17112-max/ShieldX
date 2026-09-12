import sys
import os
import argparse
import secrets
import base64
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.models import Device, User, KeyRotationAudit
from backend.app.security.crypto import rotate_field_value, get_cipher
from backend.app.config import settings

def rotate_encryption_keys(old_key: str, new_key: str):
    """
    Rotates field-level encryption keys:
    1. Validates both old and new keys.
    2. Decrypts sensitive fields with old key.
    3. Re-encrypts with new key.
    4. Audits the rotation in database.
    """
    print(f"[*] Initiating ShieldX Encryption Key Rotation...")
    print(f"[*] Old Key Prefix: {old_key[:8]}...")
    print(f"[*] New Key Prefix: {new_key[:8]}...")

    db: Session = SessionLocal()
    updated_count = 0

    try:
        # 1. Rotate Device API Keys
        devices = db.query(Device).all()
        for dev in devices:
            if dev.api_key_encrypted:
                dev.api_key_encrypted = rotate_field_value(dev.api_key_encrypted, old_key, new_key)
                updated_count += 1

        # 2. Rotate User OAuth Tokens
        users = db.query(User).filter(User.oauth_access_token_encrypted.isnot(None)).all()
        for u in users:
            if u.oauth_access_token_encrypted:
                u.oauth_access_token_encrypted = rotate_field_value(u.oauth_access_token_encrypted, old_key, new_key)
                updated_count += 1

        # 3. Log Audit
        audit = KeyRotationAudit(
            rotated_at=datetime.utcnow(),
            old_key_prefix=old_key[:8] + "...",
            new_key_prefix=new_key[:8] + "...",
            records_updated=updated_count
        )
        db.add(audit)
        db.commit()

        print(f"[+] Key Rotation Complete! Successfully re-encrypted {updated_count} sensitive database records.")
        print(f"[!] IMPORTANT: Update ENCRYPTION_KEY in your .env or Render dashboard to:")
        print(f"    ENCRYPTION_KEY={new_key}")

    except Exception as e:
        db.rollback()
        print(f"[-] Key rotation failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ShieldX AES-256 Key Rotation Utility")
    parser.add_argument("--old-key", default=settings.ENCRYPTION_KEY, help="Current encryption key")
    parser.add_argument("--new-key", default=None, help="New 32-byte urlsafe base64 key")

    args = parser.parse_args()

    new_key = args.new_key
    if not new_key:
        # Generate fresh Fernet key
        new_key = Fernet.generate_key().decode()

    rotate_encryption_keys(args.old_key, new_key)
