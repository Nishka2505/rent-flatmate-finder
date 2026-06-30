import React, { useState, useEffect } from "react";
import api from "../api";

export default function OwnerDashboard() {
  const [listings, setListings] = useState([]);
  const [interests, setInterests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    location: "",
    rent: "",
    available_from: "",
    room_type: "",
    furnishing_status: "",
  });
  const [message, setMessage] = useState("");

  const fetchData = () => {
    api.get("/rooms/owner/my-listings").then((res) => setListings(res.data));
    api.get("/rooms/interest/received").then((res) => setInterests(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/rooms/", { ...form, rent: parseFloat(form.rent) });
      setMessage("Listing created!");
      setShowForm(false);
      setForm({ location: "", rent: "", available_from: "", room_type: "", furnishing_status: "" });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to create listing");
    }
  };

  const respondToInterest = async (interestId, status) => {
    try {
      await api.patch(`/rooms/interest/${interestId}/respond`, { status });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to update interest");
    }
  };

  const markFilled = async (listingId) => {
    try {
      await api.patch(`/rooms/${listingId}/fill`);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to mark filled");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Owner Dashboard</h2>
      {message && <p>{message}</p>}

      <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 16px", marginBottom: 16 }}>
        {showForm ? "Cancel" : "+ Add New Listing"}
      </button>

      {showForm && (
        <form onSubmit={handleCreateListing} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 20 }}>
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            type="number"
            placeholder="Rent (₹)"
            value={form.rent}
            onChange={(e) => setForm({ ...form, rent: e.target.value })}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            type="date"
            value={form.available_from}
            onChange={(e) => setForm({ ...form, available_from: e.target.value })}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="Room Type (e.g. 1BHK)"
            value={form.room_type}
            onChange={(e) => setForm({ ...form, room_type: e.target.value })}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="Furnishing Status"
            value={form.furnishing_status}
            onChange={(e) => setForm({ ...form, furnishing_status: e.target.value })}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Create Listing
          </button>
        </form>
      )}

      <h3>Your Listings</h3>
      {listings.map((l) => (
        <div key={l.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8, borderRadius: 6 }}>
          <strong>{l.location}</strong> — ₹{l.rent}/month — {l.is_filled ? "FILLED" : "Available"}
          {!l.is_filled && (
            <button onClick={() => markFilled(l.id)} style={{ marginLeft: 10, padding: "4px 10px" }}>
              Mark Filled
            </button>
          )}
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Interest Requests Received</h3>
      {interests.length === 0 && <p>No interest requests yet.</p>}
      {interests.map((i) => (
        <div key={i.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8, borderRadius: 6 }}>
          <p>Listing ID: {i.listing_id} — Status: <strong>{i.status}</strong></p>
          {i.status === "pending" && (
            <>
              <button onClick={() => respondToInterest(i.id, "accepted")} style={{ marginRight: 8, padding: "4px 10px" }}>
                Accept
              </button>
              <button onClick={() => respondToInterest(i.id, "declined")} style={{ padding: "4px 10px" }}>
                Decline
              </button>
            </>
          )}
          {i.status === "accepted" && (
            <a href={`/chat/${i.id}`} style={{ display: "inline-block", marginTop: 6 }}>
              Open Chat →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}