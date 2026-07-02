import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(email, password, role);
      toast.success("Account created! Welcome 🎉");
      navigate(user.role === "owner" ? "/owner" : "/rooms");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 57px)",
      display: "grid", gridTemplateColumns: "1fr 1fr",
    }}>
      {/* Left panel */}
      <div style={{
        background: "linear-gradient(145deg, #1a1228 0%, #0f0a1e 100%)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,184,240,0.08) 0%, transparent 70%)",
          bottom: -100, left: -100,
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>✨</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 42, fontWeight: 700, lineHeight: 1.2,
            color: "var(--text)", marginBottom: 16,
          }}>
            The smarter<br />way to rent
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted2)", lineHeight: 1.7 }}>
            Whether you're looking for a room or listing one — our AI matches you with the right people, not just the right price.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 56px", background: "var(--black)",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }} className="fade-in">
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 700,
            color: "var(--text)", marginBottom: 6,
          }}>
            Create account
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
            Already registered?{" "}
            <Link to="/login" style={{ color: "var(--pastel-purple)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>

          {/* Role selector */}
          <label className="form-label" style={{ marginBottom: 10 }}>I'm joining as a</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { value: "tenant", icon: "🔍", label: "Tenant", sub: "Looking for a room" },
              { value: "owner", icon: "🏠", label: "Owner", sub: "Listing a room" },
            ].map((r) => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                padding: "14px 10px",
                background: role === r.value ? "rgba(201,184,240,0.08)" : "var(--black2)",
                border: `1.5px solid ${role === r.value ? "rgba(201,184,240,0.4)" : "var(--border)"}`,
                borderRadius: 10, cursor: "pointer", textAlign: "center",
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: role === r.value ? "var(--pastel-purple)" : "var(--text)" }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.sub}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">Email address</label>
            <input className="input-field" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label className="form-label">Password</label>
            <input className="input-field" type="password" placeholder="Choose a strong password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}