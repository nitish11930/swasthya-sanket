"use client";

import LogoMark from "../ui/LogoMark";
import SignOutButton from "../ui/SignOutButton";

export default function AppHeader() {
  return (
    <header className="app-header">
      <LogoMark size={24} />
      
      <div>
        <div className="app-header-title">Swasthya-Sanket</div>
        <div className="app-header-subtitle">Barmer District</div>
      </div>

      <div className="app-header-spacer" />

      {/* Sync Badge */}
      <span className="badge badge-synced" style={{ marginRight: 8, fontSize: 10 }}>
        <span className="status-dot status-dot-green" />
        Synced
      </span>

      {/* User initials */}
      <SignOutButton initials="A" />
    </header>
  );
}
