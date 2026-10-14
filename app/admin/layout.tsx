import type { ReactNode } from "react";
import Link from "next/link";
import "./admin.css";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/fiches", label: "Toutes les fiches" },
  { href: "/admin/quarantaine", label: "Quarantaine" },
  { href: "/admin/demandes", label: "Lacunes" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ak">
      <aside className="ak-side">
        <p className="ak-brand">AgentKnowledge</p>
        <p className="ak-kicker">Bureau</p>
        <nav className="ak-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post">
          <button className="ak-logout" type="submit">Se déconnecter</button>
        </form>
      </aside>
      <main className="ak-main">{children}</main>
    </div>
  );
}
