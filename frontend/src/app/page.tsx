"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const [nim, setNim] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nim) {
      setError("NIM wajib diisi");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan");
      }

      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>SisPrakAI</h1>
        <div className={styles.divider} />
        
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="nim" className={styles.label}>
              NIM
            </label>
            <input
              id="nim"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="Masukkan NIM Anda"
              className={`${styles.input} tabular-nums ${error ? styles.inputError : ""}`}
              disabled={isLoading}
            />
          </div>
          
          {error && <p className={styles.errorText}>{error}</p>}

          <button type="submit" className={styles.button} disabled={isLoading || !nim}>
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>

      </div>
      <p className={styles.bottomText}>Kecerdasan Buatan &middot; Telkom University</p>
    </main>
  );
}
