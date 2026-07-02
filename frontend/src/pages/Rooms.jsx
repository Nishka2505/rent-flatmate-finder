import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

const PHOTOS = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=200&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=200&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=200&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=200&fit=crop",
];

function ScoreRing({ score }) {
  const size = 52, stroke = 4.5, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#b8e8d8" : score >= 50 ? "#f5d4b8" : "#f4c2d8";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{score}%</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div className="shimmer" style={{ height: 170 }} />
      <div style={{ padding: 16 }}>
        {[80, 50, 65].map((w, i) => (
          <div key={i} className="shimmer" style={{ height: 13, borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expressed, setExpressed] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    api.get("/rooms/").then((res) => setRooms(res.data)).finally(() => setLoading(false));
  }, []);

  const expressInterest = async (listingId) => {
    try {
      await api.post("/tenants/interest", { listing_id: listingId });
      setExpressed((prev) => new Set([...prev, listingId]));
      toast.success("Interest sent! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send interest");
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 32, fontWeight: 700,
          color: "var(--text)", marginBottom: 8,
        }}>
          Available rooms
        </h2>
        <p style={{ color: "var(--muted2)", fontSize: 14 }}>
          {user?.role === "tenant"
            ? "Ranked by AI compatibility based on your profile"
            : "All available listings"}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
        gap: 20,
      }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : rooms.map((room, idx) => (
            <div key={room.id} className="card-hover fade-in" style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 14, overflow: "hidden",
            }}>
              <div style={{ position: "relative" }}>
                <img src={PHOTOS[idx % PHOTOS.length]} alt="Room"
                  style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
                <div style={{
                  position: "absolute", top: 10, left: 10,
                  background: "rgba(10,10,15,0.8)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text)", fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(8px)",
                }}>
                  {room.room_type}
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                  {room.location}
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                  {room.furnishing_status} · Available {room.available_from}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--pastel-purple)" }}>
                      ₹{room.rent.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>/mo</span>
                  </div>
                  {room.compatibility_score != null && (
                    <ScoreRing score={Math.round(room.compatibility_score)} />
                  )}
                </div>

                {room.compatibility_explanation && (
                  <p style={{
                    fontSize: 11, color: "var(--muted2)", lineHeight: 1.5,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: 7, padding: "8px 10px", marginBottom: 12,
                  }}>
                    {room.compatibility_explanation}
                  </p>
                )}

                {user?.role === "tenant" && (
                  <button onClick={() => expressInterest(room.id)}
                    disabled={expressed.has(room.id)}
                    style={{
                      width: "100%", padding: "9px",
                      background: expressed.has(room.id)
                        ? "rgba(184,232,216,0.08)"
                        : "rgba(201,184,240,0.1)",
                      border: `1px solid ${expressed.has(room.id)
                        ? "rgba(184,232,216,0.2)"
                        : "rgba(201,184,240,0.25)"}`,
                      color: expressed.has(room.id) ? "var(--pastel-mint)" : "var(--pastel-purple)",
                      borderRadius: 8, fontWeight: 600, fontSize: 13,
                      cursor: expressed.has(room.id) ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {expressed.has(room.id) ? "✓ Interest Sent" : "Express Interest"}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {!loading && rooms.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
          <h3 style={{ color: "var(--muted2)", fontFamily: "'Playfair Display', serif" }}>
            No rooms available yet
          </h3>
          <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 14 }}>
            Check back soon — new listings are added daily
          </p>
        </div>
      )}
    </div>
  );
}