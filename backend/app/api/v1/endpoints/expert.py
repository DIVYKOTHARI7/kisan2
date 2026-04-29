from fastapi import APIRouter

router = APIRouter()

@router.get("/consultations")
def get_expert_consultations():
    return {"consultations": []}

@router.post("/consultations/{id}/respond")
def respond_to_consultation(id: str, response: dict):
    return {"success": True, "message": "Response sent"}
