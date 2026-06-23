import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from "../config";

export default function Login({ onLogin }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    msg: "",
    type: "",
  });

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setStatus({
        msg: "Enter email and password",
        type: "warning",
      });

      return;
    }

    setLoading(true);

    try {

      const response = await axios.post(
        apiUrl("/api/auth/login"),
        {
          email: email.trim(),
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setStatus({
        msg: "Login successful",
        type: "success",
      });

      onLogin?.(response.data.user);

      navigate("/dashboard");

    } catch (error) {

      setStatus({
        msg:
          error.response?.data?.message ||
          "Login failed",
        type: "error",
      });

    } finally {

      setLoading(false);

    }
  };

  return (
    <main className="auth-page auth-page-login">

      <section className="auth-panel auth-panel-login">

        <h1 className="auth-title">
          Sign In
        </h1>

        <form
          onSubmit={handleLogin}
          className="auth-form"
        >

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        {status.msg && (
          <p className={`auth-status auth-status-${status.type}`}>
            {status.msg}
          </p>
        )}

        <p className="auth-footer">
          New user?{" "}
          <Link to="/register" className="auth-link">
            Create Account
          </Link>
        </p>

      </section>

    </main>
  );
}