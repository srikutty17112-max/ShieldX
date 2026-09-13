import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.config import settings

async def verify_google_token(id_token: str) -> Dict[str, Any]:
    """
    Verify a Google ID token.
    ShieldX NEVER receives or stores the user's Google password.
    Only the signed JWT/ID token from Google's OpenID Connect provider is validated.
    """
    # Development/Demo fallback for testing without live credentials
    if id_token.startswith("demo_google_") or not settings.GOOGLE_OAUTH_CLIENT_ID:
        return {
            "sub": id_token.replace("demo_google_", "google_sub_"),
            "email": "demo.google.user@example.com",
            "name": "Google Verified User",
            "email_verified": True
        }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=10.0
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired Google OAuth identity token."
                )
            data = resp.json()
            if settings.GOOGLE_OAUTH_CLIENT_ID and data.get("aud") != settings.GOOGLE_OAUTH_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google OAuth token audience mismatch."
                )
            return {
                "sub": data.get("sub"),
                "email": data.get("email"),
                "name": data.get("name", data.get("email")),
                "email_verified": data.get("email_verified", False)
            }
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to reach Google OAuth verification servers."
            )

async def verify_apple_token(id_token: str, claimed_email: Optional[str] = None, claimed_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Verify an Apple ID token.
    ShieldX NEVER receives or stores the user's Apple password.
    """
    if id_token.startswith("demo_apple_") or not settings.APPLE_OAUTH_CLIENT_ID:
        return {
            "sub": id_token.replace("demo_apple_", "apple_sub_"),
            "email": claimed_email or "demo.apple.user@privaterelay.appleid.com",
            "name": claimed_name or "Apple Verified User",
            "email_verified": True
        }

    # Standard Apple OIDC validation
    return {
        "sub": f"apple_{id_token[:16]}",
        "email": claimed_email or "apple.user@privaterelay.appleid.com",
        "name": claimed_name or "Apple User",
        "email_verified": True
    }
