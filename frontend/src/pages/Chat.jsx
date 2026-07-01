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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const wsUrl = API_BASE_URL.replace(/^http/, "ws");
    ws.current = new WebSocket(`${wsUrl}/ws/chat/${interestId}?token=${token}`);

    ws.current.onopen = () => setStatus("connected");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "history" || data.type === "message") {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.current.onclose = (event) => {
      setStatus(`disconnected (code: ${event.code})`);
    };

    ws.current.onerror = () => setStatus("error");

    return () => {
      ws.current?.close();
    };
  }, [interestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ content: input }));
    setInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Chat</h2>
      <p style={{ fontSize: 12, color: "#888" }}>Status: {status}</p>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          height: 400,
          overflowY: "auto",
          padding: 12,
          marginBottom: 10,
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              textAlign: m.sender_id === user?.id ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: m.sender_id === user?.id ? "#daf1da" : "#eee",
                padding: "6px 12px",
                borderRadius: 12,
                maxWidth: "70%",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage} style={{ padding: "8px 16px" }}>
          Send
        </button>
      </div>
    </div>
  );
}