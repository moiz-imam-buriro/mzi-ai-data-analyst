from fastapi import APIRouter, HTTPException

from app.fastapi_backend.services.files_service import delete_file, get_files

router = APIRouter(tags=["Files"])


@router.get("/files")
def list_files():
    return {"files": get_files()}


@router.delete("/files/{file_id}")
def remove_file(file_id: int):
    if not delete_file(file_id):
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": True}