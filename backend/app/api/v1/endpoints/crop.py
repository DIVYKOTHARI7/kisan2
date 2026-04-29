from fastapi import APIRouter
from app.schemas.crop import CropRecommendationInput, CropRecommendationResponse
from app.services.ml_service import get_crop_recommendations

router = APIRouter()

@router.post("/recommend", response_model=CropRecommendationResponse)
async def recommend_crop(data: CropRecommendationInput):
    return await get_crop_recommendations(data)
