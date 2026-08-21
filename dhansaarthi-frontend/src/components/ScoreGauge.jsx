import React from "react";

export default function ScoreGauge({ score = 70 }) {
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Determine color theme based on score value
  let color = "var(--brand-emerald)";
  let label = "Healthy";
  let desc = "Great shape! Keep maintaining your current balance.";

  if (score >= 80) {
    color = "var(--brand-emerald)";
    label = "Excellent";
    desc = "Outstanding financial behavior. You're set up for success.";
  } else if (score >= 60) {
    color = "var(--brand-gold)";
    label = "Good";
    desc = "Solid footing, but minor improvements can boost savings.";
  } else if (score >= 45) {
    color = "var(--accent-amber)";
    label = "Fair";
    desc = "Moderate stability. Essential actions needed to curb leakage.";
  } else {
    color = "var(--accent-red)";
    label = "Needs Action";
    desc = "High expenditure vs low savings. Action steps required.";
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      textAlign: "center"
    }}>
      {/* SVG Circle Gauge */}
      <div style={{ position: "relative", width: "200px", height: "200px", display: "flex", alignItems: "center", justifyItems: "center" }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          {/* Base Trail Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Active Colored Arc Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 8px ${color}44)`
            }}
          />
        </svg>

        {/* Center Text Display */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{
            fontSize: "3.25rem",
            fontWeight: "800",
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            lineHeight: "1"
          }}>
            {score}
          </span>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginTop: "4px"
          }}>
            Confidence Score
          </span>
        </div>
      </div>

      {/* Description Metrics */}
      <div style={{ marginTop: "16px" }}>
        <span className="badge" style={{
          backgroundColor: `${color}15`,
          color: color,
          borderColor: `${color}30`,
          fontSize: "0.85rem",
          padding: "6px 14px",
          fontWeight: "700"
        }}>
          {label}
        </span>
        <p style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          marginTop: "10px",
          maxWidth: "260px"
        }}>
          {desc}
        </p>
      </div>
    </div>
  );
}
