from typing import List

from fastapi import APIRouter, File, UploadFile

from app.fastapi_backend.services.upload_service import process_file

router = APIRouter(tags=["Upload"])


@router.post("/upload")
def upload(files: List[UploadFile] = File(...)):
    results = [process_file(f.filename, f.file.read()) for f in files]
    return {"results": results}
