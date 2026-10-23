from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.adapters.api.routes.health import router as health_router
from app.adapters.api.routes.pedidos import router as pedidos_router
from app.adapters.api.routes.catalogo import router as catalogo_router
from app.infrastructure.config import settings

app = FastAPI(
    title=settings.app_name,
    description="API del Sistema de Gestión de Pedidos y Delivery",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(pedidos_router, prefix="/api/pedidos")
app.include_router(catalogo_router, prefix="/api/catalogo")

@app.get("/")
def root(): 
    return {
        "message": "Delivery Express API",
        "docs": "/docs",
        "health": "/api/health",
        "catalogo": "/api/catalogo/productos", 
    }
