import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { useAuth } from "../AuthContext";

export default function Chat() {
  const { interestId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("connecting");
  const ws = useRef(null);
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const wsUrl = API_BASE_URL.replace(/^http/, "ws");
    ws.current = new WebSocket(`${wsUrl}/ws/chat/${interestId}?token=${token}`);
    ws.current.onopen = () => setStatus("connected");
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "history" || data.type === "message") {
        setMessages((prev) => [...prev, data]);
      }
    };
    ws.current.onclose = (e) => setStatus(`disconnected`);
    ws.current.onerror = () => setStatus("error");
    return () => ws.current?.close();
  }, [interestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ content: input }));
    setInput("");
  };

  return (
    <div style={{ maxWidth: 640, margin: "48px auto", padding: "0 24px" }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 20,
      }}>
        Chat
      </h2>

      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(201,184,240,0.1)",
              border: "1px solid rgba(201,184,240,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--pastel-purple)",
            }}>
              R
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Room Chat</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                Request #{interestId}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: status === "connected" ? "var(--pastel-mint)" : "var(--muted)",
            }} />
            <span style={{ color: "var(--muted2)" }}>{status}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          height: 400, overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", marginTop: 60, fontSize: 14 }}>
              No messages yet — say hello!
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} style={{
              display: "flex",
              justifyContent: m.sender_id === user?.id ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "68%", padding: "10px 14px", borderRadius: 12,
                fontSize: 13, lineHeight: 1.5,
                background: m.sender_id === user?.id
                  ? "rgba(201,184,240,0.12)"
                  : "var(--card2)",
                border: m.sender_id === user?.id
                  ? "1px solid rgba(201,184,240,0.15)"
                  : "1px solid var(--border)",
                color: m.sender_id === user?.id ? "var(--pastel-purple)" : "var(--text)",
                borderBottomRightRadius: m.sender_id === user?.id ? 4 : 12,
                borderBottomLeftRadius: m.sender_id === user?.id ? 12 : 4,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: "10px 14px",
              background: "var(--black2)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 13, color: "var(--text)", outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button onClick={send} style={{
            background: "var(--pastel-purple)", color: "#1a1228",
            border: "none", borderRadius: 8,
            padding: "10px 18px", fontWeight: 700, fontSize: 13,
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}