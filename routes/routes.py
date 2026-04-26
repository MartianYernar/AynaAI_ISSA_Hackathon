from fastapi import APIRouter
from app.services.ai_service import generate_response

router = APIRouter()

@router.post("/chat")
def chat(message: str):
    reply = generate_response(message)
    return {"response": reply}