"use client";

import { useState } from "react";
import { saveTugasPengaturan, resetTugasPengaturan, getSubmissions } from "./actions";
import { Loader2, Save, RotateCcw, Eye, Download, XCircle, FileText, ArrowLeft } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ModulClientProps {
  kelasList: any[];
  allPengaturan: any[];
}

export function ModulClient({ kelasList, allPengaturan }: ModulClientProps) {
  const [activeClassId, setActiveClassId] = useState(kelasList[0]?.id || "");
  const [data, setData] = useState<any[]>(allPengaturan);
  const [loading, setLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const activeData = data.filter(d => d.kelas_id === activeClassId);

  const getRecord = (pertemuan: number) => {
    return activeData.find((d) => d.pertemuan === pertemuan) || { batas_hasil_praktikum: "", batas_tugas_rumah: "" };
  };

  const handleChange = (pertemuan: number, field: string, value: string) => {
    setData((prev) => {
      const exists = prev.find((d) => d.pertemuan === pertemuan && d.kelas_id === activeClassId);
      if (exists) {
        return prev.map((d) => (d.pertemuan === pertemuan && d.kelas_id === activeClassId) ? { ...d, [field]: value || null } : d);
      }
      return [...prev, { kelas_id: activeClassId, pertemuan, [field]: value || null }];
    });
  };

  const handleSave = async (pertemuan: number) => {
    try {
      setLoading(pertemuan);
      const record = getRecord(pertemuan);
      await saveTugasPengaturan(
        activeClassId, 
        pertemuan, 
        record.batas_hasil_praktikum || null, 
        record.batas_tugas_rumah || null
      );
      setToast({ message: `Tenggat Waktu Pertemuan ${pertemuan} berhasil disimpan`, type: "success" });
      
      // Update local state to reflect it's now saved in DB
      if (!allPengaturan.find(p => p.kelas_id === activeClassId && p.pertemuan === pertemuan)) {
        allPengaturan.push({ ...record, kelas_id: activeClassId, pertemuan });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(null);
    }
  };

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPertemuan, setResetPertemuan] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!resetPertemuan) return;
    setIsResetting(true);
    try {
      await resetTugasPengaturan(activeClassId, resetPertemuan);
      setData(prev => prev.filter(d => !(d.kelas_id === activeClassId && d.pertemuan === resetPertemuan)));
      
      // Remove from allPengaturan reference so UI updates
      const idx = allPengaturan.findIndex(p => p.kelas_id === activeClassId && p.pertemuan === resetPertemuan);
      if (idx > -1) allPengaturan.splice(idx, 1);

      setToast({ message: `Tenggat Pertemuan ${resetPertemuan} berhasil di-reset`, type: "success" });
      setResetModalOpen(false);
      setResetPertemuan(null);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsResetting(false);
    }
  };

  const [activeSubsPertemuan, setActiveSubsPertemuan] = useState<number | null>(null);
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [subsPengaturan, setSubsPengaturan] = useState<any>(null);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState<{ hp: boolean, tr: boolean }>({ hp: false, tr: false });

  const openSubmissions = async (pertemuan: number) => {
    setActiveSubsPertemuan(pertemuan);
    setIsSubsLoading(true);
    try {
      const res = await getSubmissions(activeClassId, pertemuan);
      setSubmissionsData(res.submissions);
      setSubsPengaturan(res.pengaturan);
    } catch (error: any) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsSubsLoading(false);
    }
  };

  const getLatenessStatus = (submittedAt: string | undefined | null, deadline: string | null) => {
    if (!submittedAt) return "Tidak mengumpulkan"; // Skor 0
    if (!deadline) return "Tepat waktu atau lebih awal"; // Fallback if no deadline

    const s = new Date(submittedAt).getTime();
    const d = new Date(deadline).getTime();

    if (s <= d) return "Tepat waktu atau lebih awal"; // Skor 5
    
    const diffHours = (s - d) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays <= 1) return "Terlambat ≤ 1 hari"; // Skor 4
    if (diffDays <= 3) return "Terlambat 2–3 hari"; // Skor 3
    if (diffDays <= 7) return "Terlambat 4–7 hari"; // Skor 2
    return "Terlambat > 7 hari"; // Skor 1
  };

  const formatTimestamp = (dateString: string | undefined | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const dayName = days[d.getDay()];
    const date = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${date} ${monthName} ${year} ${hours}:${minutes}`;
  };

  const exportCSV = () => {
    if (!submissionsData.length) return;
    const headers = ["NIM", "Nama", "Hasil Praktikum", "Tugas Rumah"];
    const rows = submissionsData.map(s => [
      s.mahasiswa.nim,
      s.mahasiswa.nama,
      getLatenessStatus(s.hasil_praktikum?.created_at, subsPengaturan?.batas_hasil_praktikum),
      getLatenessStatus(s.tugas_rumah?.created_at, subsPengaturan?.batas_tugas_rumah)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Pengumpulan_Modul_${activeSubsPertemuan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadZip = async (jenis: "HASIL_PRAKTIKUM" | "TUGAS_RUMAH") => {
    if (!submissionsData.length) return;
    const key = jenis === "HASIL_PRAKTIKUM" ? "hp" : "tr";
    setIsZipping(prev => ({ ...prev, [key]: true }));

    try {
      const zip = new JSZip();
      let hasFiles = false;

      for (const s of submissionsData) {
        const fileObj = jenis === "HASIL_PRAKTIKUM" ? s.hasil_praktikum : s.tugas_rumah;
        if (fileObj && fileObj.file_url) {
          try {
            // Using a simple fetch for public URL or handled via api
            const res = await fetch(fileObj.file_url);
            if (!res.ok) continue;
            const blob = await res.blob();
            // Naming format: NIM_NAMA_JENIS.ipynb
            const fileName = `${s.mahasiswa.nim}_${s.mahasiswa.nama}_${jenis}.ipynb`;
            zip.file(fileName, blob);
            hasFiles = true;
          } catch (e) {
            console.error("Failed to fetch file for", s.mahasiswa.nim, e);
          }
        }
      }

      if (hasFiles) {
        const content = await zip.generateAsync({ type: "blob" });
        const className = kelasList.find(k => k.id === activeClassId)?.nama || "Kelas";
        saveAs(content, `${className}_Modul_${activeSubsPertemuan}_${jenis}.zip`);
      } else {
        setToast({ message: "Tidak ada file yang bisa diunduh", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "Gagal membuat ZIP", type: "error" });
    } finally {
      setIsZipping(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!activeClassId) {
    return <div style={{ padding: "var(--space-6)" }}>Belum ada data kelas.</div>;
  }

  // Helper to convert ISO UTC string to local datetime-local format (YYYY-MM-DDThh:mm)
  const toLocalDatetimeString = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sub-tab Kelas */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "var(--space-4)", overflowX: "auto", padding: "0 var(--space-6)" }}>
        {kelasList.map(k => (
          <button
            key={k.id}
            onClick={() => setActiveClassId(k.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              background: activeClassId === k.id ? "var(--color-gold)" : "var(--color-surface)",
              color: activeClassId === k.id ? "black" : "var(--color-text)",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeSubsPertemuan ? (
        // Submissions View
        <div style={{ background: "var(--color-surface)", padding: "0 var(--space-6)", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 200px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                onClick={() => setActiveSubsPertemuan(null)} 
                style={{ background: "transparent", border: "1px solid var(--color-border)", padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <ArrowLeft size={18} />
              </button>
              <h3 style={{ fontSize: "var(--text-h3)", margin: 0 }}>
                Pengumpulan Tugas Modul {activeSubsPertemuan} 
                <span style={{ fontSize: "16px", color: "var(--color-text-secondary)", marginLeft: "8px" }}>
                  ({kelasList.find(k => k.id === activeClassId)?.nama})
                </span>
              </h3>
            </div>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => downloadZip("HASIL_PRAKTIKUM")} disabled={isZipping.hp} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-green)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
                {isZipping.hp ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ZIP Hasil Praktikum
              </button>
              <button onClick={() => downloadZip("TUGAS_RUMAH")} disabled={isZipping.tr} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-green)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
                {isZipping.tr ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ZIP Tugas Rumah
              </button>
              <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "var(--color-surface-sunken)", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>
                <Download size={16} /> Rekap CSV
              </button>
            </div>
          </div>

          {isSubsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={40} className="spin" color="var(--color-gold)" />
            </div>
          ) : (
            <div className="premium-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ padding: "16px 24px" }}>NIM</th>
                    <th style={{ padding: "16px 24px" }}>Nama Praktikan</th>
                    <th style={{ padding: "16px 24px" }}>Hasil Praktikum</th>
                    <th style={{ padding: "16px 24px" }}>Tugas Rumah</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsData.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>Belum ada data mahasiswa di kelas ini.</td></tr>
                  ) : (
                    submissionsData.map((s, idx) => {
                      const statusHP = getLatenessStatus(s.hasil_praktikum?.created_at, subsPengaturan?.batas_hasil_praktikum);
                      const statusTR = getLatenessStatus(s.tugas_rumah?.created_at, subsPengaturan?.batas_tugas_rumah);
                      return (
                        <tr key={idx}>
                          <td data-label="NIM" style={{ padding: "16px 24px" }} className="tabular-nums">{s.mahasiswa.nim}</td>
                          <td data-label="Nama Praktikan" style={{ padding: "16px 24px", fontWeight: 600 }}>{s.mahasiswa.nama}</td>
                          
                          <td data-label="Hasil Praktikum" style={{ padding: "16px 24px" }}>
                            {!s.hasil_praktikum ? (
                              <div style={{ fontSize: "12px", color: "var(--color-danger)", fontWeight: 600 }}>Tidak mengumpulkan</div>
                            ) : (
                              <div>
                                <a href={s.hasil_praktikum.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-blue)", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                                  <FileText size={16} /> Lihat File
                                </a>
                                <div style={{ fontSize: "12px", marginTop: "6px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                                  {formatTimestamp(s.hasil_praktikum.created_at)}
                                </div>
                                <div style={{ fontSize: "12px", marginTop: "4px", color: statusHP.includes("Terlambat") ? "var(--color-danger)" : "var(--color-green)", fontWeight: 600 }}>
                                  {statusHP}
                                </div>
                              </div>
                            )}
                          </td>

                          <td data-label="Tugas Rumah" style={{ padding: "16px 24px" }}>
                            {!s.tugas_rumah ? (
                              <div style={{ fontSize: "12px", color: "var(--color-danger)", fontWeight: 600 }}>Tidak mengumpulkan</div>
                            ) : (
                              <div>
                                <a href={s.tugas_rumah.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-blue)", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                                  <FileText size={16} /> Lihat File
                                </a>
                                <div style={{ fontSize: "12px", marginTop: "6px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                                  {formatTimestamp(s.tugas_rumah.created_at)}
                                </div>
                                <div style={{ fontSize: "12px", marginTop: "4px", color: statusTR.includes("Terlambat") ? "var(--color-danger)" : "var(--color-green)", fontWeight: 600 }}>
                                  {statusTR}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Modul List View
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ padding: "16px 24px", width: "100px" }}>Pertemuan</th>
                <th style={{ padding: "16px 24px" }}>Tenggat Hasil Praktikum</th>
                <th style={{ padding: "16px 24px" }}>Tenggat Tugas Rumah</th>
                <th style={{ padding: "16px 24px", width: "250px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((pertemuan) => {
                const record = getRecord(pertemuan);
                const isConfigured = allPengaturan.some(p => p.kelas_id === activeClassId && p.pertemuan === pertemuan);
                return (
                  <tr key={pertemuan} className={isConfigured ? "configured-row" : ""}>
                    <td data-label="Pertemuan" style={{ padding: "16px 24px", fontWeight: 600 }}>
                      Modul {pertemuan}
                      {isConfigured && <div style={{ fontSize: "12px", color: "var(--color-green)", marginTop: "6px" }}>• Ditugaskan</div>}
                    </td>
                    <td data-label="Tenggat Hasil Praktikum" style={{ padding: "16px 24px" }}>
                      <input 
                        type="datetime-local" 
                        value={toLocalDatetimeString(record.batas_hasil_praktikum)}
                        onChange={(e) => handleChange(pertemuan, "batas_hasil_praktikum", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", width: "100%", outline: "none", transition: "border-color 0.2s" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                      />
                    </td>
                    <td data-label="Tenggat Tugas Rumah" style={{ padding: "16px 24px" }}>
                      <input 
                        type="datetime-local" 
                        value={toLocalDatetimeString(record.batas_tugas_rumah)}
                        onChange={(e) => handleChange(pertemuan, "batas_tugas_rumah", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", width: "100%", outline: "none", transition: "border-color 0.2s" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--color-gold)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                      />
                    </td>
                    <td data-label="Aksi" style={{ padding: "16px 24px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handleSave(pertemuan)}
                          disabled={loading === pertemuan}
                          style={{ 
                            padding: "10px 16px", 
                            background: "var(--color-gold)", 
                            color: "black", 
                            border: "none", 
                            borderRadius: "8px", 
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: 600,
                            opacity: loading === pertemuan ? 0.7 : 1,
                            fontSize: "14px"
                          }}
                        >
                          {loading === pertemuan ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                          Simpan
                        </button>

                        {isConfigured && (
                          <>
                            <button 
                              onClick={() => {
                                setResetPertemuan(pertemuan);
                                setResetModalOpen(true);
                              }}
                              style={{ 
                                padding: "10px 16px", 
                                background: "var(--color-danger-light)", 
                                color: "var(--color-danger)", 
                                border: "none", 
                                borderRadius: "8px", 
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 600,
                                fontSize: "14px"
                              }}
                            >
                              <RotateCcw size={16} />
                              Reset
                            </button>
                            
                            <button 
                              onClick={() => openSubmissions(pertemuan)}
                              style={{ 
                                padding: "10px 16px", 
                                background: "var(--color-surface)", 
                                color: "var(--color-text)", 
                                border: "1px solid var(--color-border)", 
                                borderRadius: "8px", 
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 600,
                                fontSize: "14px"
                              }}
                            >
                              <Eye size={16} />
                              Lihat
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset Modal */}
      {resetModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--color-surface)", padding: "var(--space-6)",
            borderRadius: "12px", width: "100%", maxWidth: "400px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-4)" }}>Reset Tenggat</h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus pengaturan tenggat waktu untuk <strong>Modul {resetPertemuan}</strong>? Data yang direset tidak bisa dikembalikan.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button onClick={() => setResetModalOpen(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Batal</button>
              <button onClick={handleReset} disabled={isResetting} style={{ padding: "8px 16px", background: "var(--color-danger)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, color: "white", display: "flex", alignItems: "center", gap: "6px" }}>
                {isResetting ? <Loader2 size={16} className="spin" /> : <RotateCcw size={16} />}
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
