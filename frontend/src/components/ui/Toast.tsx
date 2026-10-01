"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for transition to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "var(--color-green)" : "var(--color-danger)";

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        background: type === "success" ? "var(--color-green)" : "var(--color-danger)",
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 9999,
        transition: "opacity 300ms ease, transform 300ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        fontWeight: 500,
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      {message}
    </div>
  );
}
