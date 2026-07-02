import React, { useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

export default function TenantProfile() {
  const [form, setForm] = useState({
    preferred_location: "", budget_min: "", budget_max: "", move_in_date: "",
  });

  useEffect(() => {
    api.get("/tenants/profile").then((res) => setForm(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tenants/profile", {
        ...form,
        budget_min: parseFloat(form.budget_min),
        budget_max: parseFloat(form.budget_max),
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "var(--black2)", border: "1px solid var(--border)",
    borderRadius: 9, fontSize: 14, color: "var(--text)",
    outline: "none", marginBottom: 16, fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 24px" }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8,
      }}>
        Your profile
      </h2>
      <p style={{ color: "var(--muted2)", fontSize: 14, marginBottom: 32 }}>
        Help our AI find your best matches
      </p>

      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 28,
      }}>
        <form onSubmit={handleSubmit}>
          <label className="form-label">Preferred location</label>
          <input style={inputStyle} placeholder="e.g. Koramangala, Bangalore"
            value={form.preferred_location}
            onChange={(e) => setForm({ ...form, preferred_location: e.target.value })} required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">Min budget (₹)</label>
              <input style={inputStyle} type="number" placeholder="10000"
                value={form.budget_min}
                onChange={(e) => setForm({ ...form, budget_min: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Max budget (₹)</label>
              <input style={inputStyle} type="number" placeholder="20000"
                value={form.budget_max}
                onChange={(e) => setForm({ ...form, budget_max: e.target.value })} required />
            </div>
          </div>

          <label className="form-label">Move-in date</label>
          <input style={{ ...inputStyle, colorScheme: "dark" }} type="date"
            value={form.move_in_date}
            onChange={(e) => setForm({ ...form, move_in_date: e.target.value })} required />

          <button type="submit" style={{
            width: "100%", padding: "12px",
            background: "var(--pastel-purple)", color: "#1a1228",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: "pointer", marginTop: 4,
          }}>
            Save profile →
          </button>
        </form>
      </div>
    </div>
  );
}