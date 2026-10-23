from fastapi import APIRouter

router = APIRouter(tags=["Sistema"])

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "delivery-express-api",
        "message": "La API está funcionando.",
    }
