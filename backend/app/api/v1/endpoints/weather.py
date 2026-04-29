from fastapi import APIRouter
from app.schemas.weather import WeatherResponse
from app.services.weather_service import get_current_weather

router = APIRouter()

@router.get("/current", response_model=WeatherResponse)
def current_weather(pincode: str = None):
    return get_current_weather(pincode=pincode)
