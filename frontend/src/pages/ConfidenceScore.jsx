import React, { useState } from "react";
import ScoreGauge from "../components/ScoreGauge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ShieldCheck, HelpCircle, ArrowRight, RefreshCw, BarChart2 } from "lucide-react";
import { apiService } from "../api/client";

export default function ConfidenceScore({ scoreData = null, onQuizComplete = null }) {
  const [quizAnswers, setQuizAnswers] = useState({ goal: "", reaction: "", horizon: "" });
  const [riskProfile, setRiskProfile] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize quiz from localStorage if exists
  React.useEffect(() => {
    const cached = localStorage.getItem("dhansaarthi_mock_db");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.riskProfile) {
        setRiskProfile(parsed.riskProfile);
        setQuizSubmitted(true);
      }
    }
  }, []);

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizAnswers.goal || !quizAnswers.reaction || !quizAnswers.horizon) return;
    setLoading(true);
    try {
      const res = await apiService.submitRiskProfile(quizAnswers);
      setRiskProfile(res);
      setQuizSubmitted(true);
      if (onQuizComplete) onQuizComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({ goal: "", reaction: "", horizon: "" });
    setQuizSubmitted(false);
    setRiskProfile(null);
  };

  if (!scoreData) {
    return (
      <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Loading score metrics...
      </div>
    );
  }

  const breakdownKeys = Object.entries(scoreData.breakdown || {});

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title */}
      <div>
        <h1 style={{ color: "var(--text-primary)" }}>Financial Confidence Score</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          A consolidated index (0-100) reflecting savings health, liquidity depth, spending self-control, and goal tracks.
        </p>
      </div>

      {/* Main Score & Factors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
        {/* Circle Gauge Card */}
        <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <ScoreGauge score={scoreData.confidence_score} />
        </div>

        {/* Factors Breakdown Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>Component Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {breakdownKeys.map(([key, item]) => {
              const scorePct = (item.score / item.max_score) * 100;
              let scoreColor = "var(--brand-emerald)";
              if (scorePct < 45) scoreColor = "var(--accent-red)";
              else if (scorePct < 70) scoreColor = "var(--accent-amber)";

              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Current: <strong>{item.value}{item.unit}</strong> | Score: <strong style={{ color: scoreColor }}>{item.score} / {item.max_score}</strong>
                    </span>
                  </div>
                  {/* Progress bar representing weight */}
                  <div style={{ width: "100%", height: "6px", backgroundColor: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${scorePct}%`,
                      height: "100%",
                      backgroundColor: scoreColor,
                      borderRadius: "3px",
                      transition: "width 0.6s ease-out"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Score History Graph & Risk Profiling Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Score History Line Chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>Score History (Last 30 Days)</h2>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData.score_history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  itemStyle={{ color: "var(--brand-emerald)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  name="Confidence Score" 
                  stroke="var(--brand-gold)" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: "var(--bg-card)", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Profile Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>Risk Profiling Quiz</h2>
          
          {!quizSubmitted ? (
            <form onSubmit={handleQuizSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
              <div className="form-group">
                <label className="form-label">What is your primary investment goal?</label>
                <select 
                  className="form-control"
                  value={quizAnswers.goal}
                  onChange={e => setQuizAnswers({ ...quizAnswers, goal: e.target.value })}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="safety">Capital Preservation & Safety (Conservative)</option>
                  <option value="balance">Balanced Income & Growth (Moderate)</option>
                  <option value="growth">Aggressive Portfolio Appreciation (Aggressive)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">How would you react to a 20% drop in your portfolio value?</label>
                <select 
                  className="form-control"
                  value={quizAnswers.reaction}
                  onChange={e => setQuizAnswers({ ...quizAnswers, reaction: e.target.value })}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="sell">Sell everything to prevent further losses</option>
                  <option value="hold">Do nothing and wait for recovery</option>
                  <option value="buy">Invest more capital at discounted prices</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">What is your expected investment horizon?</label>
                <select 
                  className="form-control"
                  value={quizAnswers.horizon}
                  onChange={e => setQuizAnswers({ ...quizAnswers, horizon: e.target.value })}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="short">Short term (Less than 1 year)</option>
                  <option value="medium">Medium term (1 to 5 years)</option>
                  <option value="long">Long term (More than 5 years)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !quizAnswers.goal || !quizAnswers.reaction || !quizAnswers.horizon}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {loading ? "Classifying Profile..." : "Submit Profile Assessment"}
              </button>
            </form>
          ) : (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-green" style={{
                  fontSize: "0.9rem",
                  padding: "6px 14px",
                  fontWeight: "700"
                }}>
                  {riskProfile?.risk_profile} Investor
                </span>
                <button 
                  onClick={handleRetakeQuiz}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                >
                  <RefreshCw size={14}/> Retake Quiz
                </button>
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{riskProfile?.description}</p>

              {/* Allocation Layout */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                <h3 style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>Optimal Asset Allocation</h3>
                <div style={{ display: "flex", width: "100%", height: "24px", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ width: `${riskProfile?.allocation.equities}%`, backgroundColor: "var(--brand-emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                    Eq {riskProfile?.allocation.equities}%
                  </div>
                  <div style={{ width: `${riskProfile?.allocation.debt_bonds}%`, backgroundColor: "var(--brand-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", color: "#000" }}>
                    Bonds {riskProfile?.allocation.debt_bonds}%
                  </div>
                  <div style={{ width: `${riskProfile?.allocation.cash_fds}%`, backgroundColor: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                    Cash {riskProfile?.allocation.cash_fds}%
                  </div>
                </div>
                {/* Visual Legend */}
                <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--brand-emerald)" }} /> Equities
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--brand-gold)" }} /> Debt / Bonds
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--accent-blue)" }} /> Cash / FDs
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
