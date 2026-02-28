"""LifeSevatra Backend — FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, admissions, beds, staff, dashboard, doctor, vitals, files

app = FastAPI(
    title="LifeSevatra API",
    description="Hospital management backend for LifeSevatra",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(admissions.router, prefix="/api")
app.include_router(beds.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(doctor.router, prefix="/api")
app.include_router(vitals.router, prefix="/api")
app.include_router(files.router, prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "app": "LifeSevatra API",
        "version": "1.0.0",
        "docs": "/docs",
    }
