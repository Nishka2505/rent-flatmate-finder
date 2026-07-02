import React, { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function OwnerDashboard() {
  const [listings, setListings] = useState([]);
  const [interests, setInterests] = useState([]);
  const [tab, setTab] = useState("listings");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ location: "", rent: "", available_from: "", room_type: "", furnishing_status: "" });

  const fetchData = () => {
    api.get("/rooms/owner/my-listings").then((res) => setListings(res.data));
    api.get("/rooms/interest/received").then((res) => setInterests(res.data));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rooms/", { ...form, rent: parseFloat(form.rent) });
      toast.success("Listing created!");
      setShowForm(false);
      setForm({ location: "", rent: "", available_from: "", room_type: "", furnishing_status: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const respond = async (id, status) => {
    try {
      await api.patch(`/rooms/interest/${id}/respond`, { status });
      toast.success(`Request ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const markFilled = async (id) => {
    try {
      await api.patch(`/rooms/${id}/fill`);
      toast.success("Marked as filled");
      fetchData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "var(--black2)", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 13, color: "var(--text)",
    outline: "none", marginBottom: 10, fontFamily: "inherit",
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Dashboard
          </h2>
          <p style={{ color: "var(--muted2)", fontSize: 14 }}>Manage your listings and requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: "var(--pastel-purple)", color: "#1a1228",
          padding: "10px 20px", borderRadius: 9, border: "none",
          fontWeight: 700, fontSize: 13,
        }}>
          {showForm ? "Cancel" : "+ New Listing"}
        </button>
      </div>

      {showForm && (
        <div className="fade-in" style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 14, padding: 24, marginBottom: 28,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--text)", marginBottom: 16 }}>
            New listing
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="Location" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              <input style={inputStyle} type="number" placeholder="Rent (₹)" value={form.rent}
                onChange={(e) => setForm({ ...form, rent: e.target.value })} required />
              <input style={inputStyle} type="date" value={form.available_from}
                onChange={(e) => setForm({ ...form, available_from: e.target.value })} required />
              <input style={inputStyle} placeholder="Room Type (e.g. 1BHK)" value={form.room_type}
                onChange={(e) => setForm({ ...form, room_type: e.target.value })} required />
              <input style={{ ...inputStyle, gridColumn: "span 2" }} placeholder="Furnishing Status" value={form.furnishing_status}
                onChange={(e) => setForm({ ...form, furnishing_status: e.target.value })} required />
            </div>
            <button type="submit" style={{
              background: "var(--pastel-purple)", color: "#1a1228",
              padding: "10px 24px", borderRadius: 9, border: "none",
              fontWeight: 700, fontSize: 13, marginTop: 6,
            }}>
              Create Listing
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        background: "var(--card2)", border: "1px solid var(--border)",
        borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 24,
      }}>
        {["listings", "interests"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: 7, border: "none",
            background: tab === t ? "var(--card)" : "transparent",
            color: tab === t ? "var(--text)" : "var(--muted)",
            fontWeight: 500, fontSize: 13,
            boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
            transition: "all 0.2s",
          }}>
            {t === "listings" ? `Listings (${listings.length})` : `Requests (${interests.length})`}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div>
          {listings.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
              <p>No listings yet — create your first one above</p>
            </div>
          )}
          {listings.map((l) => (
            <div key={l.id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "16px 20px", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{l.location}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {l.room_type} · ₹{l.rent.toLocaleString("en-IN")}/mo · {l.is_filled ? "Filled" : "Available"}
                </div>
              </div>
              {!l.is_filled && (
                <button onClick={() => markFilled(l.id)} style={{
                  background: "rgba(107,104,128,0.1)", border: "1px solid var(--border)",
                  color: "var(--muted2)", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                }}>
                  Mark filled
                </button>
              )}
              {l.is_filled && (
                <span style={{
                  background: "rgba(184,232,216,0.08)", border: "1px solid rgba(184,232,216,0.2)",
                  color: "var(--pastel-mint)", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  Filled
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "interests" && (
        <div>
          {interests.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
              <p>No interest requests yet</p>
            </div>
          )}
          {interests.map((i) => (
            <div key={i.id} style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "16px 20px", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
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
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i.status === "pending" && (
                  <>
                    <button onClick={() => respond(i.id, "accepted")} style={{
                      background: "rgba(184,232,216,0.08)", border: "1px solid rgba(184,232,216,0.2)",
                      color: "var(--pastel-mint)", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    }}>Accept</button>
                    <button onClick={() => respond(i.id, "declined")} style={{
                      background: "rgba(244,194,216,0.08)", border: "1px solid rgba(244,194,216,0.2)",
                      color: "var(--pastel-pink)", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    }}>Decline</button>
                  </>
                )}
                {i.status === "accepted" && (
                  <Link to={`/chat/${i.id}`} style={{
                    background: "rgba(201,184,240,0.08)", border: "1px solid rgba(201,184,240,0.2)",
                    color: "var(--pastel-purple)", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  }}>
                    Open chat →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}