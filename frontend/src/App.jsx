import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./DashboardLayout";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      return token ? JSON.parse(localStorage.getItem("user")) || null : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />}
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
