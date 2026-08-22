import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = {
  "Housing & Rent": "#6366f1",
  "Food & Dining": "#fb7185",
  "Groceries": "#34d399",
  "Shopping": "#fbbf24",
  "Transport": "#38bdf8",
  "Utilities": "#a78bfa",
  "Entertainment": "#f43f5e",
  "Investments": "#10b981",
  "Bills & Loans": "#f87171",
  "Personal Care": "#ec4899",
  "Education": "#06b6d4",
  "Other": "#71717a"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-lg)"
      }}>
        <p style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "4px" }}>
          {data.category}
        </p>
        <p style={{ color: payload[0].color, fontSize: "0.85rem", fontWeight: "700" }}>
          INR {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
          {data.percentage}% of total expenses
        </p>
      </div>
    );
  }
  return null;
};

export default function SpendingChart({ data = [] }) {
  // Filter out Income from the category breakdown to focus only on spending distribution
  const spendingData = data.filter(item => item.category.toLowerCase() !== "income" && item.amount > 0);

  if (spendingData.length === 0) {
    return (
      <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        No spending data available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={spendingData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="amount"
            nameKey="category"
          >
            {spendingData.map((entry, index) => {
              const color = COLORS[entry.category] || COLORS["Other"];
              return <Cell key={`cell-${index}`} fill={color} stroke="var(--bg-card)" strokeWidth={2} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconSize={10} 
            iconType="circle"
            formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
