export default function DosenDashboardPage() {
  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, marginBottom: "16px" }}>
        Dashboard Utama
      </h2>
      <div style={{ background: "var(--color-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
          Selamat datang di Dashboard Dosen. Silakan gunakan navigasi di sebelah kiri untuk mengakses Rekap Kehadiran dan Rekap Nilai Mahasiswa.
        </p>
      </div>
    </div>
  );
}
