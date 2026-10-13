import type { ReactNode } from "react";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/quarantaine", label: "Quarantaine" },
  { href: "/admin/demandes", label: "Demandes sans réponse" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#111827", color: "#e5e7eb", padding: "1.5rem 1rem" }}>
        <strong>AgentKnowledge</strong>
        <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 24 }}>Administration</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} style={{ color: "#e5e7eb", textDecoration: "none" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post" style={{ marginTop: 32 }}>
          <button type="submit" style={{ background: "transparent", color: "#9ca3af", border: "none", cursor: "pointer" }}>
            Se déconnecter
          </button>
        </form>
      </aside>
      <main style={{ flex: 1, padding: "2rem", background: "#f9fafb", color: "#111827" }}>{children}</main>
    </div>
  );
}
