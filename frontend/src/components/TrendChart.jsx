import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-lg)"
      }}>
        <p style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "6px" }}>
          {label}
        </p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color, fontSize: "0.85rem", fontWeight: "700" }}>
            {pld.name}: INR {pld.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        No historical trends available.
      </div>
    );
  }

  // Format display labels (e.g. "05 Aug" for daily, "Aug 2026" for monthly)
  const formattedData = data.map(item => {
    if (item.label) {
      return { ...item, displayLabel: item.label };
    }
    const parts = (item.month || "").split("-");
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    const label = isNaN(dateObj.getTime()) 
      ? (item.month || "")
      : dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return {
      ...item,
      displayLabel: label
    };
  });

  return (
    <div style={{ width: "100%", height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" cx="0" cy="0" r="1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand-emerald)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--brand-emerald)" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorExpense" cx="0" cy="0" r="1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="displayLabel" 
            stroke="var(--text-muted)" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `₹${(value / 1000)}k`} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconSize={10} 
            iconType="circle"
            formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{value}</span>}
          />
          <Area 
            type="monotone" 
            name="Income" 
            dataKey="income" 
            stroke="var(--brand-emerald)" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorIncome)" 
          />
          <Area 
            type="monotone" 
            name="Expense" 
            dataKey="expense" 
            stroke="var(--accent-red)" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorExpense)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
