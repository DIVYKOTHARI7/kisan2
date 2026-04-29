from pydantic import BaseModel
from typing import List

class CurrentWeather(BaseModel):
    tempC: float
    condition: str
    humidity: int
    wind: str
    rainProbability: int

class ForecastDay(BaseModel):
    day: str
    icon: str
    high: int
    low: int
    rain: int

class WeatherResponse(BaseModel):
    current: CurrentWeather
    forecast: List[ForecastDay]
    smartAlert: str
