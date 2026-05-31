"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // ИЗМЕНЕНО: теперь запрос идет на свой API, а не напрямую в LM Studio
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setMessages((prev) => [...prev, { from: "bot", text: `Ошибка: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { from: "bot", text: data.response }]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setMessages((prev) => [...prev, { from: "bot", text: "Ошибка: сервер недоступен. Проверьте, запущен ли LM Studio." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        right: "20px",
        width: "340px",
        height: "450px",
        backgroundColor: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: "#ff6600",
          color: "#fff",
          fontWeight: 600,
          fontSize: "16px",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Чат-бот
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          backgroundColor: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              display: "flex",
              flexDirection: "column",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                backgroundColor: m.from === "user" ? "#ffebcc" : "#f0f0f0",
                color: "#111",
                padding: "8px 12px",
                borderRadius: "12px",
                maxWidth: "100%",
                wordBreak: "break-word",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}

        {loading && <span style={{ fontSize: "12px", color: "#999" }}>Анализирую...</span>}
        <div ref={scrollRef}></div>
      </div>

      <div
        style={{
          display: "flex",
          padding: "10px",
          gap: "6px",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Напишите сообщение..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            outline: "none",
            fontSize: "14px",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            backgroundColor: "#ff6600",
            border: "none",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
