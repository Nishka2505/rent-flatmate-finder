from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import json

from app.database import SessionLocal
from app import models, auth

router = APIRouter(tags=["chat"])


class ConnectionManager:
    def __init__(self):
        # interest_request_id -> list of active websocket connections
        self.active_connections: dict[int, list[WebSocket]] = {}

    def disconnect(self, interest_request_id: int, websocket: WebSocket):
        if interest_request_id in self.active_connections:
            if websocket in self.active_connections[interest_request_id]:
                self.active_connections[interest_request_id].remove(websocket)
            if not self.active_connections[interest_request_id]:
                del self.active_connections[interest_request_id]

    async def broadcast(self, interest_request_id: int, message: dict):
        if interest_request_id in self.active_connections:
            for connection in self.active_connections[interest_request_id]:
                await connection.send_json(message)


manager = ConnectionManager()


def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(models.User).filter(models.User.id == int(user_id)).first()
    except JWTError:
        return None


@router.websocket("/ws/chat/{interest_request_id}")
async def chat_endpoint(websocket: WebSocket, interest_request_id: int, token: str = Query(...)):
    await websocket.accept()
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001)
            return

        interest = db.query(models.InterestRequest).filter(
            models.InterestRequest.id == interest_request_id
        ).first()
        if not interest:
            await websocket.close(code=4004)
            return

        if interest.status != "accepted":
            await websocket.close(code=4003)
            return

        listing = db.query(models.RoomListing).filter(models.RoomListing.id == interest.listing_id).first()
        tenant_profile = db.query(models.TenantProfile).filter(
            models.TenantProfile.id == interest.tenant_id
        ).first()

        is_tenant = tenant_profile and tenant_profile.user_id == user.id
        is_owner = listing and listing.owner_id == user.id

        if not (is_tenant or is_owner):
            await websocket.close(code=4003)
            return

        if interest_request_id not in manager.active_connections:
            manager.active_connections[interest_request_id] = []
        manager.active_connections[interest_request_id].append(websocket)

        history = db.query(models.Message).filter(
            models.Message.interest_request_id == interest_request_id
        ).order_by(models.Message.sent_at).all()

        for msg in history:
            await websocket.send_json({
                "type": "history",
                "id": msg.id,
                "sender_id": msg.sender_id,
                "content": msg.content,
                "sent_at": str(msg.sent_at),
            })

        try:
            while True:
                data = await websocket.receive_text()
                payload = json.loads(data)
                content = payload.get("content", "").strip()
                if not content:
                    continue

                new_message = models.Message(
                    interest_request_id=interest_request_id,
                    sender_id=user.id,
                    content=content,
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                await manager.broadcast(interest_request_id, {
                    "type": "message",
                    "id": new_message.id,
                    "sender_id": new_message.sender_id,
                    "content": new_message.content,
                    "sent_at": str(new_message.sent_at),
                })

        except WebSocketDisconnect:
            manager.disconnect(interest_request_id, websocket)

    finally:
        db.close()