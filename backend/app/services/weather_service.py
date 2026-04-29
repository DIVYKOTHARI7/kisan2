from app.schemas.weather import WeatherResponse, CurrentWeather, ForecastDay

def get_current_weather(lat: float = None, lon: float = None, pincode: str = None) -> WeatherResponse:
    # MOCK DATA
    current = CurrentWeather(
        tempC=28.5,
        condition="Partly Cloudy",
        humidity=62,
        wind="12 km/h NE",
        rainProbability=20
    )
    
    forecast = [
        ForecastDay(day="Mon", icon="⛅", high=30, low=22, rain=10),
        ForecastDay(day="Tue", icon="🌧️", high=28, low=21, rain=80),
        ForecastDay(day="Wed", icon="🌧️", high=27, low=21, rain=60),
        ForecastDay(day="Thu", icon="⛅", high=29, low=22, rain=20),
        ForecastDay(day="Fri", icon="☀️", high=31, low=23, rain=0),
        ForecastDay(day="Sat", icon="☀️", high=32, low=24, rain=0),
        ForecastDay(day="Sun", icon="⛅", high=31, low=23, rain=10),
    ]
    
    return WeatherResponse(
        current=current,
        forecast=forecast,
        smartAlert="Heavy rain expected tomorrow — avoid fertilizer today"
    )
