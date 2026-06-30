import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const fetchRooms = () => {
    api.get("/rooms/").then((res) => setRooms(res.data));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const expressInterest = async (listingId) => {
    setMessage("");
    try {
      await api.post("/tenants/interest", { listing_id: listingId });
      setMessage("Interest sent!");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to send interest");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Available Rooms</h2>
      {message && <p>{message}</p>}
      {rooms.length === 0 && <p>No rooms available right now.</p>}
      {rooms.map((room) => (
        <div
          key={room.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <h3>{room.location}</h3>
          <p>₹{room.rent}/month · {room.room_type} · {room.furnishing_status}</p>
          <p>Available from: {room.available_from}</p>
          {room.compatibility_score !== null && room.compatibility_score !== undefined && (
            <div
              style={{
                background: "#f0f8ff",
                padding: 10,
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              <strong>Compatibility Score: {room.compatibility_score}%</strong>
              <p style={{ margin: "4px 0 0", fontSize: 14 }}>
                {room.compatibility_explanation}
              </p>
            </div>
          )}
          {user?.role === "tenant" && (
            <button
              onClick={() => expressInterest(room.id)}
              style={{ marginTop: 10, padding: "8px 16px" }}
            >
              Express Interest
            </button>
          )}
        </div>
      ))}
    </div>
  );
}