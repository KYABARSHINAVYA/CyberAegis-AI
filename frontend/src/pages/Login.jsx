import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setStatus({ msg: "Enter both email and password.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Authenticating credentials...", type: "info" });

    try {
      cconst response = await axios.post(
  "https://cyberaegis-ai-y3dw.onrender.com/api/auth/login",
  {
    email: email.trim(),
    password,
  }
);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setStatus({ msg: "Login successful. Opening dashboard...", type: "success" });

      window.setTimeout(() => {
        onLogin?.(response.data.user);
        navigate("/dashboard");
      }, 350);
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Login service is offline. Start the backend and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-label="Login">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">AS</div>
          <div>
            <div className="auth-site-name">AegisShield AI</div>
            <div className="auth-site-tag">Security intelligence</div>
          </div>
        </div>
        <p className="auth-eyebrow">Cyber defense portal</p>
        <h1 className="auth-title">Security Console</h1>
        <p className="auth-subtitle">
          Sign in to scan suspicious URLs, messages, QR codes, and media.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="analyst@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            autoComplete="email"
            autoFocus
          />

          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input"
            autoComplete="current-password"
          />

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          Need analyst access?{" "}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </p>
      </section>

      <aside className="auth-intel" aria-label="Security coverage">
        <h2>Defense modules</h2>
        {["URL threat scoring", "Email phishing review", "QR payload analysis", "Media deepfake triage"].map(
          (item) => (
            <div key={item} className="auth-module-row">
              <span className="auth-module-dot" />
              <span>{item}</span>
            </div>
          )
        )}
      </aside>
    </main>
  );
}
