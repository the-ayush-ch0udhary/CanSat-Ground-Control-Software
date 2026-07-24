from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


# -------------------- Setup --------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

app = FastAPI(title="CanSat GCS API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("cansat-gcs")


# -------------------- Utils --------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 12,
        path="/",
    )


# -------------------- Models --------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "operator"


class TelemetryPacket(BaseModel):
    mission_id: str
    packet_number: int
    mission_time: float
    phase: str
    altitude: float
    pressure: float
    temperature: float
    humidity: float
    voltage: float
    battery: float
    latitude: float
    longitude: float
    satellites: int
    roll: float
    pitch: float
    yaw: float
    descent_rate: float
    velocity: float
    accel_x: float
    accel_y: float
    accel_z: float
    container_status: str
    payload_status: str
    error_code: str
    created_at: Optional[str] = None


class MissionLogEntry(BaseModel):
    mission_id: str
    level: str  # info | warning | critical | success
    message: str
    created_at: Optional[str] = None


class MissionCommand(BaseModel):
    mission_id: str
    command: str
    result: str  # success | failure
    created_at: Optional[str] = None


# -------------------- Auth Routes --------------------
@api_router.post("/auth/register")
async def register(inp: RegisterInput, response: Response):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(inp.password),
        "name": inp.name or email.split("@")[0],
        "role": "operator",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {
        "user": {"id": user_id, "email": email, "name": doc["name"], "role": doc["role"]},
        "token": token,
    }


@api_router.post("/auth/login")
async def login(inp: LoginInput, response: Response):
    email = inp.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return {
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "operator"),
        },
        "token": token,
    }


