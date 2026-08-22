import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Send, Sparkles, User, Minimize2, Maximize2, RefreshCw } from "lucide-react";
import { apiService } from "../api/client";

export default function ChatWidget({ isOpenDefault = false, onOpenFullPage = null }) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "👋 Hi! I am **Saarthi AI**. Ask me anything about your finances or spending!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: ["Where is my money going?", "Can I afford my goals?", "Improve score"]
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, loading]);

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
      const history = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await apiService.sendChatMessage(query, history);

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: res.reply || "I couldn't process that. Please try another question.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: res.suggestions || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Widget chat error:", err);
      const errMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: "⚠️ Connection error. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let formatted = line;
      const isBullet = formatted.startsWith("- ") || formatted.startsWith("* ");
      if (isBullet) formatted = formatted.substring(2);

      const parts = formatted.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <div key={idx} style={{ marginBottom: line.trim() === "" ? "6px" : "3px", paddingLeft: isBullet ? "12px" : "0" }}>
          {isBullet && <span style={{ color: "var(--brand-gold)", marginRight: "4px" }}>•</span>}
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={pIdx} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={pIdx} style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  fontSize: "0.82em",
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

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--grad-brand)",
            border: "none",
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(245, 158, 11, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(245, 158, 11, 0.4)";
          }}
          title="Ask Saarthi AI"
        >
          <Bot size={28} color="#09090b" />
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div style={{
          width: "380px",
          height: "520px",
          backgroundColor: "#121215",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
          animation: "fadeIn 0.2s ease"
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "rgba(24, 24, 27, 0.95)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--grad-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={18} color="#09090b" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>Saarthi AI</span>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--brand-emerald)" }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Financial Copilot</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {onOpenFullPage && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullPage();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                  title="Expand to Full Page"
                >
                  <Maximize2 size={15} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px"
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            fontSize: "0.85rem"
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
                    gap: "4px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    maxWidth: "88%",
                    flexDirection: isUser ? "row-reverse" : "row"
                  }}>
                    <div style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      background: isUser ? "#6366f1" : "var(--grad-brand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px"
                    }}>
                      {isUser ? <User size={13} color="#ffffff" /> : <Bot size={13} color="#09090b" />}
                    </div>

                    <div style={{
                      backgroundColor: isUser ? "#3b2d54" : "rgba(39, 39, 42, 0.7)",
                      border: isUser ? "1px solid #7c3aed" : "1px solid var(--border)",
                      borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                      padding: "8px 12px",
                      color: "var(--text-primary)",
                      lineHeight: "1.4"
                    }}>
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>

                  {/* Suggestions */}
                  {!isUser && msg.suggestions && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginLeft: "34px", marginTop: "2px" }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sug)}
                          disabled={loading}
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            color: "var(--brand-gold)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          }}
                        >
                          <Sparkles size={10} />
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  background: "var(--grad-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Bot size={13} color="#09090b" />
                </div>
                <div style={{
                  backgroundColor: "rgba(39, 39, 42, 0.7)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px 12px 12px 12px",
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)"
                }}>
                  Analyzing metrics...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: "flex",
              gap: "8px",
              padding: "10px 14px",
              borderTop: "1px solid var(--border)",
              backgroundColor: "rgba(24, 24, 27, 0.95)"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Saarthi AI..."
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: "rgba(9, 9, 11, 0.8)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? "var(--grad-brand)" : "rgba(255, 255, 255, 0.1)",
                color: input.trim() && !loading ? "#09090b" : "var(--text-muted)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "0 12px",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center"
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
