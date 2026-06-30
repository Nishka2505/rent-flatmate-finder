import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rooms from "./pages/Rooms";
import TenantProfile from "./pages/TenantProfile";
import OwnerDashboard from "./pages/OwnerDashboard";
import MyInterests from "./pages/MyInterests";
import Chat from "./pages/Chat";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #ddd",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontWeight: "bold" }}>🏠 Rent & Flatmate Finder</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {user ? (
          <>
            {user.role === "tenant" && (
              <>
                <Link to="/rooms">Browse Rooms</Link>
                <Link to="/profile">My Profile</Link>
                <Link to="/my-interests">My Interests</Link>
              </>
            )}
            {user.role === "owner" && <Link to="/owner">Dashboard</Link>}
            <span style={{ color: "#888" }}>{user.email}</span>
            <button onClick={logout} style={{ padding: "4px 10px" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "owner" ? "/owner" : "/rooms"} />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute role="tenant">
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="tenant">
              <TenantProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-interests"
          element={
            <ProtectedRoute role="tenant">
              <MyInterests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:interestId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
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