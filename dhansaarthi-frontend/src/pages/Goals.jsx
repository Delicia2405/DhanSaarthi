import React, { useState } from "react";
import GoalCard from "../components/GoalCard";
import { Plus, Target, Check, Calendar } from "lucide-react";
import { apiService } from "../api/client";

export default function Goals({ goals = [], onRefresh, loading = false }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !targetDate) return;
    setFormLoading(true);
    try {
      await apiService.createGoal({
        name: goalName,
        target_amount: parseFloat(targetAmount),
        saved_amount: parseFloat(savedAmount || 0),
        target_date: targetDate
      });
      setShowAddForm(false);
      setGoalName("");
      setTargetAmount("");
      setSavedAmount("");
      setTargetDate("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateGoal = async (goalId, data) => {
    try {
      await apiService.updateGoal(goalId, data);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Are you sure you want to delete this financial goal?")) return;
    try {
      await apiService.deleteGoal(goalId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Title & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: "var(--text-primary)" }}>Financial Goals & Gap Analysis</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            DhanSaarthi projects your savings trajectory against your goals, highlighting gaps and suggesting monthly actions.
          </p>
        </div>
        {!showAddForm && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(true)}
            style={{ padding: "10px 20px" }}
          >
            <Plus size={18} /> Add New Goal
          </button>
        )}
      </div>

      {/* Add Goal Form Container */}
      {showAddForm && (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
          <h2>Create Financial Goal</h2>
          <form onSubmit={handleCreateGoal} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={goalName} 
                onChange={e => setGoalName(e.target.value)} 
                placeholder="e.g. Europe Vacation, Emergency Buffer, Down Payment" 
                required 
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Target Amount (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={targetAmount} 
                  onChange={e => setTargetAmount(e.target.value)} 
                  placeholder="e.g. 150000" 
                  min="1"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Savings (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={savedAmount} 
                  onChange={e => setSavedAmount(e.target.value)} 
                  placeholder="e.g. 20000" 
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={targetDate} 
                onChange={e => setTargetDate(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                disabled={formLoading}
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={formLoading || !goalName || !targetAmount || !targetDate}
              >
                {formLoading ? "Creating Goal..." : "Create Goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
          Loading active goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "48px 24px", textAlign: "center" }}>
          <Target size={48} style={{ opacity: 0.5, color: "var(--text-muted)" }} />
          <div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>No Goals Configured</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Create a financial goal to project your trajectory and calculate potential gaps.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "24px",
          alignItems: "start"
        }}>
          {goals.map((g) => (
            <GoalCard 
              key={g.id} 
              goal={g} 
              onUpdate={handleUpdateGoal} 
              onDelete={handleDeleteGoal} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
