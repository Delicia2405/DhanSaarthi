import React, { useState, useEffect } from "react";
import SpendingChart from "../components/SpendingChart";
import TrendChart from "../components/TrendChart";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Percent, 
  Calendar, 
  Globe, 
  Clock, 
  Filter, 
  Sparkles, 
  Search, 
  TrendingUp,
  Info
} from "lucide-react";
import { apiService } from "../api/client";

export default function Dashboard({ dashData: initialDashData = null, loading: initialLoading = false }) {
  const [timeframe, setTimeframe] = useState("lifetime"); // "lifetime" | "yearly" | "monthly"
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentData, setCurrentData] = useState(initialDashData);
  const [fetching, setFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Sync with initialDashData on first load
  useEffect(() => {
    if (initialDashData) {
      setCurrentData(initialDashData);
      if (initialDashData.available_years?.length > 0 && !selectedYear) {
        setSelectedYear(initialDashData.available_years[0]);
      }
      if (initialDashData.available_months?.length > 0 && !selectedMonth) {
        setSelectedMonth(initialDashData.available_months[0].key);
      }
    }
  }, [initialDashData]);

  // Fetch report data whenever timeframe, year, or month changes
  const fetchReport = async (newTimeframe, yearVal, monthVal) => {
    setFetching(true);
    try {
      const res = await apiService.getDashboard({
        timeframe: newTimeframe,
        year: yearVal || selectedYear,
        month: monthVal || selectedMonth
      });
      setCurrentData(res);
      if (res.available_years?.length > 0 && !selectedYear) {
        setSelectedYear(res.available_years[0]);
      }
      if (res.available_months?.length > 0 && !selectedMonth) {
        setSelectedMonth(res.available_months[0].key);
      }
    } catch (err) {
      console.error("Failed to load filtered dashboard report:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleTimeframeChange = (newTf) => {
    setTimeframe(newTf);
    fetchReport(newTf, selectedYear, selectedMonth);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    fetchReport("yearly", year, selectedMonth);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    fetchReport("monthly", selectedYear, month);
  };

  if (initialLoading && !currentData) {
    return (
      <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "var(--text-secondary)" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--border)", borderTopColor: "var(--brand-emerald)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span>Loading wealth intelligence report...</span>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="card" style={{ padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
        <Info size={40} style={{ color: "var(--brand-gold)", marginBottom: "16px" }} />
        <h3 style={{ marginBottom: "8px" }}>No Financial Data Available</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Please upload your bank statement or link an account from the Link & Upload tab to generate your custom wealth reports.
        </p>
      </div>
    );
  }

  const availableYears = currentData.available_years || ["2026"];
  const availableMonths = currentData.available_months || [{ key: "2026-08", label: "August 2026" }];
  const activePeriodLabel = currentData.active_period_label || (
    timeframe === "yearly" ? `Year ${selectedYear || availableYears[0]}` :
    timeframe === "monthly" ? (availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth) :
    "Lifetime (All-Time)"
  );

  const statCards = [
    {
      label: "Total Income",
      subtext: `Earned in ${activePeriodLabel}`,
      value: `₹${(currentData.total_income || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: ArrowUpRight,
      color: "var(--brand-emerald)",
      bgColor: "rgba(16, 185, 129, 0.12)"
    },
    {
      label: "Total Expenses",
      subtext: `Spent in ${activePeriodLabel}`,
      value: `₹${(currentData.total_expense || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: ArrowDownRight,
      color: "var(--accent-red)",
      bgColor: "rgba(239, 68, 68, 0.12)"
    },
    {
      label: "Net Savings",
      subtext: (currentData.net_savings || 0) >= 0 ? "Surplus retained" : "Deficit (Expenses > Income)",
      value: `₹${(currentData.net_savings || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      color: (currentData.net_savings || 0) >= 0 ? "var(--brand-gold)" : "var(--accent-red)",
      bgColor: "rgba(251, 191, 36, 0.12)"
    },
    {
      label: "Savings Rate",
      subtext: (currentData.savings_rate || 0) >= 30 ? "🎯 Target Achieved (≥30%)" : "Target: 30% of income",
      value: `${currentData.savings_rate || 0}%`,
      icon: Percent,
      color: (currentData.savings_rate || 0) >= 30 ? "var(--brand-emerald)" : "var(--accent-blue)",
      bgColor: "rgba(59, 130, 246, 0.12)"
    }
  ];

  // Filter transactions for search query and category
  const rawTxns = currentData.recent_transactions || [];
  const filteredTxns = rawTxns.filter((t) => {
    const matchesSearch = searchQuery === "" || 
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Object.keys(currentData.by_category || {});

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Timeframe Report Selector */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "16px",
        paddingBottom: "8px"
      }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "1.85rem", fontWeight: "700" }}>
            Unified Wealth Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
            Choose a report timeframe to analyze your cashflow, savings, and expense patterns.
          </p>
        </div>

        {/* Timeframe Control Tabs */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px"
        }}>
          {/* Segmented Buttons */}
          <div style={{
            display: "inline-flex",
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            gap: "4px"
          }}>
            <button
              onClick={() => handleTimeframeChange("lifetime")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s ease",
                backgroundColor: timeframe === "lifetime" ? "var(--brand-emerald)" : "transparent",
                color: timeframe === "lifetime" ? "#042f2e" : "var(--text-secondary)"
              }}
            >
              <Globe size={15} />
              Lifetime
            </button>

            <button
              onClick={() => handleTimeframeChange("yearly")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s ease",
                backgroundColor: timeframe === "yearly" ? "var(--brand-emerald)" : "transparent",
                color: timeframe === "yearly" ? "#042f2e" : "var(--text-secondary)"
              }}
            >
              <Calendar size={15} />
              Yearly Report
            </button>

            <button
              onClick={() => handleTimeframeChange("monthly")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                transition: "all 0.2s ease",
                backgroundColor: timeframe === "monthly" ? "var(--brand-emerald)" : "transparent",
                color: timeframe === "monthly" ? "#042f2e" : "var(--text-secondary)"
              }}
            >
              <Clock size={15} />
              Monthly Report
            </button>
          </div>

          {/* Secondary Sub-Picker (Year or Month dropdown) */}
          {timeframe === "yearly" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Select Year:</span>
              <select
                value={selectedYear || availableYears[0] || ""}
                onChange={(e) => handleYearChange(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>Year {yr}</option>
                ))}
              </select>
            </div>
          )}

          {timeframe === "monthly" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Select Month:</span>
              <select
                value={selectedMonth || availableMonths[0]?.key || ""}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Plain-English Executive Summary Banner */}
      <div style={{
        backgroundColor: "rgba(24, 24, 27, 0.7)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        background: "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(24, 24, 27, 0.6) 100%)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Sparkles size={20} style={{ color: "var(--brand-emerald)" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand-emerald)" }}>
                Executive Report
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>•</span>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                {activePeriodLabel}
              </span>
            </div>
            <p style={{ fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: "1.4" }}>
              {currentData.executive_summary || `Report generated for ${activePeriodLabel}.`}
            </p>
          </div>
        </div>

        {fetching && (
          <span style={{ fontSize: "0.8rem", color: "var(--brand-gold)", animation: "pulse 1.5s infinite" }}>
            Refreshing report data...
          </span>
        )}
      </div>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: card.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "500" }}>{card.label}</span>
                <span style={{ fontSize: "1.45rem", fontWeight: "700", fontFamily: "var(--font-display)", color: "var(--text-primary)", margin: "2px 0" }}>
                  {card.value}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {card.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Cashflow Trend Chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "600" }}>
                {timeframe === "monthly" ? "Daily Cashflow Trajectory" : "Income vs Expense Progression"}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {timeframe === "monthly" ? `Day-by-day cashflow for ${activePeriodLabel}` : `Monthly trend for ${activePeriodLabel}`}
              </p>
            </div>
            <TrendingUp size={18} style={{ color: "var(--brand-emerald)" }} />
          </div>
          <TrendChart data={currentData.monthly_trend || currentData.trend_data || []} />
        </div>

        {/* Category Spending Breakdown Chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "600" }}>Spending Distribution</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Category allocation for {activePeriodLabel}
              </p>
            </div>
            <Filter size={18} style={{ color: "var(--brand-gold)" }} />
          </div>
          <SpendingChart data={currentData.category_breakdown || []} />
        </div>
      </div>

      {/* Ledger Section for Selected Timeframe */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "600" }}>
              Statement Ledger ({filteredTxns.length} records in {activePeriodLabel})
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Detailed line-items recorded for this timeframe.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search Box */}
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}>
              <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px 6px 30px",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                  width: "180px"
                }}
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 10px",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "10px 8px" }}>Date</th>
                <th style={{ padding: "10px 8px" }}>Description</th>
                <th style={{ padding: "10px 8px" }}>Category</th>
                <th style={{ padding: "10px 8px" }}>Type</th>
                <th style={{ padding: "10px 8px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No transactions found matching your search or timeframe filter.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((t, index) => {
                  const isIncome = t.type === "income" || t.category === "Income";
                  return (
                    <tr 
                      key={t.id || index} 
                      style={{ 
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        transition: "background-color 0.15s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "10px 8px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {t.date}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: "500", color: "var(--text-primary)" }}>
                        {t.description || "General Transaction"}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span className="badge" style={{
                          backgroundColor: isIncome ? "rgba(16, 185, 129, 0.08)" : "rgba(255,255,255,0.06)",
                          color: isIncome ? "var(--brand-emerald)" : "var(--text-secondary)",
                          fontSize: "0.78rem"
                        }}>
                          {t.category || "General"}
                        </span>
                      </td>
                      <td style={{ 
                        padding: "10px 8px", 
                        color: isIncome ? "var(--brand-emerald)" : "var(--accent-red)", 
                        textTransform: "capitalize",
                        fontSize: "0.82rem",
                        fontWeight: "600"
                      }}>
                        {t.type || (isIncome ? "income" : "expense")}
                      </td>
                      <td style={{ 
                        padding: "10px 8px", 
                        textAlign: "right", 
                        fontWeight: "700", 
                        color: isIncome ? "var(--brand-emerald)" : "var(--text-primary)" 
                      }}>
                        {isIncome ? "+" : "-"}₹{parseFloat(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
