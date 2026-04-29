from fastapi import APIRouter

router = APIRouter()

@router.get("/users")
def get_all_users():
    return {"users": []}

@router.get("/system-stats")
def get_system_stats():
    return {
        "active_farmers": 12500,
        "total_crops_scanned": 45000,
        "system_health": "Healthy"
    }
