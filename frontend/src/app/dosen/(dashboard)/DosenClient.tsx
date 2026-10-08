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
        headers = ["No", "NIM", "Nama Praktikan", "Pelaksanaan (35%)", "Laporan (25%)", "Waktu Kumpul (25%)", "Kehadiran (15%)", "Total"];
        rows = filteredData.map((s, index) => {
          const mod = s.rekapPerModul[activeSubView];
          return [index + 1, s.nim, s.nama, mod?.nilaiPelaksanaan || 0, mod?.nilaiLaporan || 0, mod?.nilaiKetepatan || 0, mod?.skorAbsen || 0, mod?.totalNilaiModul || 0];
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
            <th onClick={() => handleSort("nim")}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")}>Nama {renderSortIcon("nama")}</th>
            <th onClick={() => handleSort("hadir")}>Hadir {renderSortIcon("hadir")}</th>
            <th onClick={() => handleSort("izin")}>Izin {renderSortIcon("izin")}</th>
            <th onClick={() => handleSort("sakit")}>Sakit {renderSortIcon("sakit")}</th>
            <th onClick={() => handleSort("alpa")}>Alpa {renderSortIcon("alpa")}</th>
            <th onClick={() => handleSort("persentaseKehadiran")}>Kehadiran (%) {renderSortIcon("persentaseKehadiran")}</th>
          </tr>
        );
      } else if (activeSubView === "KELAS") {
        return (
          <tr>
            <th>Statistik</th>
            <th>Nilai</th>
          </tr>
        );
      } else {
        return (
          <tr>
            <th onClick={() => handleSort("nim")}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")}>Nama {renderSortIcon("nama")}</th>
            <th onClick={() => handleSort("statusAbsen")}>Status Absen {renderSortIcon("statusAbsen")}</th>
            <th onClick={() => handleSort("menitKeterlambatan")}>Terlambat (menit) {renderSortIcon("menitKeterlambatan")}</th>
            <th onClick={() => handleSort("skorAbsen")}>Skor Absen {renderSortIcon("skorAbsen")}</th>
          </tr>
        );
      }
    } else {
      if (activeSubView === "SEMUA") {
        return (
          <tr>
            <th onClick={() => handleSort("nim")} style={{ position: "sticky", left: 0, zIndex: 11, minWidth: "100px" }}>NIM {renderSortIcon("nim")}</th>
            <th onClick={() => handleSort("nama")} style={{ position: "sticky", left: "100px", zIndex: 11, minWidth: "200px" }}>Nama {renderSortIcon("nama")}</th>
            {initialData.modulList.map((m, index) => (
              <th key={m.id} onClick={() => handleSort(`mod_${m.id}`)}>Modul {index + 1} {renderSortIcon(`mod_${m.id}`)}</th>
            ))}
            <th onClick={() => handleSort("nilaiAkhir")}>Total Nilai {renderSortIcon("nilaiAkhir")}</th>
          </tr>
        );
      } else {
        return (
            <tr>
              <th style={{ width: "50px" }}>No</th>
              <th onClick={() => handleSort("nim")} style={{ width: "130px", cursor: "pointer", userSelect: "none" }}>NIM {renderSortIcon("nim")}</th>
              <th onClick={() => handleSort("nama")} style={{ width: "300px", cursor: "pointer", userSelect: "none" }}>Nama Praktikan {renderSortIcon("nama")}</th>
              <th onClick={() => handleSort("nilaiPelaksanaan")} style={{ width: "150px", cursor: "pointer", userSelect: "none" }}>Pelaksanaan (35%) {renderSortIcon("nilaiPelaksanaan")}</th>
              <th onClick={() => handleSort("nilaiLaporan")} style={{ width: "150px", cursor: "pointer", userSelect: "none" }}>Laporan (25%) {renderSortIcon("nilaiLaporan")}</th>
              <th onClick={() => handleSort("nilaiKetepatan")} style={{ width: "150px", cursor: "pointer", userSelect: "none" }}>Waktu Kumpul (25%) {renderSortIcon("nilaiKetepatan")}</th>
              <th onClick={() => handleSort("skorAbsen")} style={{ width: "150px", cursor: "pointer", userSelect: "none" }}>Kehadiran (15%) {renderSortIcon("skorAbsen")}</th>
              <th onClick={() => handleSort("totalNilaiModul")} style={{ width: "150px", cursor: "pointer", userSelect: "none" }}>Total {renderSortIcon("totalNilaiModul")}</th>
            </tr>
        );
      }
    }
  };

  const renderTableBody = () => {
    if (type === "KEHADIRAN" && activeSubView === "KELAS") {
      return (
        <>
          <tr><td data-label="Statistik">Total Mahasiswa</td><td data-label="Nilai">{rekapKelasStats?.totalMhs || 0}</td></tr>
          <tr><td data-label="Statistik">Total Hadir / Terlambat</td><td data-label="Nilai" style={{color: "var(--color-green)", fontWeight: 600}}>{rekapKelasStats?.hadir || 0}</td></tr>
          <tr><td data-label="Statistik">Total Izin</td><td data-label="Nilai" style={{color: "var(--color-blue)", fontWeight: 600}}>{rekapKelasStats?.izin || 0}</td></tr>
          <tr><td data-label="Statistik">Total Sakit</td><td data-label="Nilai" style={{color: "var(--color-purple)", fontWeight: 600}}>{rekapKelasStats?.sakit || 0}</td></tr>
          <tr><td data-label="Statistik">Total Alpa</td><td data-label="Nilai" style={{color: "var(--color-danger)", fontWeight: 600}}>{rekapKelasStats?.alpa || 0}</td></tr>
          <tr><td data-label="Statistik">Rata-rata Kehadiran Kelas</td><td data-label="Nilai" style={{fontWeight: 700}}>{rekapKelasStats?.avgKehadiran || 0}%</td></tr>
        </>
      )
    }

    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={20} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
            Tidak ada data ditemukan
          </td>
        </tr>
      )
    }

    return filteredData.map((row, index) => (
      <tr key={row.nim}>
        {type === "KEHADIRAN" ? (
          activeSubView === "ORANG" ? (
            <>
              <td data-label="NIM" className="tabular-nums">{row.nim}</td>
              <td data-label="Nama" style={{ fontWeight: 600 }}>{row.nama}</td>
              <td data-label="Hadir" style={{ color: "var(--color-green)", fontWeight: 600 }}>{row.rekapKeseluruhan.hadir}</td>
              <td data-label="Izin" style={{ color: "var(--color-blue)", fontWeight: 600 }}>{row.rekapKeseluruhan.izin}</td>
              <td data-label="Sakit" style={{ color: "var(--color-purple)", fontWeight: 600 }}>{row.rekapKeseluruhan.sakit}</td>
              <td data-label="Alpa" style={{ color: "var(--color-danger)", fontWeight: 600 }}>{row.rekapKeseluruhan.alpa}</td>
              <td data-label="Kehadiran (%)" style={{ fontWeight: 700 }}>{row.rekapKeseluruhan.persentaseKehadiran}%</td>
            </>
          ) : (
            <>
              <td data-label="NIM" className="tabular-nums">{row.nim}</td>
              <td data-label="Nama" style={{ fontWeight: 600 }}>{row.nama}</td>
              <td data-label="Status Absen" style={{ fontWeight: 600 }}>
                {row.rekapPerModul[activeSubView]?.statusAbsen === "HADIR" ? <span style={{color:"var(--color-green)"}}>HADIR</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen === "TERLAMBAT" ? <span style={{color:"var(--color-gold)"}}>TERLAMBAT</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen === "ALPA" ? <span style={{color:"var(--color-danger)"}}>ALPA</span> :
                 row.rekapPerModul[activeSubView]?.statusAbsen || "-"}
              </td>
              <td data-label="Terlambat (menit)">{row.rekapPerModul[activeSubView]?.menitKeterlambatan || 0}</td>
              <td data-label="Skor Absen" style={{ fontWeight: 700 }}>{row.rekapPerModul[activeSubView]?.skorAbsen || 0}</td>
            </>
          )
        ) : (
          activeSubView === "SEMUA" ? (
            <>
              <td data-label="NIM" className="tabular-nums" style={{ position: "sticky", left: 0, background: "inherit", zIndex: 1, minWidth: "100px" }}>{row.nim}</td>
              <td data-label="Nama" style={{ fontWeight: 600, position: "sticky", left: "100px", background: "inherit", zIndex: 1, minWidth: "200px" }}>{row.nama}</td>
              {initialData.modulList.map((m, index) => (
                <td data-label={`Modul ${index + 1}`} key={m.id}>{row.rekapPerModul[m.id]?.totalNilaiModul || 0}</td>
              ))}
              <td data-label="Total Nilai" style={{ fontWeight: 800, color: "var(--color-green)" }}>{row.rekapKeseluruhan.nilaiAkhir}</td>
            </>
          ) : (
            <>
              <td data-label="No">{index + 1}</td>
              <td data-label="NIM" className="tabular-nums">{row.nim}</td>
              <td data-label="Nama" style={{ fontWeight: 600 }}>{row.nama}</td>
              <td data-label="Pelaksanaan">{row.rekapPerModul[activeSubView]?.nilaiPelaksanaan || 0}</td>
              <td data-label="Laporan">{row.rekapPerModul[activeSubView]?.nilaiLaporan || 0}</td>
              <td data-label="Waktu Kumpul">{row.rekapPerModul[activeSubView]?.nilaiKetepatan || 0}</td>
              <td data-label="Kehadiran">{row.rekapPerModul[activeSubView]?.skorAbsen || 0}</td>
              <td data-label="Total" style={{ fontWeight: 800, color: "var(--color-green)" }}>{row.rekapPerModul[activeSubView]?.totalNilaiModul || 0}</td>
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

      {/* Class Tabs - Fluid Island */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "var(--color-surface-sunken)", padding: "4px", borderRadius: "9999px", flexWrap: "wrap", gap: "4px" }}>
          {classes.map(cls => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              style={getFluidTabStyle(activeClass === cls)}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs based on Type - Fluid Island */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "var(--color-surface-sunken)", padding: "4px", borderRadius: "9999px", flexWrap: "wrap", gap: "4px" }}>
          {type === "KEHADIRAN" ? (
            <>
              <button onClick={() => setActiveSubView("ORANG")} style={getFluidTabStyle(activeSubView === "ORANG")}>Rekap Per Orang</button>
              <button onClick={() => setActiveSubView("KELAS")} style={getFluidTabStyle(activeSubView === "KELAS")}>Rekap Per Kelas</button>
              {initialData.modulList.map((m, index) => (
                <button key={m.id} onClick={() => setActiveSubView(m.id)} style={getFluidTabStyle(activeSubView === m.id)}>Modul {index + 1}</button>
              ))}
            </>
          ) : (
            <>
              <button onClick={() => setActiveSubView("SEMUA")} style={getFluidTabStyle(activeSubView === "SEMUA")}>Rekap Seluruh Modul</button>
              {initialData.modulList.map((m, index) => (
                <button key={m.id} onClick={() => setActiveSubView(m.id)} style={getFluidTabStyle(activeSubView === m.id)}>Modul {index + 1}</button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="premium-table-wrapper">
        <table className="premium-table">
          <thead>
            {renderTableHead()}
          </thead>
          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const getFluidTabStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "8px 20px",
  background: isActive ? "var(--color-surface)" : "transparent",
  color: isActive ? "var(--color-black)" : "var(--color-text-secondary)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
});
