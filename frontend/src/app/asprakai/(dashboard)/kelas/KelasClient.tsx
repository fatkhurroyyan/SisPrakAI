"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Save, Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { getAbsensi, saveAbsensi, resetAbsensi } from "./actions";

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

type KelasClientProps = {
  kelasList: Kelas[];
  mahasiswaList: Mahasiswa[];
};

const MOCK_PERTEMUAN = Array.from({ length: 12 }, (_, i) => `Pertemuan ${i + 1}`);

export default function KelasClient({ kelasList, mahasiswaList }: KelasClientProps) {
  const [activeKelas, setActiveKelas] = useState(kelasList[0]?.id || "");
  const [activePertemuan, setActivePertemuan] = useState(MOCK_PERTEMUAN[0]);
  
  // State for attendance
  const [absensi, setAbsensi] = useState<Record<string, { status: string, keterlambatan?: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
        const data = await getAbsensi(activeKelas, pertemuanNum);
        if (isMounted) setAbsensi(data);
      } catch (error) {
        if (isMounted) {
          console.error(error);
          showToast("Gagal memuat data presensi", "error");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [activeKelas, activePertemuan]);

  const handleStatusChange = (mhsId: string, status: string) => {
    setAbsensi(prev => ({
      ...prev,
      [mhsId]: { status, keterlambatan: status === 'TERLAMBAT' ? '<= 10' : undefined }
    }));
  };

  const handleKeterlambatanChange = (mhsId: string, keterlambatan: string) => {
    setAbsensi(prev => ({
      ...prev,
      [mhsId]: { ...prev[mhsId], keterlambatan }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pertemuanNum = parseInt(activePertemuan.replace("Pertemuan ", ""));
      
      const payload: Record<string, {status: string, keterlambatan?: string}> = {};
      filteredMahasiswa.forEach(mhs => {
        payload[mhs.id] = absensi[mhs.id] || { status: "ALPA" };
      });

      await saveAbsensi(pertemuanNum, payload);
      showToast("Data presensi telah disimpan", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan presensi", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    let isMounted = true;
    setIsResetting(true);
    try {
      const pertemuanNum = parseInt(activePertemuan.replace("Pertemuan ", ""));
      await resetAbsensi(activeKelas, pertemuanNum);
      
      if (isMounted) {
        showToast("Presensi berhasil direset", "success");
        setIsResetModalOpen(false);
      }
      
      const data = await getAbsensi(activeKelas, pertemuanNum);
      if (isMounted) setAbsensi(data);
    } catch (error) {
      if (isMounted) {
        console.error(error);
        showToast("Gagal mereset presensi", "error");
      }
    } finally {
      if (isMounted) setIsResetting(false);
    }
    
    // In actual implementation, we might not need this return in an event handler, 
    // but assigning it prevents memory leaks if the component unmounts mid-request.
  };

  const handleHadirkanSemua = () => {
    const newAbsensi = { ...absensi };
    filteredMahasiswa.forEach(mhs => {
      newAbsensi[mhs.id] = { status: "HADIR", keterlambatan: undefined };
    });
    setAbsensi(newAbsensi);
  };

  const filteredMahasiswa = mahasiswaList.filter(m => m.kelas_id === activeKelas);

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
        background: toast.type === "success" ? "var(--color-green)" : "var(--color-danger)",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        transform: toast.show ? "translateY(0)" : "translateY(-150%)",
        opacity: toast.show ? 1 : 0,
        transition: "all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        zIndex: 50,
        fontWeight: 600
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
        <h2 style={{ fontSize: "var(--text-h2)" }}>Daftar Presensi</h2>
        
        {/* Dropdown Pertemuan */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button 
            onClick={() => setIsResetModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "var(--color-danger)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 150ms"
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          
          <button 
            onClick={handleHadirkanSemua}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "var(--color-green)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 150ms"
            }}
          >
            <CheckCircle size={16} />
            Hadirkan Semua
          </button>

          <span style={{ fontSize: "var(--text-body-medium)", marginLeft: "var(--space-2)" }}>Pilih Pertemuan:</span>
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

      {/* Tabel Absensi */}
      <div style={{ position: "relative", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px", overflowX: "auto", overflowY: "auto", minHeight: "200px", maxHeight: "calc(100vh - 300px)" }}>
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <Loader2 style={{ animation: "spin 1s linear infinite", width: "32px", height: "32px", color: "var(--color-gold)" }} />
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
          <thead style={{ background: "var(--color-black)", color: "var(--color-surface)", position: "sticky", top: 0, zIndex: 5 }}>
            <tr>
              <th style={{ padding: "12px", fontWeight: 600, width: "60px" }}>No</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "150px" }}>NIM</th>
              <th style={{ padding: "12px", fontWeight: 600 }}>Nama Praktikan</th>
              <th style={{ padding: "12px", fontWeight: 600, width: "350px" }}>Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {filteredMahasiswa.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  Tidak ada mahasiswa di kelas ini.
                </td>
              </tr>
            ) : (
              filteredMahasiswa.map((mhs, idx) => {
                const record = absensi[mhs.id] || { status: "ALPA" };
                return (
                  <tr key={mhs.id} style={{ borderBottom: "1px solid var(--color-surface-sunken)" }}>
                    <td style={{ padding: "12px" }}>{idx + 1}</td>
                    <td className="tabular-nums" style={{ padding: "12px" }}>{mhs.nim}</td>
                    <td style={{ padding: "12px", fontWeight: 500 }}>{mhs.nama}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(mhs.id, e.target.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: `1px solid ${record.status === 'ALPA' ? 'var(--color-danger)' : record.status === 'HADIR' ? 'var(--color-green)' : 'var(--color-border)'}`,
                            outline: "none",
                            background: record.status === 'ALPA' ? 'var(--color-danger-light)' : record.status === 'HADIR' ? 'var(--color-green-light)' : 'var(--color-surface)',
                            cursor: "pointer"
                          }}
                        >
                          <option value="ALPA">ALPA</option>
                          <option value="HADIR">HADIR</option>
                          <option value="SAKIT">SAKIT</option>
                          <option value="IZIN">IZIN</option>
                          <option value="DISPEN">DISPEN</option>
                          <option value="TERLAMBAT">TERLAMBAT</option>
                        </select>

                        {record.status === "TERLAMBAT" && (
                          <select
                            value={record.keterlambatan || "<= 10"}
                            onChange={(e) => handleKeterlambatanChange(mhs.id, e.target.value)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "4px",
                              border: "1px solid var(--color-warning)",
                              background: "var(--color-warning-light)",
                              outline: "none",
                              cursor: "pointer"
                            }}
                          >
                            <option value="<= 10">&le; 10 menit (Skor 4)</option>
                            <option value="11-30">11-30 menit (Skor 3)</option>
                            <option value="31-60">31-60 menit (Skor 2)</option>
                            <option value="> 60">&gt; 60 menit (Skor 1)</option>
                          </select>
                        )}
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
          {isSaving ? "Menyimpan..." : "Simpan Presensi"}
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "var(--color-surface)",
            padding: "var(--space-6)",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-4)", color: "var(--color-text)" }}>
              Reset Presensi
            </h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin mereset presensi <strong>{activePertemuan}</strong> untuk kelas ini? Semua data kehadiran yang sudah disimpan akan dihapus.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)"
                }}
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                style={{
                  padding: "8px 16px",
                  background: "var(--color-danger)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isResetting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {isResetting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw size={16} />}
                {isResetting ? "Mereset..." : "Ya, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
