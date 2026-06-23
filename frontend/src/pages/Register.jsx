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

  const registerUser = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatus({
        msg: "Complete every field.",
        type: "warning",
      });
      return;
    }

    if (password.length < 6) {
      setStatus({
        msg: "Password must be at least 6 characters.",
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.post(apiUrl("/api/auth/register"), {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setStatus({
        msg: "Registration successful. Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Registration failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page-login">
      
      <section className="auth-panel auth-panel-login auth-panel-register">
        <div className="auth-logo-section">
  <h2 className="auth-project-name">CyberAegis AI</h2>
  <p className="auth-project-tagline">
    AI-Powered Phishing & Deepfake Detection Platform
  </p>
</div>

        <h1 className="auth-title">
          Create Account
        </h1>

        <form onSubmit={registerUser} className="auth-form">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            disabled={loading}
          />

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </p>

      </section>
    </main>
  );
}