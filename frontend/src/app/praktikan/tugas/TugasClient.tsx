"use client";

import { useState } from "react";
import { submitTugas, deleteTugas, getFileUrl } from "./actions";
import { Loader2, Upload, Link as LinkIcon, Trash2, File, CheckCircle2, Edit2, X } from "lucide-react";
import { Toast } from "@/components/ui/Toast";

interface TugasClientProps {
  pengaturan: any[];
  pengumpulan: any[];
}

export function TugasClient({ pengaturan, pengumpulan }: TugasClientProps) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [loading, setLoading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Form states for current tab
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ pertemuan: number, jenis: "HASIL_PRAKTIKUM" | "TUGAS_RUMAH", file_url: string, tipe: "FILE" | "LINK" } | null>(null);

  const handleFileChange = (jenis: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileMap(prev => ({ ...prev, [jenis]: e.target.files![0] }));
    }
  };

  const enableEdit = (jenis: string) => {
    setEditMode(prev => ({ ...prev, [jenis]: true }));
  };

  const cancelEdit = (jenis: string) => {
    setEditMode(prev => ({ ...prev, [jenis]: false }));
    setFileMap(prev => ({ ...prev, [jenis]: null }));
  };

  const handleSubmit = async (pertemuan: number, jenis: "HASIL_PRAKTIKUM" | "TUGAS_RUMAH") => {
    try {
      setLoading(jenis);
      const formData = new FormData();
      formData.append("pertemuan", pertemuan.toString());
      formData.append("jenis", jenis);
      formData.append("tipe", "FILE");

      const file = fileMap[jenis];
      if (!file) throw new Error("Silakan pilih file .ipynb terlebih dahulu");
      formData.append("file", file);

      await submitTugas(formData);
      setToast({ message: "Tugas berhasil dikumpulkan!", type: "success" });
      
      // Reset local state
      setFileMap(prev => ({ ...prev, [jenis]: null }));
      setEditMode(prev => ({ ...prev, [jenis]: false }));
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { pertemuan, jenis, file_url, tipe } = deleteConfirm;
    
    try {
      setLoading(jenis + "_delete");
      await deleteTugas(pertemuan, jenis, file_url, tipe);
      setToast({ message: "Pengumpulan berhasil dihapus", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(null);
      setDeleteConfirm(null);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      setDownloading(path);
      const url = await getFileUrl(path);
      if (url) {
        window.open(url, '_blank');
      } else {
        setToast({ message: "Gagal membuka file", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Terjadi kesalahan", type: "error" });
    } finally {
      setDownloading(null);
    }
  };

  const currentPengaturan = pengaturan.find(p => p.pertemuan === activeTab);
  const now = new Date();

  const renderSection = (jenis: "HASIL_PRAKTIKUM" | "TUGAS_RUMAH", title: string, batasWaktu?: string) => {
    const isPastDeadline = batasWaktu ? new Date(batasWaktu) < now : false;
    const submission = pengumpulan.find(p => p.pertemuan === activeTab && p.jenis === jenis);
    const isEditing = editMode[jenis];

    return (
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>{title}</h3>
            <div style={{ fontSize: "13px", color: isPastDeadline ? "var(--color-error)" : "var(--color-text-secondary)", fontWeight: 500 }}>
              Tenggat: {batasWaktu ? new Date(batasWaktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : "Belum diatur"}
            </div>
          </div>
          {submission && !isEditing && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-success)", fontSize: "13px", fontWeight: 600, background: "var(--color-success-light)", padding: "4px 12px", borderRadius: "20px" }}>
              <CheckCircle2 size={16} /> Diserahkan
            </div>
          )}
        </div>

        {submission && !isEditing ? (
          <div style={{ padding: "20px", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <File size={20} color="var(--color-text-secondary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>
                    {submission.file_url.split('/').pop()}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                    Diserahkan pada {new Date(submission.updated_at).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => handleDownload(submission.file_url, submission.file_url.split('/').pop() || 'file')}
                  disabled={downloading === submission.file_url}
                  style={{ padding: "6px 12px", background: "var(--color-black)", color: "white", border: "1px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                >
                  {downloading === submission.file_url ? <Loader2 size={14} className="spin" /> : "Unduh File"}
                </button>
                {!isPastDeadline && (
                  <>
                    <button 
                      onClick={() => enableEdit(jenis)}
                      style={{ padding: "6px 12px", background: "transparent", color: "var(--color-green)", border: "1px solid var(--color-green)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ pertemuan: activeTab, jenis, file_url: submission.file_url, tipe: submission.tipe })}
                      disabled={loading === jenis + "_delete"}
                      style={{ padding: "6px 12px", background: "transparent", color: "var(--color-danger)", border: "1px solid var(--color-danger)", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
                    >
                      {loading === jenis + "_delete" ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} Hapus
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {isPastDeadline ? (
              <div style={{ padding: "16px", background: "var(--color-danger-light)", border: "1px dashed var(--color-danger)", borderRadius: "6px", color: "var(--color-danger)", textAlign: "center", fontSize: "14px" }}>
                Tenggat waktu telah berlalu. Anda tidak dapat mengumpulkan tugas.
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ padding: "6px 12px", borderRadius: "20px", background: "var(--color-gold)", color: "black", fontSize: "13px", fontWeight: 500 }}>
                      Upload File (.ipynb)
                    </div>
                  </div>
                  {isEditing && (
                    <button onClick={() => cancelEdit(jenis)} style={{ padding: "6px 12px", background: "transparent", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <X size={14} /> Batal Edit
                    </button>
                  )}
                </div>

                <div style={{ border: "1px dashed var(--color-border)", padding: "24px", borderRadius: "6px", textAlign: "center", background: "var(--color-surface-elevated)" }}>
                  <input 
                    type="file" 
                    accept=".ipynb" 
                    id={`file-${jenis}`} 
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(jenis, e)}
                  />
                  <label htmlFor={`file-${jenis}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <Upload size={32} color={fileMap[jenis] ? "var(--color-green)" : "var(--color-text-tertiary)"} />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: fileMap[jenis] ? "var(--color-green)" : "var(--color-text-primary)" }}>
                      {fileMap[jenis] ? fileMap[jenis]!.name : "Pilih file .ipynb"}
                    </span>
                  </label>
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => handleSubmit(activeTab, jenis)}
                    disabled={loading === jenis || !fileMap[jenis]}
                    style={{ padding: "8px 24px", background: "var(--color-green)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", opacity: (loading === jenis || !fileMap[jenis]) ? 0.6 : 1 }}
                  >
                    {loading === jenis ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                    {isEditing ? "Perbarui Pengumpulan" : "Kumpulkan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--color-surface-elevated)", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "var(--color-danger)" }}>
              <Trash2 size={24} />
              <h3 style={{ margin: 0, fontSize: "18px" }}>Konfirmasi Hapus</h3>
            </div>
            <p style={{ marginBottom: "24px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
              Apakah Anda yakin ingin menghapus pengumpulan untuk <strong>{deleteConfirm.jenis.replace("_", " ")}</strong>? Data yang sudah dihapus harus diunggah ulang sebelum tenggat waktu.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={loading === deleteConfirm.jenis + "_delete"}
                style={{ padding: "8px 16px", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}
              >
                {loading === deleteConfirm.jenis + "_delete" ? <Loader2 size={16} className="spin" /> : null}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pertemuan Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)" }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((pertemuan) => (
          <button
            key={pertemuan}
            onClick={() => setActiveTab(pertemuan)}
            style={{
              padding: "8px 16px",
              whiteSpace: "nowrap",
              border: "none",
              background: activeTab === pertemuan ? "var(--color-gold)" : "var(--color-surface-elevated)",
              color: activeTab === pertemuan ? "black" : "var(--color-text-secondary)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Modul {pertemuan}
          </button>
        ))}
      </div>

      <div>
        {renderSection("HASIL_PRAKTIKUM", "Hasil Praktikum", currentPengaturan?.batas_hasil_praktikum)}
        {renderSection("TUGAS_RUMAH", "Tugas Rumah", currentPengaturan?.batas_tugas_rumah)}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
