import React from "react";
import SpendingChart from "../components/SpendingChart";
import TrendChart from "../components/TrendChart";
import { ArrowUpRight, ArrowDownRight, Wallet, Percent, DollarSign } from "lucide-react";

export default function Dashboard({ dashData = null, loading = false }) {
  if (loading) {
    return (
      <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Loading dashboard metrics...
      </div>
    );
  }

  if (!dashData) {
    return (
      <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Failed to fetch dashboard metrics. Try uploading a statement first.
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Income",
      value: `₹${dashData.total_income.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: ArrowUpRight,
      color: "var(--brand-emerald)",
      bgColor: "rgba(16, 185, 129, 0.1)"
    },
    {
      label: "Total Expenses",
      value: `₹${dashData.total_expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: ArrowDownRight,
      color: "var(--accent-red)",
      bgColor: "rgba(239, 68, 68, 0.1)"
    },
    {
      label: "Net Savings",
      value: `₹${dashData.net_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      color: dashData.net_savings >= 0 ? "var(--brand-gold)" : "var(--accent-red)",
      bgColor: "rgba(251, 191, 36, 0.1)"
    },
    {
      label: "Savings Rate",
      value: `${dashData.savings_rate}%`,
      icon: Percent,
      color: "var(--accent-blue)",
      bgColor: "rgba(59, 130, 246, 0.1)"
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title */}
      <div>
        <h1 style={{ color: "var(--text-primary)" }}>Unified Wealth Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          A snapshot of your consolidated income, savings rates, and categorization breakdowns.
        </p>
      </div>

      {/* Stats Summary Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: card.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{card.label}</span>
                <span style={{ fontSize: "1.5rem", fontWeight: "700", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>Income vs Expense Trend</h2>
          <TrendChart data={dashData.monthly_trend} />
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>Spending Distribution</h2>
          <SpendingChart data={dashData.category_breakdown} />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2>Recent Ledger (Last 15 Transactions)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 8px" }}>Date</th>
                <th style={{ padding: "12px 8px" }}>Description</th>
                <th style={{ padding: "12px 8px" }}>Category</th>
                <th style={{ padding: "12px 8px" }}>Type</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {dashData.recent_transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{t.date}</td>
                  <td style={{ padding: "12px 8px", fontWeight: "500", color: "var(--text-primary)" }}>{t.description}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span className="badge" style={{
                      backgroundColor: t.type === "income" ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.05)",
                      color: t.type === "income" ? "var(--brand-emerald)" : "var(--text-primary)"
                    }}>
                      {t.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", color: t.type === "income" ? "var(--brand-emerald)" : "var(--accent-red)", textTransform: "capitalize" }}>
                    {t.type}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", color: t.type === "income" ? "var(--brand-emerald)" : "var(--text-primary)" }}>
                    ₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
