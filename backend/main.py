import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers.cases import router as cases_router
from app.core.config import settings

app = FastAPI(
    title="Rekishi Forensics API",
    description="Multi-Modal AI Pipeline for Traffic Accident Collision Reconstruction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Static file serving for uploaded evidence and videos
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Forensics Router
app.include_router(cases_router)

@app.get("/")
def root():
    return {
        "service": "Rekishi Forensics API",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "cases": "/api/cases",
            "sample_report": "/api/cases/CASE-101/report",
            "sample_trajectory": "/api/cases/CASE-101/trajectory"
        }
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Rekishi Forensics Engine",
        "version": "1.0.0",
        "aiProvidersConfigured": {
            "groq": bool(settings.GROQ_API_KEY),
            "gemini": bool(settings.GEMINI_API_KEY),
            "nvidia": bool(settings.NVIDIA_API_KEY),
            "featherless": bool(settings.FEATHERLESS_API_KEY),
            "offlineFallback": True
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
