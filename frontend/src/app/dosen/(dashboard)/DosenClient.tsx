"use client";

import { useState, useMemo } from "react";
import { Download, Search, ChevronUp, ChevronDown, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Modul = { id: string; judul: string; };

type Mahasiswa = {
  nim: string;
  nama: string;
  kelas: string;
  rekapKeseluruhan: {
    hadir: number; alpa: number; izin: number; sakit: number; persentaseKehadiran: number;
    nilaiAbsen: number; avgPelaksanaan: number; avgLaporan: number; avgKetepatan: number; nilaiAkhir: number;
  };
  rekapPerModul: {
    [modul_id: string]: {
      statusAbsen: string | null; menitKeterlambatan: number; skorAbsen: number;
      nilaiPelaksanaan: number; nilaiLaporan: number; nilaiKetepatan: number; totalNilaiModul: number;
    }
  };
};

type DosenData = {
  mahasiswaList: Mahasiswa[];
  modulList: Modul[];
};

export default function DosenClient({ initialData, type }: { initialData: DosenData, type: "KEHADIRAN" | "NILAI" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Sub Tabs (Classes)
  const classes = useMemo(() => {
    const unique = Array.from(new Set(initialData.mahasiswaList.map(d => d.kelas))).sort();
    return unique;
  }, [initialData]);
  
  const [activeClass, setActiveClass] = useState<string>(classes[0] || "");
  
  // View mode inside class tab
  // Kehadiran: "ORANG", "KELAS", or modul_id
  // Nilai: "SEMUA", or modul_id
  const defaultSubView = type === "KEHADIRAN" ? "ORANG" : "SEMUA";
  const [activeSubView, setActiveSubView] = useState<string>(defaultSubView);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortValue = (item: Mahasiswa, key: string) => {
    if (key === "nim") return item.nim;
    if (key === "nama") return item.nama;
    
    if (type === "KEHADIRAN") {
      if (activeSubView === "ORANG") {
        return (item.rekapKeseluruhan as any)[key] || 0;
      } else if (activeSubView !== "KELAS") { // Modul specific
        const modData = item.rekapPerModul[activeSubView];
        if (!modData) return 0;
        if (key === "statusAbsen") return modData.statusAbsen || "";
        if (key === "menitKeterlambatan") return modData.menitKeterlambatan;
        if (key === "skorAbsen") return modData.skorAbsen;
      }
    } else {
      if (activeSubView === "SEMUA") {
        if (key === "nilaiAkhir") return item.rekapKeseluruhan.nilaiAkhir;
        if (key.startsWith("mod_")) {
          const mId = key.replace("mod_", "");
          return item.rekapPerModul[mId]?.totalNilaiModul || 0;
        }
      } else {
        const modData = item.rekapPerModul[activeSubView];
        if (!modData) return 0;
        return (modData as any)[key] || 0;
      }
    }
    return 0;
  };

  const sortedData = [...initialData.mahasiswaList].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = getSortValue(a, key);
    const bVal = getSortValue(b, key);
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) => {
    const matchClass = item.kelas === activeClass;
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.nim.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  // Calculate Rekap Per Kelas Data
  const rekapKelasStats = useMemo(() => {
    if (type !== "KEHADIRAN" || activeSubView !== "KELAS") return null;
    const classMhs = initialData.mahasiswaList.filter(m => m.kelas === activeClass);
    if (!classMhs.length) return null;
    let tHadir = 0, tAlpa = 0, tIzin = 0, tSakit = 0, sumPersentase = 0;
    classMhs.forEach(m => {
      tHadir += m.rekapKeseluruhan.hadir;
      tAlpa += m.rekapKeseluruhan.alpa;
      tIzin += m.rekapKeseluruhan.izin;
      tSakit += m.rekapKeseluruhan.sakit;
      sumPersentase += m.rekapKeseluruhan.persentaseKehadiran;
    });
    return {
      totalMhs: classMhs.length,
      hadir: tHadir, alpa: tAlpa, izin: tIzin, sakit: tSakit,
      avgKehadiran: Math.round(sumPersentase / classMhs.length)
    };
  }, [initialData.mahasiswaList, activeClass, activeSubView, type]);


  // Export functions
  const getExportData = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (type === "KEHADIRAN") {
      if (activeSubView === "ORANG") {
        headers = ["NIM", "Nama", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran (%)"];
        rows = filteredData.map(s => [s.nim, s.nama, s.rekapKeseluruhan.hadir, s.rekapKeseluruhan.izin, s.rekapKeseluruhan.sakit, s.rekapKeseluruhan.alpa, `${s.rekapKeseluruhan.persentaseKehadiran}%`]);
      } else if (activeSubView === "KELAS") {
        headers = ["Statistik", "Nilai"];
        rows = [
          ["Total Mahasiswa", rekapKelasStats?.totalMhs || 0],
          ["Total Hadir/Terlambat", rekapKelasStats?.hadir || 0],
          ["Total Izin", rekapKelasStats?.izin || 0],
          ["Total Sakit", rekapKelasStats?.sakit || 0],
          ["Total Alpa", rekapKelasStats?.alpa || 0],
          ["Rata-rata Kehadiran Kelas", `${rekapKelasStats?.avgKehadiran || 0}%`]
        ];
      } else {
        const modulIndex = initialData.modulList.findIndex(m => m.id === activeSubView);
        const modulName = modulIndex !== -1 ? `Modul ${modulIndex + 1}` : "Modul";
        headers = ["NIM", "Nama", `Status Absen (${modulName})`, "Keterlambatan (menit)", "Skor Absen"];
        rows = filteredData.map(s => {
          const mod = s.rekapPerModul[activeSubView];
          return [s.nim, s.nama, mod?.statusAbsen || "-", mod?.menitKeterlambatan || 0, mod?.skorAbsen || 0];
        });
      }
    } else {
      if (activeSubView === "SEMUA") {
        headers = ["NIM", "Nama", ...initialData.modulList.map((m, i) => `Modul ${i + 1}`), "Nilai Akhir Total"];
        rows = filteredData.map(s => {
          const modScores = initialData.modulList.map(m => s.rekapPerModul[m.id]?.totalNilaiModul || 0);
          return [s.nim, s.nama, ...modScores, s.rekapKeseluruhan.nilaiAkhir];
        });
      } else {
        const modulIndex = initialData.modulList.findIndex(m => m.id === activeSubView);
        const modulName = modulIndex !== -1 ? `Modul ${modulIndex + 1}` : "Modul";
        headers = ["NIM", "Nama", `N. Absen (${modulName})`, "N. Pelaksanaan", "N. Laporan", "N. Ketepatan", "Nilai Akhir Modul"];
        rows = filteredData.map(s => {
          const mod = s.rekapPerModul[activeSubView];
          return [s.nim, s.nama, mod?.skorAbsen ? (mod.skorAbsen/5)*100 : 0, mod?.nilaiPelaksanaan || 0, mod?.nilaiLaporan || 0, mod?.nilaiKetepatan || 0, mod?.totalNilaiModul || 0];
        });
      }
    }
    return { headers, rows };
  };

  const getDownloadFilename = (ext: string) => {
    let sub = activeSubView;
    if (activeSubView === "ORANG") sub = "Per_Orang";
    else if (activeSubView === "KELAS") sub = "Per_Kelas";
    else if (activeSubView === "SEMUA") sub = "Seluruh_Modul";
    else {
      const modulIndex = initialData.modulList.findIndex(m => m.id === activeSubView);
      sub = modulIndex !== -1 ? `Modul_${modulIndex + 1}` : "Modul";
    }
    return `Rekap_${type}_${activeClass}_${sub}.${ext}`;
  };

  const exportCSV = () => {
    const { headers, rows } = getExportData();
    if (!rows.length) return;
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", getDownloadFilename("csv"));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const { headers, rows } = getExportData();
    if (!rows.length) return;
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap");
    XLSX.writeFile(workbook, getDownloadFilename("xlsx"));
  };

  const exportPDF = () => {
    const { headers, rows } = getExportData();
    if (!rows.length) return;
    const doc = new jsPDF();
    
    let sub = activeSubView;
    if (activeSubView === "ORANG") sub = "Per Orang";
    else if (activeSubView === "KELAS") sub = "Per Kelas";
    else if (activeSubView === "SEMUA") sub = "Seluruh Modul";
    else {
      const modulIndex = initialData.modulList.findIndex(m => m.id === activeSubView);
      sub = modulIndex !== -1 ? `Modul ${modulIndex + 1}` : "Modul";
    }

    doc.text(`Rekap ${type === "KEHADIRAN" ? "Kehadiran" : "Nilai"} - ${activeClass} (${sub})`, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
    });
    doc.save(getDownloadFilename("pdf"));
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    }
    return <ChevronDown size={14} style={{ opacity: 0.3 }} />;
  };

  const renderTableHead = () => {
    if (type === "KEHADIRAN") {
      if (activeSubView === "ORANG") {
        return (
          <tr>
            <th onClick={() => handleSort("nim")} style={thStyle}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")} style={thStyle}>Nama {renderSortIcon("nama")}</th>
            <th onClick={() => handleSort("hadir")} style={thStyle}>Hadir {renderSortIcon("hadir")}</th>
            <th onClick={() => handleSort("izin")} style={thStyle}>Izin {renderSortIcon("izin")}</th>
            <th onClick={() => handleSort("sakit")} style={thStyle}>Sakit {renderSortIcon("sakit")}</th>
            <th onClick={() => handleSort("alpa")} style={thStyle}>Alpa {renderSortIcon("alpa")}</th>
            <th onClick={() => handleSort("persentaseKehadiran")} style={thStyle}>Kehadiran (%) {renderSortIcon("persentaseKehadiran")}</th>
          </tr>
        );
      } else if (activeSubView === "KELAS") {
        return (
          <tr>
            <th style={thStyle}>Statistik</th>
            <th style={thStyle}>Nilai</th>
          </tr>
        );
      } else {
        return (
          <tr>
            <th onClick={() => handleSort("nim")} style={thStyle}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")} style={thStyle}>Nama {renderSortIcon("nama")}</th>
            <th onClick={() => handleSort("statusAbsen")} style={thStyle}>Status Absen {renderSortIcon("statusAbsen")}</th>
            <th onClick={() => handleSort("menitKeterlambatan")} style={thStyle}>Terlambat (menit) {renderSortIcon("menitKeterlambatan")}</th>
            <th onClick={() => handleSort("skorAbsen")} style={thStyle}>Skor Absen {renderSortIcon("skorAbsen")}</th>
          </tr>
        );
      }
    } else {
      if (activeSubView === "SEMUA") {
        return (
          <tr>
            <th onClick={() => handleSort("nim")} style={{ ...thStyle, position: "sticky", left: 0, zIndex: 11, minWidth: "100px" }}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")} style={{ ...thStyle, position: "sticky", left: "100px", zIndex: 11, minWidth: "200px", borderRight: "2px solid var(--color-border)" }}>Nama {renderSortIcon("nama")}</th>
            {initialData.modulList.map((m, index) => (
              <th key={m.id} onClick={() => handleSort(`mod_${m.id}`)} style={thStyle}>Modul {index + 1} {renderSortIcon(`mod_${m.id}`)}</th>
            ))}
            <th onClick={() => handleSort("nilaiAkhir")} style={thStyle}>Total Nilai {renderSortIcon("nilaiAkhir")}</th>
          </tr>
        );
      } else {
        return (
          <tr>
            <th onClick={() => handleSort("nim")} style={thStyle}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")} style={thStyle}>Nama {renderSortIcon("nama")}</th>
            <th onClick={() => handleSort("skorAbsen")} style={thStyle}>Nilai Absen {renderSortIcon("skorAbsen")}</th>
            <th onClick={() => handleSort("nilaiPelaksanaan")} style={thStyle}>Pelaksanaan {renderSortIcon("nilaiPelaksanaan")}</th>
            <th onClick={() => handleSort("nilaiLaporan")} style={thStyle}>Laporan {renderSortIcon("nilaiLaporan")}</th>
            <th onClick={() => handleSort("nilaiKetepatan")} style={thStyle}>Ketepatan {renderSortIcon("nilaiKetepatan")}</th>
            <th onClick={() => handleSort("totalNilaiModul")} style={thStyle}>Nilai Modul {renderSortIcon("totalNilaiModul")}</th>
          </tr>
        );
      }
    }
  };

  const renderTableBody = () => {
    if (type === "KEHADIRAN" && activeSubView === "KELAS") {
      return (
        <>
          <tr style={trStyle}><td style={tdStyle}>Total Mahasiswa</td><td style={tdStyle}>{rekapKelasStats?.totalMhs || 0}</td></tr>
          <tr style={trStyle}><td style={tdStyle}>Total Hadir / Terlambat</td><td style={{...tdStyle, color: "var(--color-green)"}}>{rekapKelasStats?.hadir || 0}</td></tr>
          <tr style={trStyle}><td style={tdStyle}>Total Izin</td><td style={{...tdStyle, color: "var(--color-blue)"}}>{rekapKelasStats?.izin || 0}</td></tr>
          <tr style={trStyle}><td style={tdStyle}>Total Sakit</td><td style={{...tdStyle, color: "var(--color-purple)"}}>{rekapKelasStats?.sakit || 0}</td></tr>
          <tr style={trStyle}><td style={tdStyle}>Total Alpa</td><td style={{...tdStyle, color: "var(--color-danger)"}}>{rekapKelasStats?.alpa || 0}</td></tr>
          <tr style={trStyle}><td style={tdStyle}>Rata-rata Kehadiran Kelas</td><td style={{...tdStyle, fontWeight: 700}}>{rekapKelasStats?.avgKehadiran || 0}%</td></tr>
        </>
      )
    }

    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={20} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Tidak ada data ditemukan
          </td>
        </tr>
      )
    }

    return filteredData.map(row => (
      <tr key={row.nim} style={trStyle} onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
        {type === "KEHADIRAN" ? (
          activeSubView === "ORANG" ? (
            <>
              <td style={tdStyle}>{row.nim}</td>
              <td style={tdStyle}>{row.nama}</td>
              <td style={{...tdStyle, color: "var(--color-green)"}}>{row.rekapKeseluruhan.hadir}</td>
              <td style={{...tdStyle, color: "var(--color-blue)"}}>{row.rekapKeseluruhan.izin}</td>
              <td style={{...tdStyle, color: "var(--color-purple)"}}>{row.rekapKeseluruhan.sakit}</td>
              <td style={{...tdStyle, color: "var(--color-danger)"}}>{row.rekapKeseluruhan.alpa}</td>
              <td style={{...tdStyle, fontWeight: 600}}>{row.rekapKeseluruhan.persentaseKehadiran}%</td>
            </>
          ) : (
            <>
              <td style={tdStyle}>{row.nim}</td>
              <td style={tdStyle}>{row.nama}</td>
              <td style={tdStyle}>
                {row.rekapPerModul[activeSubView]?.statusAbsen === "HADIR" ? <span style={{color:"var(--color-green)"}}>HADIR</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen === "TERLAMBAT" ? <span style={{color:"var(--color-gold)"}}>TERLAMBAT</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen === "ALPA" ? <span style={{color:"var(--color-danger)"}}>ALPA</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen || "-"}
              </td>
              <td style={tdStyle}>{row.rekapPerModul[activeSubView]?.menitKeterlambatan || 0}</td>
              <td style={{...tdStyle, fontWeight: 600}}>{row.rekapPerModul[activeSubView]?.skorAbsen || 0}</td>
            </>
          )
        ) : (
          activeSubView === "SEMUA" ? (
            <>
              <td style={{...tdStyle, position: "sticky", left: 0, background: "inherit", zIndex: 1, minWidth: "100px"}}>{row.nim}</td>
              <td style={{...tdStyle, position: "sticky", left: "100px", background: "inherit", zIndex: 1, minWidth: "200px", borderRight: "2px solid var(--color-border)"}}>{row.nama}</td>
              {initialData.modulList.map(m => (
                <td key={m.id} style={tdStyle}>{row.rekapPerModul[m.id]?.totalNilaiModul || 0}</td>
              ))}
              <td style={{...tdStyle, fontWeight: 700, color: "var(--color-green)"}}>{row.rekapKeseluruhan.nilaiAkhir}</td>
            </>
          ) : (
            <>
              <td style={tdStyle}>{row.nim}</td>
              <td style={tdStyle}>{row.nama}</td>
              <td style={tdStyle}>{row.rekapPerModul[activeSubView]?.skorAbsen ? (row.rekapPerModul[activeSubView].skorAbsen/5)*100 : 0}</td>
              <td style={tdStyle}>{row.rekapPerModul[activeSubView]?.nilaiPelaksanaan || 0}</td>
              <td style={tdStyle}>{row.rekapPerModul[activeSubView]?.nilaiLaporan || 0}</td>
              <td style={tdStyle}>{row.rekapPerModul[activeSubView]?.nilaiKetepatan || 0}</td>
              <td style={{...tdStyle, fontWeight: 700, color: "var(--color-green)"}}>{row.rekapPerModul[activeSubView]?.totalNilaiModul || 0}</td>
            </>
          )
        )}
      </tr>
    ));
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          {type === "KEHADIRAN" ? "Rekap Kehadiran" : "Rekap Nilai"}
        </h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {activeSubView !== "KELAS" && (
            <div style={{ position: "relative", width: "250px" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px 10px 40px",
                  borderRadius: "8px", border: "1px solid var(--color-border)",
                  background: "var(--color-surface)", color: "var(--color-text)",
                  outline: "none", fontSize: "14px"
                }}
              />
            </div>
          )}
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", background: "var(--color-surface-sunken)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            <FileJson size={18} /> CSV
          </button>
          <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", background: "var(--color-green)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      {/* Class Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
        {classes.map(cls => (
          <button
            key={cls}
            onClick={() => setActiveClass(cls)}
            style={{
              padding: "8px 16px",
              background: activeClass === cls ? "var(--color-gold)" : "var(--color-surface)",
              color: activeClass === cls ? "var(--color-black)" : "var(--color-text-secondary)",
              border: activeClass === cls ? "1px solid var(--color-gold)" : "1px solid var(--color-border)",
              borderRadius: "20px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Sub Tabs based on Type */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {type === "KEHADIRAN" ? (
          <>
            <button onClick={() => setActiveSubView("ORANG")} style={getSubTabStyle(activeSubView === "ORANG")}>Rekap Per Orang</button>
            <button onClick={() => setActiveSubView("KELAS")} style={getSubTabStyle(activeSubView === "KELAS")}>Rekap Per Kelas</button>
            {initialData.modulList.map((m, index) => (
              <button key={m.id} onClick={() => setActiveSubView(m.id)} style={getSubTabStyle(activeSubView === m.id)}>Modul {index + 1}</button>
            ))}
          </>
        ) : (
          <>
            <button onClick={() => setActiveSubView("SEMUA")} style={getSubTabStyle(activeSubView === "SEMUA")}>Rekap Seluruh Modul</button>
            {initialData.modulList.map((m, index) => (
              <button key={m.id} onClick={() => setActiveSubView(m.id)} style={getSubTabStyle(activeSubView === m.id)}>Modul {index + 1}</button>
            ))}
          </>
        )}
      </div>

      <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <div style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", width: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--color-surface-sunken)", zIndex: 20, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              {renderTableHead()}
            </thead>
            <tbody style={{ background: "var(--color-surface)" }}>
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: 700, 
  textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", 
  cursor: "pointer", borderBottom: "2px solid var(--color-border)",
  background: "var(--color-surface-sunken)"
};

const tdStyle: React.CSSProperties = {
  padding: "16px", fontSize: "14px", color: "var(--color-text)", borderBottom: "1px solid var(--color-border)"
};

const trStyle: React.CSSProperties = {
  transition: "background 0.2s"
};

const getSubTabStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "6px 14px",
  background: isActive ? "var(--color-primary)" : "var(--color-surface)",
  color: isActive ? "white" : "var(--color-text-secondary)",
  border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
  borderRadius: "16px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s"
});
