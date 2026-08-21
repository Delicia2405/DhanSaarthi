import React, { useState } from "react";
import { Calendar, AlertCircle, TrendingUp, CheckCircle, Trash2, Edit2, Check } from "lucide-react";

export default function GoalCard({ goal, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(goal.target_amount);
  const [editSaved, setEditSaved] = useState(goal.saved_amount);

  const pct = Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100);
  const dateStr = new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" });
  
  const handleSave = () => {
    onUpdate(goal.id, {
      name: editName,
      target_amount: parseFloat(editTarget),
      saved_amount: parseFloat(editSaved)
    });
    setIsEditing(false);
  };

  const handleQuickAdd = (amt) => {
    onUpdate(goal.id, {
      saved_amount: parseFloat(goal.saved_amount) + amt
    });
  };

  return (
    <div className="card" style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      minWidth: "280px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <input 
              type="text" 
              className="form-control" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              placeholder="Goal Name"
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="number" 
                className="form-control" 
                value={editTarget} 
                onChange={e => setEditTarget(e.target.value)} 
                placeholder="Target (INR)"
              />
              <input 
                type="number" 
                className="form-control" 
                value={editSaved} 
                onChange={e => setEditSaved(e.target.value)} 
                placeholder="Saved (INR)"
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end", marginTop: "4px" }}>
              <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={handleSave}><Check size={14}/> Save</button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--text-primary)" }}>{goal.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
                <Calendar size={14} />
                Target Date: {dateStr}
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button 
                onClick={() => setIsEditing(true)} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => onDelete(goal.id)} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent-red)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Progress Section */}
      {!isEditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Progress: <strong style={{ color: "var(--text-primary)" }}>{pct}%</strong>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              ₹{goal.saved_amount.toLocaleString()} / <strong>₹{goal.target_amount.toLocaleString()}</strong>
            </span>
          </div>
          {/* Progress Bar Container */}
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "var(--border)",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${pct}%`,
              height: "100%",
              background: "var(--grad-brand)",
              borderRadius: "4px",
              transition: "width 0.5s ease-out"
            }} />
          </div>
        </div>
      )}

      {/* Trajectory Insight */}
      {!isEditing && (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "0.85rem"
        }}>
          {goal.shortfall > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--accent-amber)" }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  Shortfall projected: <strong>INR {goal.shortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> at current savings rate.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--brand-emerald)" }}>
                <TrendingUp size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  Increase savings by <strong>INR {goal.suggested_monthly_increase.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</strong> to meet target.
                </span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand-emerald)" }}>
              <CheckCircle size={16} />
              <span>On track! Current savings rate covers your target timeline.</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!isEditing && (
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: "6px 12px", fontSize: "0.8rem" }}
            onClick={() => handleQuickAdd(1000)}
          >
            + ₹1,000
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: "6px 12px", fontSize: "0.8rem" }}
            onClick={() => handleQuickAdd(5000)}
          >
            + ₹5,000
          </button>
        </div>
      )}
    </div>
  );
}
