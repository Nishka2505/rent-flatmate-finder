import React, { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";

export default function MyInterests() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tenants/interest/my-requests")
      .then((res) => setInterests(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8,
      }}>
        My interests
      </h2>
      <p style={{ color: "var(--muted2)", fontSize: 14, marginBottom: 32 }}>
        Track your room interest requests
      </p>

      {loading && (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading...</div>
      )}

      {!loading && interests.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
          <h3 style={{ color: "var(--muted2)", fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
            No interests yet
          </h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Browse rooms and express interest to see them here
          </p>
        </div>
      )}

      {interests.map((i) => (
        <div key={i.id} style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              Listing #{i.listing_id}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: i.status === "accepted"
                ? "rgba(184,232,216,0.1)" : i.status === "declined"
                ? "rgba(244,194,216,0.1)" : "rgba(245,212,184,0.1)",
              border: `1px solid ${i.status === "accepted"
                ? "rgba(184,232,216,0.2)" : i.status === "declined"
                ? "rgba(244,194,216,0.2)" : "rgba(245,212,184,0.2)"}`,
              color: i.status === "accepted"
                ? "var(--pastel-mint)" : i.status === "declined"
                ? "var(--pastel-pink)" : "var(--pastel-peach)",
            }}>
              {i.status}
            </span>
          </div>
          {i.status === "accepted" && (
            <Link to={`/chat/${i.id}`} style={{
              background: "rgba(201,184,240,0.08)",
              border: "1px solid rgba(201,184,240,0.2)",
              color: "var(--pastel-purple)",
              padding: "7px 14px", borderRadius: 7,
              fontSize: 12, fontWeight: 600,
            }}>
              Open chat →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}