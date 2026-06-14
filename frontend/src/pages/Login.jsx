import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../config";

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
      const response = await axios.post(apiUrl("/api/auth/login"), {
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
    <main className="auth-page auth-page-login">
      <section className="auth-panel auth-panel-login" aria-label="Sign in">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">AS</div>
          <div>
            <div className="auth-site-name">AegisShield AI</div>
            <div className="auth-site-tag">Security intelligence</div>
          </div>
        </div>
        <p className="auth-eyebrow">Enterprise cyber defense portal</p>
        <h1 className="auth-title">Security Console</h1>
        <p className="auth-subtitle">
          Sign in to monitor phishing, deepfake, URL, QR, and media threats from one protected workspace.
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
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            autoComplete="current-password"
          />

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          Need account?{" "}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </section>

      <aside className="auth-intel auth-login-hero" aria-label="Security access">
        <div className="auth-hero-kicker">AegisShield AI</div>
        <h2>Unified threat defense for modern security teams</h2>
        <p>
          Correlate suspicious URLs, emails, QR payloads, and media signals in a fast analyst workflow built for real-time response.
        </p>

        <div className="auth-hero-metrics" aria-label="Security platform highlights">
          <div>
            <strong>24/7</strong>
            <span>Threat monitoring</span>
          </div>
          <div>
            <strong>AI</strong>
            <span>Signal analysis</span>
          </div>
          <div>
            <strong>Zero</strong>
            <span>Trust sessions</span>
          </div>
        </div>

        <div className="auth-hero-stack">
          {["Real-time scan dashboard", "Risk history and metrics", "Multi-signal threat review", "Secure analyst session"].map(
            (item) => (
              <div key={item} className="auth-module-row">
                <span className="auth-module-dot" />
                <span>{item}</span>
              </div>
            )
          )}
        </div>
      </aside>
    </main>
  );
}
