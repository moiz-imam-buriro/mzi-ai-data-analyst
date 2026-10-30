from fastapi import APIRouter, HTTPException

from app.database.db import get_connection

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    try:
        get_connection().close()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not reachable: {e}")
    return {"status": "ok"}