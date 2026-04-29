from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.disease import DiseaseDetectionResponse, DiseaseAnalysisResponse
from app.services.ml_service import get_disease_detection
from app.services.disease_service import analyze_disease_from_image

router = APIRouter()

@router.post("/detect", response_model=DiseaseDetectionResponse)
async def detect_disease():
    """Legacy endpoint for backward compatibility."""
    return await get_disease_detection()


@router.post("/analyze", response_model=DiseaseAnalysisResponse)
async def analyze_disease(file: UploadFile = File(...)):
    """
    Full disease analysis endpoint — accepts image upload, 
    uses Gemini Vision AI to identify plant diseases with detailed treatment plans.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    content_type = file.content_type or "image/jpeg"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: JPEG, PNG, WebP. Got: {content_type}"
        )
    
    # Validate file size (max 10MB)
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image too large. Maximum size is 10MB."
        )
    
    result = await analyze_disease_from_image(image_bytes, content_type)
    return result
