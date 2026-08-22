import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ConfidenceScore from "./pages/ConfidenceScore";
import Goals from "./pages/Goals";
import Insights from "./pages/Insights";
import Upload from "./pages/Upload";
import Auth from "./pages/Auth";
import ChatAssistant from "./pages/ChatAssistant";
import ChatWidget from "./components/ChatWidget";
import { apiService } from "./api/client";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, scoreRes, goalsRes, insightsRes] = await Promise.all([
        apiService.getDashboard(),
        apiService.getScore(),
        apiService.getGoals(),
        apiService.getInsights()
      ]);
      setDashData(dashRes);
      setScoreData(scoreRes);
      setGoals(goalsRes);
      setInsights(insightsRes.recommendations || []);
    } catch (err) {
      console.error("Error loading application metrics:", err);
      setError("Failed to communicate with API server or fallback database.");
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("dhansaarthi_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiService.getMe();
      if (res && res.user) {
        setUser(res.user);
        await fetchAllData();
      } else {
        localStorage.removeItem("dhansaarthi_token");
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      if (token.startsWith("mock-token-")) {
        const parts = token.split("-");
        const parsedId = parseInt(parts[parts.length - 1]) || 1;
        const mockDB = JSON.parse(localStorage.getItem("dhansaarthi_mock_db") || "{}");
        const found = mockDB.users?.find(u => u.id === parsedId) || { id: 1, email: "demo@dhansaarthi.demo", name: "Demo User" };
        setUser(found);
        await fetchAllData();
      } else {
        localStorage.removeItem("dhansaarthi_token");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dhansaarthi_token");
    setUser(null);
    setDashData(null);
    setScoreData(null);
    setGoals([]);
    setInsights([]);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    fetchAllData();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard dashData={dashData} loading={loading} />;
      case "score":
        return (
          <ConfidenceScore 
            scoreData={scoreData} 
            onQuizComplete={fetchAllData} 
          />
        );
      case "goals":
        return (
          <Goals 
            goals={goals} 
            onRefresh={fetchAllData} 
            loading={loading} 
          />
        );
      case "chat":
        return (
          <ChatAssistant 
            dashData={dashData} 
            scoreData={scoreData} 
            goals={goals} 
          />
        );
      case "insights":
        return <Insights insightsData={insights} loading={loading} />;
      case "upload":
        return <Upload onUploadSuccess={fetchAllData} />;
      default:
        return <Dashboard dashData={dashData} loading={loading} />;
    }
  };

  if (loading && !user) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-zinc-950)",
        color: "var(--text-secondary)"
      }}>
        Initializing DhanSaarthi session...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: "#09090b", minHeight: "100vh", color: "#f4f4f5" }}>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />

      {/* Main Layout Container */}
      <main className="container" style={{ flex: 1, minHeight: "calc(100vh - 73px)" }}>
        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid var(--accent-red)",
            color: "var(--text-primary)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}
        {renderContent()}
      </main>

      {/* Global Floating AI Chatbot Widget (hidden when already on full chat page) */}
      {activeTab !== "chat" && (
        <ChatWidget onOpenFullPage={() => setActiveTab("chat")} />
      )}

      {/* Footer */}
      <footer style={{
        padding: "24px",
        textAlign: "center",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: "0.85rem",
        backgroundColor: "rgba(0, 0, 0, 0.2)"
      }}>
        DhanSaarthi Wealth Companion © 2026. Made with ♥ for the Hackathon.
      </footer>
    </div>
  );
}
