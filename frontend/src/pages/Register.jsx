import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../config";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatus({ msg: "Complete every field before continuing.", type: "warning" });
      return;
    }

    if (password.length < 6) {
      setStatus({ msg: "Password must be at least 6 characters.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Creating analyst profile...", type: "info" });

    try {
      await axios.post(apiUrl("/api/auth/register"), {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setStatus({ msg: "Account created. Redirecting to sign in...", type: "success" });
      setName("");
      setEmail("");
      setPassword("");

      window.setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Registration service is offline. Start the backend and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-register" aria-label="Create account">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">AS</div>
          <div>
            <div className="auth-site-name">AegisShield AI</div>
            <div className="auth-site-tag">Security intelligence</div>
          </div>
        </div>
        <p className="auth-eyebrow">Cyber defense portal</p>
        <h1 className="auth-title">Create Analyst Access</h1>
        <p className="auth-subtitle">
          Start a protected workspace for phishing and deepfake investigation.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Security analyst"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="auth-input"
            autoComplete="name"
            autoFocus
          />

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
          />

          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input"
            autoComplete="new-password"
          />

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          Already have access?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </section>

      <aside className="auth-intel" aria-label="Security onboarding">
        <h2>Access includes</h2>
        {["Real-time scan dashboard", "Risk history and metrics", "Multi-signal threat review", "Secure analyst session"].map(
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
