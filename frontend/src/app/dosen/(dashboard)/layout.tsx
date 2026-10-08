import { DashboardLayout, NavItem } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Users, ClipboardList } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const dosenNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dosen",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Rekap Kehadiran",
    href: "/dosen/kehadiran",
    icon: <Users size={20} />,
  },
  {
    label: "Rekap Nilai",
    href: "/dosen/nilai",
    icon: <ClipboardList size={20} />,
  }
];

export default async function DosenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.app_role !== "dosen") {
    redirect("/");
  }

  const dosenMap: Record<string, string> = {
    "YSN": "Yuli Sun Hariyani, S.T., M.T., Ph.D.",
    "DDS": "Dr. Duddy Soegiarto, S.T., M.T.",
    "FTS": "Fitri Susanti, S.T., M.T.",
    "AUP": "Prof. Agus Pratondo, S.T., M.T., Ph.D."
  };

  const displayName = dosenMap[session.nim] || session.nama;

  return (
    <DashboardLayout
      title="Dashboard Dosen"
      userRole="dosen"
      userName={displayName}
      userNim={session.nim}
      navItems={dosenNavItems}
    >
      {children}
    </DashboardLayout>
  );
}
