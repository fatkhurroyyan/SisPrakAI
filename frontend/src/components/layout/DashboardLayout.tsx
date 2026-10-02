"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Menu } from "lucide-react";
import styles from "./DashboardLayout.module.css";
import React, { useState } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  userRole: "asprak" | "praktikan" | "dosen";
  userName?: string;
  userNim?: string;
}

export function DashboardLayout({
  children,
  navItems,
  title,
  userRole,
  userName,
  userNim,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className={styles.container}>
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          {userRole === "asprak" || userRole === "dosen" ? (
            <div>
              <div style={{ fontSize: "var(--text-h3)" }}>SisPrakAI</div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--color-text-tertiary)", fontWeight: 400 }}>{userRole === "dosen" ? "Dosen Portal" : "Asprak Portal"}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "var(--text-h3)" }} className="tabular-nums">{userNim}</div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--color-text-tertiary)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </div>
            </div>
          )}
        </div>

        <nav className={styles.sidebarContent}>
          {navItems.map((item) => {
            const isBaseRoute = item.href === "/asprakai" || item.href === "/praktikan" || item.href === "/dosen";
            const isActive = isBaseRoute
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <button className={styles.mobileMenuBtn} onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>
          <div className={styles.topbarActions}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-secondary)" }}>
              <User size={20} />
              <span style={{ fontSize: "var(--text-body-medium)", fontWeight: 500 }}>
                {userRole === "asprak" ? "Asisten Praktikum" : userRole === "dosen" ? "Dosen" : "Praktikan"}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
