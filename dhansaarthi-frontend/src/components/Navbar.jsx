import React from "react";
import { LayoutDashboard, Target, TrendingUp, BrainCircuit, UploadCloud, LogOut, User, Bot } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, user = null, onLogout = null }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "score", label: "Confidence Score", icon: TrendingUp },
    { id: "goals", label: "Financial Goals", icon: Target },
    { id: "chat", label: "Saarthi AI", icon: Bot, isSpecial: true },
    { id: "insights", label: "AI Insights", icon: BrainCircuit },
    { id: "upload", label: "Upload Statement", icon: UploadCloud }
  ];

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 32px",
      backgroundColor: "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(8px)"
    }}>
      {/* Branding & Nav Items Group (Left/Center) */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setActiveTab("dashboard")}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--grad-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "1.25rem",
            color: "var(--text-primary)"
          }}>
            ₹
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, var(--brand-gold) 0%, var(--brand-emerald) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            DhanSaarthi
          </span>
        </div>

        {/* Nav Items */}
        <div style={{ display: "flex", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSpecial = item.isSpecial;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="btn"
                style={{
                  background: isActive 
                    ? (isSpecial ? "rgba(245, 158, 11, 0.15)" : "var(--border-focus)")
                    : (isSpecial ? "rgba(245, 158, 11, 0.05)" : "transparent"),
                  color: isActive 
                    ? (isSpecial ? "var(--brand-gold)" : "var(--text-primary)")
                    : (isSpecial ? "var(--brand-gold)" : "var(--text-secondary)"),
                  border: isSpecial ? (isActive ? "1px solid var(--brand-gold)" : "1px solid rgba(245, 158, 11, 0.3)") : "none",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.9rem",
                  fontWeight: isSpecial ? "600" : "normal",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isSpecial ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = isSpecial ? "var(--brand-gold)" : "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isSpecial ? "rgba(245, 158, 11, 0.05)" : "transparent";
                    e.currentTarget.style.color = isSpecial ? "var(--brand-gold)" : "var(--text-secondary)";
                  }
                }}
              >
                <Icon size={18} style={{ color: isSpecial ? "var(--brand-gold)" : (isActive ? "var(--brand-emerald)" : "inherit") }} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Actions (Right) */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            <User size={16} style={{ color: "var(--brand-emerald)" }} />
            <span>Hello, <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong></span>
          </div>
          <button
            onClick={onLogout}
            className="btn"
            style={{
              background: "transparent",
              color: "var(--accent-red)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
