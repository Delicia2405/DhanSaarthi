import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  PieChart, 
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { apiService } from "../api/client";

export default function ChatAssistant({ dashData, scoreData, goals = [] }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "👋 **Namaste! I am Saarthi AI**, your personal wealth assistant.\n\nI have analyzed your bank statements, spending categories, and financial goals. How can I help you optimize your money today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: [
        "Where is most of my money going?",
        "How can I improve my confidence score?",
        "Can I reach my financial goals on time?",
        "How much did I spend on Food & Dining?"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build history
      const history = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await apiService.sendChatMessage(query, history);

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: res.reply || "I couldn't process that query. Please try asking in a different way.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: res.suggestions || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: "⚠️ I encountered an issue connecting to the financial engine. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: ["What are my top expenses?", "Check confidence score"]
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: "Conversation cleared! What financial insights would you like to explore now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "Where is most of my money going?",
          "How to improve my confidence score?",
          "Review my active financial goals"
        ]
      }
    ]);
  };

  const renderFormattedText = (text) => {
    // Process markdown-like text safely
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Bold text formatting
      let formatted = line;
      
      // Bullet point detection
      const isBullet = formatted.startsWith("- ") || formatted.startsWith("* ");
      if (isBullet) {
        formatted = formatted.substring(2);
      }

      // Parse bold tags **text**
      const parts = formatted.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <div key={idx} style={{ marginBottom: line.trim() === "" ? "8px" : "4px", paddingLeft: isBullet ? "16px" : "0" }}>
          {isBullet && <span style={{ color: "var(--brand-gold)", marginRight: "6px" }}>•</span>}
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={pIdx} style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.85em",
                  color: "var(--brand-emerald)"
                }}>
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  // Quick Starter Prompts
  const quickTopics = [
    { label: "Cash Flow Summary", icon: TrendingUp, query: "What is my monthly cash flow and savings rate?" },
    { label: "Top Expenses", icon: PieChart, query: "Where is most of my money going?" },
    { label: "Boost Score", icon: ShieldCheck, query: "How can I improve my financial confidence score?" },
    { label: "Goal Feasibility", icon: Target, query: "Can I reach my financial goals on time?" }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", minHeight: "calc(100vh - 120px)", padding: "16px 0" }}>
      {/* Main Chat Area */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Chat Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(24, 24, 27, 0.8)",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--grad-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(245, 158, 11, 0.3)"
            }}>
              <Bot size={22} color="#09090b" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                  Saarthi AI
                </h2>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "var(--brand-emerald)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.72rem",
                  fontWeight: "600"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--brand-emerald)" }} />
                  Live Copilot
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Context-aware personal wealth intelligence
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="btn"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
            title="Clear Chat History"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        {/* Quick Topic Chips Header */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "10px 24px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(9, 9, 11, 0.4)",
          overflowX: "auto"
        }}>
          {quickTopics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <button
                key={i}
                onClick={() => handleSend(topic.query)}
                disabled={loading}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.1)";
                  e.currentTarget.style.borderColor = "var(--brand-gold)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <Icon size={13} style={{ color: "var(--brand-gold)" }} />
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Message Thread Container */}
        <div style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                  gap: "6px"
                }}
              >
                <div style={{
                  display: "flex",
                  gap: "10px",
                  maxWidth: "85%",
                  flexDirection: isUser ? "row-reverse" : "row"
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: isUser ? "linear-gradient(135deg, #6366f1, #a855f7)" : "var(--grad-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px"
                  }}>
                    {isUser ? <User size={16} color="#ffffff" /> : <Bot size={16} color="#09090b" />}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    backgroundColor: isUser ? "#3b2d54" : "rgba(39, 39, 42, 0.6)",
                    border: isUser ? "1px solid #7c3aed" : "1px solid var(--border)",
                    borderRadius: isUser ? "14px 2px 14px 14px" : "2px 14px 14px 14px",
                    padding: "12px 16px",
                    color: "var(--text-primary)",
                    fontSize: "0.92rem",
                    lineHeight: "1.5",
                    position: "relative"
                  }}>
                    {renderFormattedText(msg.text)}

                    {/* Footer bar of bubble */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "6px",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)"
                    }}>
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check size={12} color="var(--brand-emerald)" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow-up Prompt Chips (for bot messages) */}
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginLeft: "42px",
                    marginTop: "4px"
                  }}>
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        disabled={loading}
                        style={{
                          backgroundColor: "rgba(245, 158, 11, 0.08)",
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                          color: "var(--brand-gold)",
                          padding: "4px 10px",
                          borderRadius: "14px",
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.08)";
                        }}
                      >
                        <Sparkles size={11} />
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--grad-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={16} color="#09090b" />
              </div>
              <div style={{
                backgroundColor: "rgba(39, 39, 42, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "2px 14px 14px 14px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Saarthi AI is analyzing...</span>
                <span style={{ display: "flex", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--brand-gold)", animation: "pulse 1s infinite" }} />
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--brand-gold)", animation: "pulse 1s infinite 0.2s" }} />
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--brand-gold)", animation: "pulse 1s infinite 0.4s" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: "flex",
            gap: "10px",
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            backgroundColor: "rgba(24, 24, 27, 0.95)"
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spending, goals, budgeting, or confidence score..."
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: "rgba(9, 9, 11, 0.8)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              color: "var(--text-primary)",
              fontSize: "0.92rem",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--brand-gold)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading ? "var(--grad-brand)" : "rgba(255, 255, 255, 0.1)",
              color: input.trim() && !loading ? "#09090b" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "0 20px",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Side Context Badge Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Profile Card */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px"
        }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={18} style={{ color: "var(--brand-emerald)" }} />
            Financial Intelligence
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Score */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Confidence Score</span>
              <strong style={{
                color: "var(--brand-emerald)",
                fontSize: "1.1rem",
                fontFamily: "var(--font-display)"
              }}>
                {scoreData?.confidence_score ?? scoreData?.score ?? 70}/100
              </strong>
            </div>

            {/* Savings Rate */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Savings Rate</span>
              <strong style={{ color: "var(--brand-gold)", fontSize: "1rem" }}>
                {dashData?.savings_rate ?? 32}%
              </strong>
            </div>

            {/* Inflow */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Inflow</span>
              <span style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
                ₹{(dashData?.total_income ?? 85000).toLocaleString()}
              </span>
            </div>

            {/* Outflow */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Outflow</span>
              <span style={{ color: "var(--accent-red)", fontSize: "0.9rem" }}>
                ₹{(dashData?.total_expense ?? 48000).toLocaleString()}
              </span>
            </div>

            {/* Active Goals */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Active Goals</span>
              <span style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "var(--brand-gold)",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "0.78rem",
                fontWeight: "600"
              }}>
                {goals?.length ?? 2} goals
              </span>
            </div>
          </div>
        </div>

        {/* Suggested Queries Card */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px"
        }}>
          <h4 style={{ fontSize: "0.88rem", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={16} style={{ color: "var(--brand-gold)" }} />
            Suggested Questions
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Where is most of my money going?",
              "Can I afford a ₹1,00,000 trip?",
              "How to improve my emergency fund?",
              "What is the 50/30/20 budget rule?",
              "How much did I spend on Swiggy / Zomato?"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.78rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-gold)";
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                }}
              >
                <span>{q}</span>
                <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
