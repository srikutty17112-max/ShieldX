import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routers import auth, agents, telemetry, incidents, voice, audit, stats

app = FastAPI(
    title="ShieldX API",
    description="Voice-First, AI-Powered Cybersecurity Threat Detection & Human-Approved Response Platform",
    version="1.0.0"
)

# CORS configuration
origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def on_startup():
    init_db()

# Mount routers
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(telemetry.router)
app.include_router(incidents.router)
app.include_router(voice.router)
app.include_router(audit.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {
        "name": "ShieldX",
        "status": "online",
        "description": "Voice-First AI Cybersecurity Threat Detection & Human-Approved Response Engine",
        "version": "1.0.0",
        "ai_assistant": "Aegis",
        "documentation": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected"}
