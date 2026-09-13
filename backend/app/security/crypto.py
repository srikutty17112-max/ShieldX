import base64
import os
from datetime import datetime, timedelta
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings

def get_cipher(key_str: str = None) -> Fernet:
    k = key_str or settings.ENCRYPTION_KEY
    # Ensure key is 32 url-safe base64 bytes
    try:
        return Fernet(k.encode() if isinstance(k, str) else k)
    except Exception:
        # Fallback or derive valid Fernet key
        padded = (k + "=" * 32)[:32].encode()
        b64 = base64.urlsafe_b64encode(padded)
        return Fernet(b64)

cipher = get_cipher()

def encrypt_field(plaintext: str) -> str:
    """Encrypt a sensitive string field using AES-256 Fernet."""
    if not plaintext:
        return ""
    token = cipher.encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8")

def decrypt_field(ciphertext: str) -> str:
    """Decrypt an AES-256 Fernet encrypted field."""
    if not ciphertext:
        return ""
    try:
        decrypted = cipher.decrypt(ciphertext.encode("utf-8"))
        return decrypted.decode("utf-8")
    except InvalidToken:
        return ciphertext  # fallback if unencrypted

def rotate_field_value(ciphertext: str, old_key: str, new_key: str) -> str:
    """Decrypt with old key and re-encrypt with new key for key rotation."""
    old_c = get_cipher(old_key)
    new_c = get_cipher(new_key)
    try:
        decrypted = old_c.decrypt(ciphertext.encode("utf-8"))
        return new_c.encrypt(decrypted).decode("utf-8")
    except Exception:
        return ciphertext