@api_router.post("/auth/logout")
async def logout(response: Response, current=Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return {"user": {"id": current["id"], "email": current["email"], "name": current.get("name"), "role": current.get("role", "operator")}}


# -------------------- Telemetry Routes --------------------
@api_router.post("/telemetry/packet")
async def save_packet(pkt: TelemetryPacket, current=Depends(get_current_user)):
    doc = pkt.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["user_id"] = current["id"]
    await db.telemetry.insert_one(doc)
    return {"success": True}


@api_router.post("/telemetry/batch")
async def save_batch(packets: List[TelemetryPacket], current=Depends(get_current_user)):
    if not packets:
        return {"inserted": 0}
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for pkt in packets:
        d = pkt.model_dump()
        d["created_at"] = now
        d["user_id"] = current["id"]
        docs.append(d)
    result = await db.telemetry.insert_many(docs)
    return {"inserted": len(result.inserted_ids)}


@api_router.get("/telemetry/mission/{mission_id}")
async def get_mission_packets(mission_id: str, limit: int = Query(1000, le=5000), current=Depends(get_current_user)):
    cursor = db.telemetry.find({"mission_id": mission_id, "user_id": current["id"]}, {"_id": 0}).sort("packet_number", 1).limit(limit)
    return await cursor.to_list(limit)


@api_router.get("/missions")
async def list_missions(current=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current["id"]}},
        {"$group": {
            "_id": "$mission_id",
            "packet_count": {"$sum": 1},
            "last_packet": {"$max": "$packet_number"},
            "last_time": {"$max": "$created_at"},
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": 50},
    ]
    docs = await db.telemetry.aggregate(pipeline).to_list(50)
    return [{"mission_id": d["_id"], "packet_count": d["packet_count"], "last_time": d["last_time"]} for d in docs]


# -------------------- Mission Log Routes --------------------
@api_router.post("/log/entry")
async def add_log(entry: MissionLogEntry, current=Depends(get_current_user)):
    doc = entry.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["user_id"] = current["id"]
    await db.mission_logs.insert_one(doc)
    return {"success": True}


@api_router.get("/log/mission/{mission_id}")
async def get_log(mission_id: str, current=Depends(get_current_user)):
    cursor = db.mission_logs.find({"mission_id": mission_id, "user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).limit(500)
    return await cursor.to_list(500)


# -------------------- Command Routes --------------------
@api_router.post("/command")
async def send_command(cmd: MissionCommand, current=Depends(get_current_user)):
    doc = cmd.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["user_id"] = current["id"]
    await db.commands.insert_one(doc)
    return {"success": True, "command": cmd.command, "result": cmd.result}


# -------------------- Health --------------------
@api_router.get("/")
async def root():
    return {"status": "ok", "service": "CanSat GCS API", "time": datetime.now(timezone.utc).isoformat()}


@api_router.get("/health")
async def health():
    db_ok = False
    try:
        await db.command("ping")
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "up" if db_ok else "down",
        "service": "CanSat GCS API",
        "time": datetime.now(timezone.utc).isoformat(),
    }


# -------------------- Export & Statistics --------------------
_CSV_COLS = [
    "packet_number", "mission_time", "phase", "altitude", "pressure",
    "temperature", "humidity", "voltage", "battery", "latitude",
    "longitude", "satellites", "roll", "pitch", "yaw", "descent_rate",
    "velocity", "accel_x", "accel_y", "accel_z", "container_status",
    "payload_status", "error_code",
]


@api_router.get("/telemetry/export/csv/{mission_id}")
async def export_mission_csv(mission_id: str, current=Depends(get_current_user)):
    cursor = db.telemetry.find({"mission_id": mission_id, "user_id": current["id"]}, {"_id": 0}).sort("packet_number", 1)
    docs = await cursor.to_list(10000)
    lines = [",".join(_CSV_COLS)]
    for d in docs:
        row = []
        for c in _CSV_COLS:
            v = d.get(c, "")
            if isinstance(v, str) and "," in v:
                v = f'"{v}"'
            row.append(str(v) if v is not None else "")
        lines.append(",".join(row))
    csv_body = "\n".join(lines)
    headers = {"Content-Disposition": f'attachment; filename="{mission_id}_telemetry.csv"'}
    return PlainTextResponse(content=csv_body, media_type="text/csv", headers=headers)


@api_router.get("/telemetry/export/json/{mission_id}")
async def export_mission_json(mission_id: str, current=Depends(get_current_user)):
    cursor = db.telemetry.find({"mission_id": mission_id, "user_id": current["id"]}, {"_id": 0}).sort("packet_number", 1)
    docs = await cursor.to_list(10000)
    headers = {"Content-Disposition": f'attachment; filename="{mission_id}_telemetry.json"'}
    return JSONResponse(content={"mission_id": mission_id, "packets": docs, "count": len(docs)}, headers=headers)


@api_router.get("/statistics/mission/{mission_id}")
async def mission_statistics(mission_id: str, current=Depends(get_current_user)):
    pipeline = [
        {"$match": {"mission_id": mission_id, "user_id": current["id"]}},
        {"$group": {
            "_id": None,
            "packet_count": {"$sum": 1},
            "max_altitude": {"$max": "$altitude"},
            "min_altitude": {"$min": "$altitude"},
            "avg_altitude": {"$avg": "$altitude"},
            "max_velocity": {"$max": "$velocity"},
            "min_velocity": {"$min": "$velocity"},
            "max_descent_rate": {"$max": "$descent_rate"},
            "avg_temperature": {"$avg": "$temperature"},
            "min_temperature": {"$min": "$temperature"},
            "max_temperature": {"$max": "$temperature"},
            "min_battery": {"$min": "$battery"},
            "max_battery": {"$max": "$battery"},
            "min_pressure": {"$min": "$pressure"},
            "max_pressure": {"$max": "$pressure"},
            "first_time": {"$min": "$mission_time"},
            "last_time": {"$max": "$mission_time"},
        }},
    ]
    docs = await db.telemetry.aggregate(pipeline).to_list(1)
    if not docs:
        return {"mission_id": mission_id, "packet_count": 0, "phases": [], "errors": 0}
    stats = docs[0]
    stats.pop("_id", None)
    stats["mission_id"] = mission_id
    stats["duration_seconds"] = round((stats.get("last_time") or 0) - (stats.get("first_time") or 0), 1)
    # phase counts
    ph_pipeline = [
        {"$match": {"mission_id": mission_id, "user_id": current["id"]}},
        {"$group": {"_id": "$phase", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    phases = await db.telemetry.aggregate(ph_pipeline).to_list(20)
    stats["phases"] = [{"phase": p["_id"], "count": p["count"]} for p in phases]
    # error count
    err_count = await db.telemetry.count_documents({
        "mission_id": mission_id,
        "user_id": current["id"],
        "error_code": {"$ne": "0000"},
    })
    stats["errors"] = err_count
    return stats


# -------------------- Startup --------------------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.telemetry.create_index([("mission_id", 1), ("packet_number", 1)])
    await db.telemetry.create_index("user_id")
    await db.mission_logs.create_index([("mission_id", 1), ("created_at", -1)])

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "operator@aerotech.io").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "AeroTech@2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Mission Operator",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info(f"Updated admin password: {admin_email}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
