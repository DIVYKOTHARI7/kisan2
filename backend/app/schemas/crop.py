from pydantic import BaseModel
from typing import List, Optional

class CropRecommendationInput(BaseModel):
    n: float
    p: float
    k: float
    ph: float
    soilType: str
    season: str
    irrigation: str
    budget: float
    risk: str = "medium"
    state: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    language: str = "en"

class CropRecommendationResult(BaseModel):
    crop: str
    emoji: str
    matchScore: int
    expectedYield: str
    expectedProfit: float
    riskLevel: str
    reason: str
    tips: List[str]

class CropRecommendationResponse(BaseModel):
    recommendations: List[CropRecommendationResult]
