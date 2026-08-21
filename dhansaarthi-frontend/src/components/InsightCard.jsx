import React from "react";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

export default function InsightCard({ insight }) {
  const isWarning = insight.type === "warning" || insight.icon === "🔴";
  const isAction = insight.type === "action" || insight.icon === "🟢";

  let cardBorder = "var(--border)";
  let iconColor = "var(--text-muted)";
  let Icon = Lightbulb;
  let bgGradient = "linear-gradient(145deg, rgba(39, 39, 42, 0.4) 0%, rgba(24, 24, 27, 0.6) 100%)";

  if (isWarning) {
    cardBorder = "rgba(239, 68, 68, 0.25)";
    iconColor = "var(--accent-red)";
    Icon = AlertTriangle;
    bgGradient = "linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, rgba(24, 24, 27, 0.7) 100%)";
  } else if (isAction) {
    cardBorder = "rgba(16, 185, 129, 0.25)";
    iconColor = "var(--brand-emerald)";
    Icon = CheckCircle2;
    bgGradient = "linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(24, 24, 27, 0.7) 100%)";
  }

  return (
    <div className="card animate-fade-in" style={{
      border: `1px solid ${cardBorder}`,
      background: bgGradient,
      padding: "20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      borderRadius: "var(--radius-md)"
    }}>
      {/* Icon display with background glow */}
      <div style={{
        width: "42px",
        height: "42px",
        borderRadius: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1px solid ${cardBorder}`
      }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>

      {/* Message content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{
          fontSize: "0.75rem",
          fontWeight: "700",
          color: iconColor,
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }}>
          {isWarning ? "Financial Alert" : isAction ? "Recommendation" : "General Tip"}
        </span>
        <p style={{
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          lineHeight: "1.4"
        }}>
          {insight.text}
        </p>
      </div>
    </div>
  );
}
