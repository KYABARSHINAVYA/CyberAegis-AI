import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../config";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("login");
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

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus({ msg: "Enter your account email.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Sending password reset OTP...", type: "info" });

    try {
      await axios.post(apiUrl("/api/auth/forgot-password"), {
        email: email.trim(),
      });

      setMode("reset");
      setStatus({
        msg: "Password reset OTP sent to your email.",
        type: "success",
      });
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Could not send reset OTP. Check backend connection.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!email.trim() || !resetOtp.trim() || !newPassword.trim()) {
      setStatus({ msg: "Email, OTP, and new password are required.", type: "warning" });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ msg: "Password must be at least 6 characters.", type: "warning" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ msg: "Passwords do not match.", type: "warning" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Resetting password...", type: "info" });

    try {
      await axios.post(apiUrl("/api/auth/reset-password"), {
        email: email.trim(),
        otp: resetOtp.trim(),
        password: newPassword,
      });

      setMode("login");
      setPassword("");
      setResetOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus({ msg: "Password reset successfully. Sign in with your new password.", type: "success" });
    } catch (error) {
      setStatus({
        msg:
          error.response?.data?.message ||
          "Password reset failed. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const showLogin = () => {
    setMode("login");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus({ msg: "", type: "" });
  };

  return (
    <main className="auth-page auth-page-login">
      <section className="auth-panel auth-panel-login" aria-label="Sign in">
        <div className="auth-brand-row">
          <div className="auth-brand-mark">AS</div>
          <div>
            <div className="auth-site-name">CyberAegis AI</div>
            <div className="auth-site-tag">Security intelligence</div>
          </div>
        </div>
        <p className="auth-eyebrow">Enterprise cyber defense portal</p>
        <h1 className="auth-title">
          {mode === "login" ? "Security Console" : mode === "forgot" ? "Reset Access" : "Verify Reset"}
        </h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to monitor phishing, deepfake, URL, QR, and media threats from one protected workspace."
            : "Use your account email to receive an OTP and set a new password."}
        </p>

        <form
          onSubmit={
            mode === "login"
              ? handleLogin
              : mode === "forgot"
                ? handleForgotPassword
                : handleResetPassword
          }
          className="auth-form"
        >
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

          {mode === "login" && (
            <>
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
            </>
          )}

          {mode === "reset" && (
            <>
              <label className="auth-label" htmlFor="resetOtp">
                Email OTP
              </label>
              <input
                id="resetOtp"
                type="text"
                inputMode="numeric"
                placeholder="6-digit reset code"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                className="auth-input"
                autoComplete="one-time-code"
              />

              <label className="auth-label" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input"
                autoComplete="new-password"
              />

              <label className="auth-label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                autoComplete="new-password"
              />
            </>
          )}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading
              ? mode === "login"
                ? "Signing in..."
                : mode === "forgot"
                  ? "Sending OTP..."
                  : "Resetting password..."
              : mode === "login"
                ? "Sign in"
                : mode === "forgot"
                  ? "Send reset OTP"
                  : "Reset password"}
          </button>
        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          {mode === "login" ? (
            <>
              <button type="button" className="auth-link auth-link-button" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>{" "}
              Need account?{" "}
              <Link to="/register" className="auth-link">
                Register
              </Link>
            </>
          ) : (
            <button type="button" className="auth-link auth-link-button" onClick={showLogin}>
              Back to sign in
            </button>
          )}
        </p>
      </section>

      <aside className="auth-intel auth-login-hero" aria-label="Security access">
        <div className="auth-access-card">
          <div className="auth-access-header">
            <span className="auth-access-icon">AS</span>
            <div>
              <span className="auth-access-label">Protected access</span>
              <strong>Analyst workspace</strong>
            </div>
          </div>

          <div className="auth-session-status">
            <span className="auth-session-dot" />
            <span>Secure session required</span>
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
