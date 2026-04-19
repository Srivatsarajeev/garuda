from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Enable CORS (important for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📦 Data Model
class SoldierData(BaseModel):
    id: str
    heart_rate: int
    temperature: float
    latitude: float
    longitude: float

# 🗄️ Temporary database (list)
database = []

# 📥 API to receive soldier data
@app.post("/send-data")
def receive_data(data: SoldierData):
    status = "SAFE"

    # 🚨 Simple condition check
    if data.heart_rate > 120 or data.temperature > 38:
        status = "DANGER"

    soldier = {
        "id": data.id,
        "heart_rate": data.heart_rate,
        "temperature": data.temperature,
        "location": [data.latitude, data.longitude],
        "status": status
    }

    database.append(soldier)

    return {
        "message": "Data received successfully",
        "status": status
    }

# 📤 API to get all soldier data
@app.get("/get-status")
def get_status():
    return database