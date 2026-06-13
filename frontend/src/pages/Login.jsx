import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const API = "https://cyberaegis-ai-y3dw.onrender.com";

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setStatus({ msg: "Enter both email and password.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Authenticating credentials...", type: "info" });

    try {
      const response = await axios.post(`${API}/api/auth/login`, {
        email: email.trim(),
        password: password,
      });

      // store data safely
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setStatus({
        msg: "Login successful. Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        onLogin?.(response.data.user);
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      setStatus({
        msg:
          error.response?.data?.message ||
          error.message ||
          "Login failed. Check backend connection.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Security Console</h1>

        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {status.msg && <p>{status.msg}</p>}

        <p>
          Need account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}