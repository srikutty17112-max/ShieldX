from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate, UserLogin, UserOut, Token, OAuthLoginRequest, UserSettingsUpdate
)
from app.security.auth import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from app.security.oauth import verify_google_token, verify_apple_token
from app.security.crypto import encrypt_field
from app.security.rate_limiter import auth_limiter

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token)
def signup(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    auth_limiter.check(request)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(payload.password)
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pw,
        full_name=payload.full_name or payload.email.split("@")[0],
        oauth_provider="local"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    return Token(access_token=access_token, user=UserOut.from_orm(new_user))

@router.post("/login", response_model=Token)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    auth_limiter.check(request)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(access_token=access_token, user=UserOut.from_orm(user))

@router.post("/oauth", response_model=Token)
async def oauth_login(request: Request, payload: OAuthLoginRequest, db: Session = Depends(get_db)):
    auth_limiter.check(request)

    if payload.provider == "google":
        oauth_data = await verify_google_token(payload.id_token)
    elif payload.provider == "apple":
        oauth_data = await verify_apple_token(payload.id_token, payload.email, payload.full_name)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")

    email = oauth_data.get("email")
    sub = oauth_data.get("sub")
    name = oauth_data.get("name") or payload.full_name or (email.split("@")[0] if email else "User")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OAuth provider did not return an email.")

    # Find existing user by email or OAuth sub
    user = db.query(User).filter((User.email == email) | (User.oauth_sub == sub)).first()

    if not user:
        # Create user without local password (pure OAuth identity)
        user = User(
            email=email,
            hashed_password=None,
            full_name=name,
            oauth_provider=payload.provider,
            oauth_sub=sub,
            oauth_access_token_encrypted=encrypt_field(payload.id_token[:64])
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Link OAuth provider if not already linked
        if not user.oauth_sub:
            user.oauth_sub = sub
            user.oauth_provider = payload.provider
            db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(access_token=access_token, user=UserOut.from_orm(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.from_orm(current_user)

@router.patch("/settings", response_model=UserOut)
def update_settings(payload: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.voice_language and payload.voice_language in ["en", "ta", "hi"]:
        current_user.voice_language = payload.voice_language
    if payload.live_voice_enabled is not None:
        current_user.live_voice_enabled = payload.live_voice_enabled
    db.commit()
    db.refresh(current_user)
    return UserOut.from_orm(current_user)
