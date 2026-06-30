import React, { useState, useEffect } from "react";
import api from "../api";

export default function TenantProfile() {
  const [form, setForm] = useState({
    preferred_location: "",
    budget_min: "",
    budget_max: "",
    move_in_date: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/tenants/profile")
      .then((res) => setForm(res.data))
      .catch(() => {}); // no profile yet, that's fine
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/tenants/profile", {
        ...form,
        budget_min: parseFloat(form.budget_min),
        budget_max: parseFloat(form.budget_max),
      });
      setMessage("Profile saved!");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to save profile");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Your Tenant Profile</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Preferred Location</label>
        <input
          type="text"
          value={form.preferred_location}
          onChange={(e) => setForm({ ...form, preferred_location: e.target.value })}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <label>Budget Min (₹)</label>
        <input
          type="number"
          value={form.budget_min}
          onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <label>Budget Max (₹)</label>
        <input
          type="number"
          value={form.budget_max}
          onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <label>Move-in Date</label>
        <input
          type="date"
          value={form.move_in_date}
          onChange={(e) => setForm({ ...form, move_in_date: e.target.value })}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Save Profile
        </button>
      </form>
    </div>
  );
}