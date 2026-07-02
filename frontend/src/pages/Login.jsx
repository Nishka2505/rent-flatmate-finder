import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      navigate(user.role === "owner" ? "/owner" : "/rooms");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 57px)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
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
          top: -100, right: -100,
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(201,184,240,0.08)",
            border: "1px solid rgba(201,184,240,0.15)",
            color: "var(--pastel-purple)", fontSize: 12, fontWeight: 500,
            padding: "5px 14px", borderRadius: 20, letterSpacing: "0.5px",
            marginBottom: 28,
          }}>
            ✦ AI-Powered Matching
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 42, fontWeight: 700, lineHeight: 1.2,
            color: "var(--text)", marginBottom: 16,
          }}>
            Find your perfect<br />room & flatmate
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 36 }}>
            Intelligent compatibility scoring matches you with rooms that truly fit your life.
          </p>
          {["🤖 AI compatibility scores", "💬 Real-time chat", "📧 Instant email alerts"].map((f) => (
            <div key={f} style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 14px",
              fontSize: 13, color: "var(--muted2)",
              marginRight: 8, marginBottom: 8,
            }}>
              {f}
            </div>
          ))}
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
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>
            No account?{" "}
            <Link to="/register" style={{ color: "var(--pastel-purple)", fontWeight: 600 }}>
              Register free
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <label className="form-label">Email address</label>
            <input className="input-field" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label className="form-label">Password</label>
            <input className="input-field" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}