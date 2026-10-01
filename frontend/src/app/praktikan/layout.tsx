import { DashboardLayout, NavItem } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, File, ClipboardList } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const praktikanNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/praktikan",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Tugas Saya",
    href: "/praktikan/tugas",
    icon: <File size={20} />,
  },
  {
    label: "Nilai Saya",
    href: "/praktikan/nilai",
    icon: <ClipboardList size={20} />,
  },
];

export default async function PraktikanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.app_role !== "praktikan") {
    redirect("/");
  }

  return (
    <DashboardLayout
      title="Dashboard Praktikan"
      userRole="praktikan"
      userName={session.nama}
      userNim={session.nim}
      navItems={praktikanNavItems}
    >
      {children}
    </DashboardLayout>
  );
}
