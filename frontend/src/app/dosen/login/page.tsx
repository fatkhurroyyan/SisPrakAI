"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import styles from "../../Login.module.css";

export default function LoginDosenPage() {
  const router = useRouter();
  const [kodeDosen, setKodeDosen] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: "success" | "error"} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Editorial Split (Left) */}
      <div className={styles.editorialSide}>
        <div className={styles.editorialContent}>
          <h1 className={styles.title}>
            Portal<br/>Dosen<br/>Sistem<br/>Cerdas.
          </h1>
          <p className={styles.subtitle}>
            Akses tingkat lanjut untuk manajemen, pemantauan, dan evaluasi hasil praktikum mahasiswa secara keseluruhan.
          </p>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.bezelOuter}>
            <div className={styles.bezelInner}>
              <div className={styles.iconWrapper}>
                <Lock size={28} color="var(--color-gold)" />
              </div>
              
              <h2 className={styles.formTitle}>Masuk</h2>
              <p className={styles.formSubtitle}>Silakan masukkan 3 huruf Kode Dosen Anda untuk melanjutkan.</p>

              <form onSubmit={handleLogin}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Kode Dosen</label>
                  <div className={styles.inputWrapper}>
                    <KeyRound size={20} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      value={kodeDosen}
                      onChange={(e) => setKodeDosen(e.target.value.toUpperCase())}
                      placeholder="Contoh: YSN"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || kodeDosen.length !== 3}
                >
                  {loading ? "Memverifikasi..." : "Login Dosen"}
                </button>
              </form>
              
              <div style={{ marginTop: "32px", textAlign: "center" }}>
                <a href="/" style={{ fontSize: "14px", color: "var(--color-text-tertiary)", textDecoration: "none" }}>
                  &larr; Kembali ke halaman awal
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
