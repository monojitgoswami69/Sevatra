import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.middleware import RequestLoggingMiddleware

# ── Domain routers ──
from app.ambi.routers import auth as ambi_auth
from app.ambi.routers import bookings, sos, tracking, users
from app.life.routers import admissions as life_admissions
from app.life.routers import auth as life_auth
from app.life.routers import beds as life_beds
from app.life.routers import dashboard as life_dashboard
from app.life.routers import doctor as life_doctor
from app.life.routers import files as life_files
from app.life.routers import staff as life_staff
from app.life.routers import vitals as life_vitals
from app.operato.routers import operators

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("🚀 %s starting (env=%s)", settings.app_name, settings.app_env)
    yield
    logger.info("👋 %s shutting down", settings.app_name)


# ── App ──
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "Unified backend for AmbiSevatra (ambulance booking), "
        "OperatoSevatra (operator management), and LifeSevatra (hospital management)."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ──
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception Handlers ──
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Routers ──
API_V1_PREFIX = "/api/v1"

# AmbiSevatra
app.include_router(ambi_auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(bookings.router, prefix=API_V1_PREFIX)
app.include_router(sos.router, prefix=API_V1_PREFIX)
app.include_router(tracking.router, prefix=API_V1_PREFIX)

# OperatoSevatra
app.include_router(operators.router, prefix=API_V1_PREFIX)

# LifeSevatra (Hospital Management)
app.include_router(life_auth.router, prefix=API_V1_PREFIX)
app.include_router(life_admissions.router, prefix=API_V1_PREFIX)
app.include_router(life_beds.router, prefix=API_V1_PREFIX)
app.include_router(life_staff.router, prefix=API_V1_PREFIX)
app.include_router(life_dashboard.router, prefix=API_V1_PREFIX)
app.include_router(life_vitals.router, prefix=API_V1_PREFIX)
app.include_router(life_files.router, prefix=API_V1_PREFIX)
app.include_router(life_doctor.router, prefix=API_V1_PREFIX)


# ── Health Check ──
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0",
    }


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
        "health": "/health",
    }
