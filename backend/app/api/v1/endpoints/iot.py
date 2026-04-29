from fastapi import APIRouter

router = APIRouter()

@router.get("/sensors")
def get_iot_sensors():
    return {
        "sensors": [
            {"id": "sensor_1", "type": "soil_moisture", "value": 45, "status": "active"},
            {"id": "sensor_2", "type": "temperature", "value": 28.5, "status": "active"}
        ]
    }
