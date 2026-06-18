import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../config";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" });

  const sendOtp = async (event) => {
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
    setStatus({ msg: "Sending verification OTP...", type: "info" });

    try {
      await axios.post(apiUrl("/api/auth/send-signup-otp"), {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setOtpSent(true);
      setStatus({
        msg: "OTP sent to your email. Enter it to complete signup.",
        type: "success",
      });
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Verification service is offline. Start the backend and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setStatus({ msg: "Enter the OTP sent to your email.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Verifying OTP...", type: "info" });

    try {
      await axios.post(apiUrl("/api/auth/verify-signup-otp"), {
        email: email.trim(),
        otp: otp.trim(),
      });

      setStatus({ msg: "Email verified. Redirecting to sign in...", type: "success" });
      setName("");
      setEmail("");
      setPassword("");
      setOtp("");
      setOtpSent(false);

      window.setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "OTP verification failed. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page-login">
      <section className="auth-panel auth-panel-login auth-panel-register" aria-label="Create account">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">AS</div>
          <div>
            <div className="auth-site-name">CyberAegis AI</div>
            <div className="auth-site-tag">Security intelligence</div>
          </div>
        </div>
        <p className="auth-eyebrow">Cyber defense portal</p>
        <h1 className="auth-title">Create Analyst Access</h1>
        <p className="auth-subtitle">
          Start a protected workspace for phishing and deepfake investigation.
        </p>

        <form onSubmit={otpSent ? verifyOtp : sendOtp} className="auth-form">
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
            disabled={otpSent || loading}
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
            disabled={otpSent || loading}
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
            disabled={otpSent || loading}
          />

          {otpSent && (
            <>
              <label className="auth-label" htmlFor="otp">
                Email OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="6-digit verification code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="auth-input"
                autoComplete="one-time-code"
              />
            </>
          )}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading
              ? otpSent
                ? "Verifying OTP..."
                : "Sending OTP..."
              : otpSent
                ? "Verify OTP and create account"
                : "Send verification OTP"}
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

      <aside className="auth-intel auth-login-hero" aria-label="Security onboarding">
        <div className="auth-access-card">
          <div className="auth-access-header">
            <span className="auth-access-icon">AS</span>
            <div>
              <span className="auth-access-label">Protected access</span>
              <strong>Analyst onboarding</strong>
            </div>
          </div>

          <div className="auth-session-status">
            <span className="auth-session-dot" />
            <span>Secure profile creation</span>
          </div>

          <div className="auth-hero-metrics" aria-label="Security platform highlights">
            <div>
              <strong>24/7</strong>
              <span>Monitoring</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>Analysis</span>
            </div>
            <div>
              <strong>Zero</strong>
              <span>Trust</span>
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
        </div>
      </aside>
    </main>
  );
}
