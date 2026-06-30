from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models
from app.routers import auth_routes, rooms, tenants
from app import chat
# Create tables (fine for dev; we'll discuss migrations later if needed)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Rent & Flatmate Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000", "null", "*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(rooms.router)
app.include_router(tenants.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"Rent & Flatmate Finder API is running"}