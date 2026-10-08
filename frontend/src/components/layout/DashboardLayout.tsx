"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import styles from "./DashboardLayout.module.css";
import React, { useState, useEffect } from "react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const roleText = userRole === "asprak" ? "Asisten Praktikum" : userRole === "dosen" ? "Dosen Portal" : "Praktikan";

  return (
    <div className={styles.container}>
      {/* FLUID ISLAND NAVIGATION */}
      <div className={styles.islandWrapper}>
        <nav className={styles.islandNav}>
          <div className={styles.brand}>
            <span className="tabular-nums">{userRole === "praktikan" ? userNim : "SisPrakAI"}</span>
            <span className={styles.brandSub}>{roleText}</span>
          </div>

          <div className={styles.navLinks}>
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
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className={styles.islandActions}>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* MOBILE FULLSCREEN OVERLAY */}
      <div className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOverlayOpen : ""}`}>
        <div className={styles.mobileNavLinks}>
          {navItems.map((item, index) => {
            const isBaseRoute = item.href === "/asprakai" || item.href === "/praktikan" || item.href === "/dosen";
            const isActive = isBaseRoute
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{title}</h1>
        </header>
        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
