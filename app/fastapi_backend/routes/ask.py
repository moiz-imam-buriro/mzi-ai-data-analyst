from fastapi import APIRouter

from app.ai.insights import ask as answer_question
from app.fastapi_backend.models import AskRequest

router = APIRouter(tags=["Ask"])


@router.post("/ask")
def ask_question(request: AskRequest):
    question = request.question.strip()
    if not question:
        return {"error": "Please type a question."}
    return answer_question(question)
