"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

export default function LoginDosenPage() {
  const router = useRouter();
  const [kodeDosen, setKodeDosen] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{message: string, type: "success" | "error"} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login-dosen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_dosen: kodeDosen.toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal login");
      }

      setToast({ message: "Berhasil login, mengalihkan...", type: "success" });
      setTimeout(() => {
        router.push(data.redirectUrl);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      padding: "24px"
    }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div style={{
        background: "var(--color-surface)",
        padding: "40px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "400px",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "64px", 
            height: "64px", 
            background: "var(--color-surface-sunken)", 
            borderRadius: "50%",
            marginBottom: "16px",
            border: "1px solid var(--color-gold)"
          }}>
            <Lock size={32} color="var(--color-gold)" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Portal Dosen AI</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Masuk dengan Kode Dosen</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Kode Dosen (3 Huruf Besar)
            </label>
            <div style={{ position: "relative" }}>
              <KeyRound size={20} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
              <input
                type="text"
                value={kodeDosen}
                onChange={(e) => setKodeDosen(e.target.value.toUpperCase())}
                placeholder="Contoh: YSN"
                maxLength={3}
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  background: "var(--color-surface-sunken)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text)",
                  outline: "none",
                  textTransform: "uppercase",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || kodeDosen.length !== 3}
            style={{
              marginTop: "8px",
              background: "var(--color-gold)",
              color: "var(--color-black)",
              padding: "14px",
              borderRadius: "8px",
              fontWeight: 600,
              border: "none",
              cursor: loading || kodeDosen.length !== 3 ? "not-allowed" : "pointer",
              opacity: loading || kodeDosen.length !== 3 ? 0.7 : 1,
              transition: "opacity 0.2s"
            }}
          >
            {loading ? "Memverifikasi..." : "Login sebagai Dosen"}
          </button>
        </form>
        
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px" }}>
          <a href="/" style={{ color: "var(--color-text-secondary)", textDecoration: "underline" }}>Kembali ke Menu Utama</a>
        </div>
      </div>
    </div>
  );
}
