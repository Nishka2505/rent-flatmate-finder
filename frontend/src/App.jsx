import React from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rooms from "./pages/Rooms";
import TenantProfile from "./pages/TenantProfile";
import OwnerDashboard from "./pages/OwnerDashboard";
import MyInterests from "./pages/MyInterests";
import Chat from "./pages/Chat";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px",
      background: "rgba(10,10,15,0.95)",
      borderBottom: "1px solid var(--border)",
      backdropFilter: "blur(20px)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link to="/" style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 700,
        color: "var(--pastel-purple)",
        textDecoration: "none",
      }}>
        🏠 Flatmate
      </Link>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {user ? (
          <>
            {user.role === "tenant" && (
              <>
                <Link to="/rooms" style={{ color: "var(--muted2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Browse</Link>
                <Link to="/profile" style={{ color: "var(--muted2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Profile</Link>
                <Link to="/my-interests" style={{ color: "var(--muted2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>My Interests</Link>
              </>
            )}
            {user.role === "owner" && (
              <Link to="/owner" style={{ color: "var(--muted2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Dashboard</Link>
            )}
            <span style={{
              background: "var(--card2)", border: "1px solid var(--border)",
              padding: "5px 12px", borderRadius: 20,
              fontSize: 12, color: "var(--muted2)",
            }}>
              {user.email.split("@")[0]}
            </span>
            <button onClick={handleLogout} style={{
              background: "rgba(244,194,216,0.08)",
              border: "1px solid rgba(244,194,216,0.2)",
              color: "var(--pastel-pink)",
              padding: "6px 14px", borderRadius: 8,
              fontSize: 12, fontWeight: 600,
            }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: "var(--muted2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{
              background: "var(--pastel-purple)", color: "#1a1228",
              padding: "8px 18px", borderRadius: 9,
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ textAlign: "center", marginTop: 80, color: "var(--muted)" }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "owner" ? "/owner" : "/rooms"} />;
}

function AppRoutes() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            fontSize: "13px",
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rooms" element={<ProtectedRoute role="tenant"><Rooms /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="tenant"><TenantProfile /></ProtectedRoute>} />
        <Route path="/my-interests" element={<ProtectedRoute role="tenant"><MyInterests /></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/chat/:interestId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}