"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "../ui/LogoMark";

export default function SideNav() {
  const pathname = usePathname();

  const navItems = [
    { section: "Dashboard", items: [{ href: "/dashboard", label: "Overview", icon: <DashboardIcon /> }] },
    {
      section: "Operations",
      items: [
        { href: "/field-capture", label: "Field Capture", icon: <MicIcon /> },
        { href: "/engine", label: "Decision Engine", icon: <EngineIcon /> },
        { href: "/transfers", label: "Transfers", icon: <TransferIcon /> },
      ],
    },
    {
      section: "System",
      items: [
        { href: "/ledger", label: "Audit Ledger", icon: <LedgerIcon /> },
        { href: "/exceptions", label: "Exceptions", icon: <ExceptionsIcon /> },
        { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
      ],
    },
  ];

  return (
    <aside className="sidebar" aria-label="Desktop Navigation">
      <div className="sidebar-header">
        <LogoMark size={28} />
        <div>
          <div className="app-header-title">Swasthya-Sanket</div>
          <div className="app-header-subtitle">Barmer District</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section} style={{ marginBottom: 12 }}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-item" style={{ cursor: "default" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-light)" }}>Synced & Secure</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Engine Version 1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Icons ───────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function EngineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3v18" />
      <path d="M10 18l7 4 7-4" />
      <path d="M7 21V3" />
      <path d="M14 6L7 2 0 6" />
    </svg>
  );
}

function LedgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12" />
      <path d="M7 16v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-5" />
      <path d="M4 16h16" />
      <path d="m14 12-2 2-2-2" />
    </svg>
  );
}

function ExceptionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
