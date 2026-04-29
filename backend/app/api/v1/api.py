from fastapi import APIRouter
from app.api.v1.endpoints import auth, crop, disease, weather, admin, expert, iot, chat, community, schemes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(crop.router, prefix="/crop", tags=["Crop"])
api_router.include_router(disease.router, prefix="/disease", tags=["Disease"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(expert.router, prefix="/expert", tags=["Expert"])
api_router.include_router(iot.router, prefix="/iot", tags=["IoT"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(community.router, prefix="/community", tags=["Community"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Schemes"])
