"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import { getPenilaian, savePenilaian } from "./actions";

type Kelas = {
  id: string;
  kode: string;
  nama: string;
};

type Mahasiswa = {
  id: string;
  nim: string;
  nama: string;
  kelas_id: string;
};

type PenilaianClientProps = {
  kelasList: Kelas[];
  mahasiswaList: Mahasiswa[];
};

type PenilaianState = {
  pelaksanaan_skor: number;
  laporan_skor: number;
  waktu_skor: number;
  kehadiran_skor: number;
  absensi_status: string;
};

const MOCK_PERTEMUAN = Array.from({ length: 12 }, (_, i) => `Pertemuan ${i + 1}`);

export default function PenilaianClient({ kelasList, mahasiswaList }: PenilaianClientProps) {
  const [activeKelas, setActiveKelas] = useState(kelasList[0]?.id || "");
  const [activePertemuan, setActivePertemuan] = useState(MOCK_PERTEMUAN[0]);
  
  const [penilaian, setPenilaian] = useState<Record<string, PenilaianState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!activeKelas) return;
      setIsLoading(true);
      try {
        const pertemuanNum = parseInt(activePertemuan.replace("Pertemuan ", ""));
        const data = await getPenilaian(activeKelas, pertemuanNum);
        if (isMounted) setPenilaian(data);
      } catch (error) {
        if (isMounted) {
          console.error(error);
          showToast("Gagal memuat data penilaian", "error");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [activeKelas, activePertemuan]);

  const handleScoreChange = (mhsId: string, field: keyof PenilaianState, value: number) => {
    setPenilaian(prev => {
      const current = prev[mhsId] || { pelaksanaan_skor: 0, laporan_skor: 0, waktu_skor: 0, kehadiran_skor: 0, absensi_status: "ALPA" };
      return {
        ...prev,
        [mhsId]: { ...current, [field]: value }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pertemuanNum = parseInt(activePertemuan.replace("Pertemuan ", ""));
      const payload: Record<string, {pelaksanaan_skor: number, laporan_skor: number, waktu_skor: number}> = {};
      
      filteredMahasiswa.forEach(mhs => {
        const record = penilaian[mhs.id] || { pelaksanaan_skor: 0, laporan_skor: 0, waktu_skor: 0 };
        payload[mhs.id] = {
          pelaksanaan_skor: record.pelaksanaan_skor,
          laporan_skor: record.laporan_skor,
          waktu_skor: record.waktu_skor
        };
      });

      await savePenilaian(pertemuanNum, payload);
      showToast("Data penilaian telah disimpan", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan penilaian", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMahasiswa = useMemo(() => {
    return mahasiswaList.filter(m => m.kelas_id === activeKelas);
  }, [mahasiswaList, activeKelas]);

  if (kelasList.length === 0) {
    return (
      <div style={{ padding: "var(--space-6)", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Belum ada data kelas yang tersedia di database.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", position: "relative", width: "100%" }}>
      
      {/* Toast Notification */}
      <div style={{
        position: "fixed",
        top: "var(--space-6)",
        right: "var(--space-6)",
        background: toast.type === "success" ? "var(--color-green-light)" : "var(--color-danger-light)",
        border: `1px solid ${toast.type === "success" ? "var(--color-green)" : "var(--color-danger)"}`,
        color: toast.type === "success" ? "var(--color-green)" : "var(--color-danger)",
        padding: "12px 20px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        transform: toast.show ? "translateY(0)" : "translateY(-150%)",
        opacity: toast.show ? 1 : 0,
        transition: "all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        zIndex: 50,
        fontWeight: 500
      }}>
        {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
        {toast.message}
      </div>

      {/* Tab Kelas */}
      <div style={{ display: "flex", gap: "var(--space-2)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-4)", overflowX: "auto" }}>
        {kelasList.map(kelas => (
          <button
            key={kelas.id}
            onClick={() => setActiveKelas(kelas.id)}
            style={{
              padding: "6px 16px",
              background: activeKelas === kelas.id ? "var(--color-gold-light)" : "transparent",
              color: activeKelas === kelas.id ? "var(--color-gold-hover)" : "var(--color-text-secondary)",
              fontWeight: activeKelas === kelas.id ? 600 : 400,
              borderBottom: activeKelas === kelas.id ? "2px solid var(--color-gold)" : "2px solid transparent",
              borderRadius: "6px 6px 0 0",
              transition: "all 150ms",
              whiteSpace: "nowrap"
            }}
          >
            {kelas.nama}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-h2)" }}>Daftar Penilaian</h2>
        
        {/* Dropdown Pertemuan */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontSize: "var(--text-body-medium)" }}>Pilih Pertemuan:</span>
          <select 
            value={activePertemuan}
            onChange={(e) => setActivePertemuan(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-elevated)",
              outline: "none"
            }}
          >
            {MOCK_PERTEMUAN.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Penilaian */}
      <div style={{ position: "relative", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px", overflowX: "auto", overflowY: "auto", minHeight: "200px", maxHeight: "calc(100vh - 300px)" }}>
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <Loader2 style={{ animation: "spin 1s linear infinite", width: "32px", height: "32px", color: "var(--color-gold)" }} />
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "1000px" }}>
          <thead style={{ background: "var(--color-black)", color: "var(--color-surface)", position: "sticky", top: 0, zIndex: 5 }}>
            <tr>
              <th style={{ padding: "12px", fontWeight: 600, width: "50px" }}>No</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "130px" }}>NIM</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "300px" }}>Nama Praktikan</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "150px" }}>Pelaksanaan (35%)</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "150px" }}>Laporan (25%)</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "150px" }}>Waktu Kumpul (25%)</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "150px" }}>Kehadiran (15%)</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "80px", textAlign: "center" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredMahasiswa.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  Tidak ada mahasiswa di kelas ini.
                </td>
              </tr>
            ) : (
              filteredMahasiswa.map((mhs, idx) => {
                const record = penilaian[mhs.id] || { pelaksanaan_skor: 0, laporan_skor: 0, waktu_skor: 0, kehadiran_skor: 0, absensi_status: "ALPA" };
                
                const totalSkor = (record.pelaksanaan_skor * 0.35 * 20) + (record.laporan_skor * 0.25 * 20) + (record.waktu_skor * 0.25 * 20) + (record.kehadiran_skor * 0.15 * 20);

                const selectStyle = {
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border)",
                  outline: "none",
                  background: "var(--color-surface)",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "13px"
                };

                return (
                  <tr key={mhs.id} style={{ borderBottom: "1px solid var(--color-surface-sunken)" }}>
                    <td style={{ padding: "12px" }}>{idx + 1}</td>
                    <td className="tabular-nums" style={{ padding: "12px" }}>{mhs.nim}</td>
                    <td style={{ padding: "12px", fontWeight: 500 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px" }}>
                        {mhs.nama}
                      </div>
                    </td>
                    
                    {/* Pelaksanaan Praktikum */}
                    <td style={{ padding: "12px" }}>
                      <select value={record.pelaksanaan_skor} onChange={(e) => handleScoreChange(mhs.id, "pelaksanaan_skor", parseInt(e.target.value))} style={selectStyle}>
                        <option value="5">5 - 100% langkah</option>
                        <option value="4">4 - &ge; 80% langkah</option>
                        <option value="3">3 - &ge; 60% langkah</option>
                        <option value="2">2 - &ge; 40% langkah</option>
                        <option value="1">1 - &ge; 20% langkah</option>
                        <option value="0">0 - Tidak hadir/melaksanakan</option>
                      </select>
                    </td>

                    {/* Laporan Praktikum */}
                    <td style={{ padding: "12px" }}>
                      <select value={record.laporan_skor} onChange={(e) => handleScoreChange(mhs.id, "laporan_skor", parseInt(e.target.value))} style={selectStyle}>
                        <option value="5">5 - 100% laporan tepat</option>
                        <option value="4">4 - &ge; 80% laporan tepat</option>
                        <option value="3">3 - &ge; 60% laporan tepat</option>
                        <option value="2">2 - &ge; 40% laporan tepat</option>
                        <option value="1">1 - &ge; 20% laporan tepat</option>
                        <option value="0">0 - Tidak kumpul laporan</option>
                      </select>
                    </td>

                    {/* Ketepatan Waktu Pengumpulan */}
                    <td style={{ padding: "12px" }}>
                      <select value={record.waktu_skor} onChange={(e) => handleScoreChange(mhs.id, "waktu_skor", parseInt(e.target.value))} style={selectStyle}>
                        <option value="5">5 - Tepat waktu / awal</option>
                        <option value="4">4 - Terlambat &le; 1 hari</option>
                        <option value="3">3 - Terlambat 2-3 hari</option>
                        <option value="2">2 - Terlambat 4-7 hari</option>
                        <option value="1">1 - Terlambat &gt; 7 hari</option>
                        <option value="0">0 - Tidak mengumpulkan</option>
                      </select>
                    </td>

                    {/* Kehadiran & Kedisiplinan (Read-Only) */}
                    <td style={{ padding: "12px" }}>
                      <div style={{
                        padding: "6px 8px",
                        borderRadius: "4px",
                        background: "var(--color-surface-sunken)",
                        color: "var(--color-text-secondary)",
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>{record.absensi_status}</span>
                        <span style={{ fontWeight: 600, color: "var(--color-black)" }}>{record.kehadiran_skor}</span>
                      </div>
                    </td>

                    {/* Total Skor */}
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ 
                        display: "inline-block", 
                        padding: "6px 12px", 
                        background: totalSkor >= 80 ? "var(--color-green-light)" : totalSkor >= 50 ? "var(--color-warning-light)" : "var(--color-danger-light)",
                        color: totalSkor >= 80 ? "var(--color-green)" : totalSkor >= 50 ? "var(--color-warning)" : "var(--color-danger)",
                        borderRadius: "16px",
                        fontWeight: 700,
                        fontSize: "14px"
                      }}>
                        {totalSkor.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            background: isSaving || isLoading ? "var(--color-surface-sunken)" : "var(--color-gold)",
            color: isSaving || isLoading ? "var(--color-text-secondary)" : "var(--color-black)",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: isSaving || isLoading ? "not-allowed" : "pointer",
            transition: "all 150ms"
          }}
        >
          {isSaving ? <Loader2 style={{ animation: "spin 1s linear infinite", width: "18px", height: "18px" }} /> : <Save size={18} />}
          {isSaving ? "Menyimpan..." : "Simpan Penilaian"}
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
