import React, { useState } from "react";
import { apiService } from "../api/client";
import { Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await apiService.login({ email, password });
      } else {
        res = await apiService.register({ name, email, password });
      }

      if (res && res.token) {
        localStorage.setItem("dhansaarthi_token", res.token);
        onAuthSuccess(res.user, res.token);
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error("Auth error:", err);
      const errMsg = err.response?.data?.error || "Connection failed. Please check if the server is running.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      padding: "20px"
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
        padding: "40px 32px",
        border: "1px solid var(--border)",
        background: "rgba(15, 15, 18, 0.65)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)"
      }}>
        {/* Brand Header */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px"
        }}>
          <ShieldCheck size={36} style={{ color: "var(--brand-gold)" }} />
          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            background: "linear-gradient(to right, var(--brand-gold), var(--brand-emerald))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0
          }}>
            DhanSaarthi
          </h1>
        </div>
        
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          marginBottom: "28px"
        }}>
          {isLogin ? "Access your secure financial companion" : "Create your premium wealth tracker account"}
        </p>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid var(--accent-red)",
            color: "var(--text-primary)",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            marginBottom: "20px",
            textAlign: "left"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              marginTop: "12px",
              padding: "12px",
              fontWeight: "700",
              fontSize: "0.95rem"
            }}
          >
            {loading ? "Processing..." : isLogin ? "Secure Login" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-emerald)",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "underline"
            }}
          >
            {isLogin ? "New to DhanSaarthi? Register here" : "Already have an account? Login here"}
          </button>
        </div>
      </div>
    </div>
  );
}
