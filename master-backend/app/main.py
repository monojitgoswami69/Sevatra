import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.middleware import RequestLoggingMiddleware
from app.routers import auth, users, bookings, sos, operators
from app.routers import life_auth, life_admissions, life_beds, life_staff, life_dashboard, life_vitals, life_files, life_doctor

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
    description="Emergency medical transport booking backend — SOS + Scheduled rides",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ──
# RequestLoggingMiddleware must be added BEFORE CORSMiddleware
# so that CORS is the outermost layer (last added = outermost).
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
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(bookings.router, prefix=API_V1_PREFIX)
app.include_router(sos.router, prefix=API_V1_PREFIX)
app.include_router(operators.router, prefix=API_V1_PREFIX)

# ── Life (Hospital Management) ──
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
        "message": f"Welcome to {settings.app_name} API",
        "docs": "/docs",
        "health": "/health",
    }
