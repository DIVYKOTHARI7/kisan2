from typing import List
from fastapi import APIRouter
from app.services.schemes_service import get_all_schemes, Scheme

router = APIRouter()

@router.get("/", response_model=List[Scheme])
def read_schemes():
    return get_all_schemes()
