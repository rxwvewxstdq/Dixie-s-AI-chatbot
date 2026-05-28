"use client"; // <- добавь в самом начале файла
import { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#ff6600",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          cursor: "pointer",
          fontSize: "24px",
          zIndex: 1000,
        }}
      >
        💬
      </button>
    </>
  );
}