import { TugasClient } from "./TugasClient";
import { getTugasPraktikan } from "./actions";

export const metadata = {
  title: "Tugas Saya | Praktikan",
};

export default async function TugasPage() {
  const { pengaturan, pengumpulan } = await getTugasPraktikan();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-6)" }}>Tugas & Laporan Praktikum</h2>
      <TugasClient pengaturan={pengaturan} pengumpulan={pengumpulan} />
    </div>
  );
}
