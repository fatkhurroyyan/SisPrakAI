import { DashboardLayout, NavItem } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Users, BookOpen, ClipboardList } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const asprakNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/asprakai",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Kelas & Praktikan",
    href: "/asprakai/kelas",
    icon: <Users size={20} />,
  },
  {
    label: "Modul",
    href: "/asprakai/modul",
    icon: <BookOpen size={20} />,
  },
  {
    label: "Penilaian",
    href: "/asprakai/penilaian",
    icon: <ClipboardList size={20} />,
  },
];

export default async function AsprakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.app_role !== "asprak") {
    redirect("/");
  }

  return (
    <DashboardLayout
      title="Asisten Praktikum"
      userRole="asprak"
      userName={session.nama}
      userNim={session.nim}
      navItems={asprakNavItems}
    >
      {children}
    </DashboardLayout>
  );
}
