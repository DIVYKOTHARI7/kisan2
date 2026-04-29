from pydantic import BaseModel
from typing import List, Optional

class TreatmentStep(BaseModel):
    step: int
    description: str
    type: str = "chemical"  # "organic" | "chemical" | "preventive"

class DiseaseInfo(BaseModel):
    disease_name: str
    disease_name_hindi: str
    crop_name: str
    crop_name_hindi: str
    confidence: float
    severity: str  # LOW | MEDIUM | HIGH | CRITICAL
    severity_hindi: str
    affected_area_percent: int
    description: str
    description_hindi: str
    symptoms: List[str]
    symptoms_hindi: List[str]
    organic_treatment: List[TreatmentStep]
    chemical_treatment: List[TreatmentStep]
    prevention_tips: List[str]
    prevention_tips_hindi: List[str]
    estimated_cost_inr: str
    recovery_time: str
    spread_risk: str  # low | medium | high
    scientific_name: Optional[str] = None

class DiseaseDetectionResult(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    treatment_plan: List[TreatmentStep]
    estimated_cost: str

class DiseaseDetectionResponse(BaseModel):
    detections: List[DiseaseDetectionResult]

class DiseaseAnalysisResponse(BaseModel):
    success: bool
    disease: Optional[DiseaseInfo] = None
    error: Optional[str] = None
    analysis_id: Optional[str] = None
