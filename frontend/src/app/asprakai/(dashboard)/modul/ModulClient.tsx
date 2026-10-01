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

  const getLateness = (submittedAt: string, deadline: string | null) => {
    if (!deadline) return null;
    const s = new Date(submittedAt).getTime();
    const d = new Date(deadline).getTime();
    if (s <= d) return null; // not late
    const diffHours = (s - d) / (1000 * 60 * 60);
    if (diffHours < 24) return `${Math.floor(diffHours)} jam`;
    return `${Math.floor(diffHours / 24)} hari ${Math.floor(diffHours % 24)} jam`;
  };

  const exportCSV = () => {
    if (!submissionsData.length) return;
    const headers = ["NIM", "Nama", "Hasil Praktikum", "Status HP", "Tugas Rumah", "Status TR"];
    const rows = submissionsData.map(s => [
      s.mahasiswa.nim,
      s.mahasiswa.nama,
      s.hasil_praktikum?.file_url || "Belum Kumpul",
      getLateness(s.hasil_praktikum?.created_at, subsPengaturan?.batas_hasil_praktikum) ? "Terlambat" : "Tepat Waktu",
      s.tugas_rumah?.file_url || "Belum Kumpul",
      getLateness(s.tugas_rumah?.created_at, subsPengaturan?.batas_tugas_rumah) ? "Terlambat" : "Tepat Waktu"
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
              <button onClick={() => downloadZip("HASIL_PRAKTIKUM")} disabled={isZipping.hp} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-blue)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
                {isZipping.hp ? <Loader2 size={18} className="spin" /> : <Download size={18} />} ZIP Hasil Praktikum
              </button>
              <button onClick={() => downloadZip("TUGAS_RUMAH")} disabled={isZipping.tr} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "var(--color-purple)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
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
            <div style={{ overflowY: "auto", flex: 1, border: "1px solid var(--color-border)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "var(--color-black)", color: "var(--color-surface)", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ padding: "12px" }}>NIM</th>
                    <th style={{ padding: "12px" }}>Nama Praktikan</th>
                    <th style={{ padding: "12px" }}>Hasil Praktikum</th>
                    <th style={{ padding: "12px" }}>Tugas Rumah</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsData.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>Belum ada data mahasiswa di kelas ini.</td></tr>
                  ) : (
                    submissionsData.map((s, idx) => {
                      const lateHP = getLateness(s.hasil_praktikum?.created_at, subsPengaturan?.batas_hasil_praktikum);
                      const lateTR = getLateness(s.tugas_rumah?.created_at, subsPengaturan?.batas_tugas_rumah);
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--color-surface-sunken)" }}>
                          <td style={{ padding: "12px" }} className="tabular-nums">{s.mahasiswa.nim}</td>
                          <td style={{ padding: "12px", fontWeight: 500 }}>{s.mahasiswa.nama}</td>
                          
                          <td style={{ padding: "12px" }}>
                            {!s.hasil_praktikum ? <span style={{ color: "var(--color-text-secondary)" }}>Belum Kumpul</span> : (
                              <div>
                                <a href={s.hasil_praktikum.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-blue)", textDecoration: "none", fontWeight: 500 }}>
                                  <FileText size={14} /> Lihat File
                                </a>
                                <div style={{ fontSize: "11px", marginTop: "4px", color: lateHP ? "var(--color-danger)" : "var(--color-green)", fontWeight: 500 }}>
                                  {lateHP ? `Terlambat (${lateHP})` : "Tepat Waktu"}
                                </div>
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "12px" }}>
                            {!s.tugas_rumah ? <span style={{ color: "var(--color-text-secondary)" }}>Belum Kumpul</span> : (
                              <div>
                                <a href={s.tugas_rumah.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-blue)", textDecoration: "none", fontWeight: 500 }}>
                                  <FileText size={14} /> Lihat File
                                </a>
                                <div style={{ fontSize: "11px", marginTop: "4px", color: lateTR ? "var(--color-danger)" : "var(--color-green)", fontWeight: 500 }}>
                                  {lateTR ? `Terlambat (${lateTR})` : "Tepat Waktu"}
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
        <div style={{ position: "relative", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", overflowX: "auto", overflowY: "auto", minHeight: "200px", maxHeight: "calc(100vh - 250px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
            <thead style={{ background: "var(--color-black)", color: "var(--color-surface)", position: "sticky", top: 0, zIndex: 5 }}>
              <tr>
                <th style={{ padding: "12px", fontWeight: 600, width: "100px" }}>Pertemuan</th>
                <th style={{ padding: "12px", fontWeight: 600 }}>Tenggat Hasil Praktikum</th>
                <th style={{ padding: "12px", fontWeight: 600 }}>Tenggat Tugas Rumah</th>
                <th style={{ padding: "12px", fontWeight: 600, width: "250px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((pertemuan) => {
                const record = getRecord(pertemuan);
                const isConfigured = allPengaturan.some(p => p.kelas_id === activeClassId && p.pertemuan === pertemuan);
                
                return (
                  <tr key={pertemuan} style={{ 
                    borderBottom: "1px solid var(--color-surface-sunken)",
                    background: isConfigured ? "rgba(224, 185, 118, 0.05)" : "transparent"
                  }}>
                    <td style={{ padding: "12px", fontWeight: 500 }}>
                      Modul {pertemuan}
                      {isConfigured && <div style={{ fontSize: "11px", color: "var(--color-green)", marginTop: "4px" }}>• Ditugaskan</div>}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input 
                        type="datetime-local" 
                        value={record.batas_hasil_praktikum ? record.batas_hasil_praktikum.slice(0, 16) : ""}
                        onChange={(e) => handleChange(pertemuan, "batas_hasil_praktikum", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-surface)", width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input 
                        type="datetime-local" 
                        value={record.batas_tugas_rumah ? record.batas_tugas_rumah.slice(0, 16) : ""}
                        onChange={(e) => handleChange(pertemuan, "batas_tugas_rumah", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--color-border)", background: "var(--color-surface)", width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handleSave(pertemuan)}
                          disabled={loading === pertemuan}
                          style={{ 
                            padding: "8px 12px", 
                            background: "var(--color-gold)", 
                            color: "black", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: 600,
                            opacity: loading === pertemuan ? 0.7 : 1,
                            fontSize: "13px"
                          }}
                        >
                          {loading === pertemuan ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
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
                                padding: "8px 12px", 
                                background: "var(--color-danger-light)", 
                                color: "var(--color-danger)", 
                                border: "1px solid var(--color-danger)", 
                                borderRadius: "4px", 
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: 600,
                                fontSize: "13px"
                              }}
                            >
                              <RotateCcw size={14} />
                              Reset
                            </button>
                            
                            <button 
                              onClick={() => openSubmissions(pertemuan)}
                              style={{ 
                                padding: "8px 12px", 
                                background: "var(--color-surface)", 
                                color: "var(--color-text)", 
                                border: "1px solid var(--color-border)", 
                                borderRadius: "4px", 
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: 600,
                                fontSize: "13px"
                              }}
                            >
                              <Eye size={14} />
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
