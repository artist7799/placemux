import time
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import resume, match

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service.main")

app = FastAPI(
    title="PlaceMux AI Microservice",
    description=(
        "Production-grade Python FastAPI AI microservice for PlaceMux platform. "
        "Provides explainable resume parsing & scoring and candidate-to-job match recommendation engines."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Request Logging & Response Timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms}ms")
    return response

# Custom Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "Internal AI Service Error",
            "detail": str(exc)
        }
    )

# Include API Routers
app.include_router(resume.router)
app.include_router(match.router)

@app.get("/health", tags=["Health Check"])
async def health_check():
    """Service health monitoring endpoint."""
    return {
        "status": "healthy",
        "service": "PlaceMux AI Microservice",
        "version": "1.0.0",
        "timestamp": time.time()
    }
