"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavCounts = { today: number; requests: number };

const icons = {
  today: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  clients: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 5.5a3 3 0 010 5.6M18 14.3c1.6.6 2.6 2.2 2.6 4.2" /></>,
  week: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  add: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
} as const;

export default function TabBar({ counts }: { counts: NavCounts }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab") ?? "motion";
  const onList = path === "/admin";
  if (/^\/admin\/[0-9a-f-]{36}$/i.test(path)) return null; // job screens have their own bottom bar
  const items = [
    { key: "today", label: "Today", href: "/admin/today", count: counts.today, active: path === "/admin/today" },
    { key: "week", label: "Week", href: "/admin/week", count: 0, active: path === "/admin/week" },
    { key: "add", label: "Add", href: "/admin/add", count: 0, active: path === "/admin/add" },
    { key: "clients", label: "Clients", href: "/admin", count: counts.requests, active: onList },
    { key: "more", label: "More", href: "/admin/more", count: 0, active: path === "/admin/more" },
  ] as const;

  return (
    <nav className="adm-bar" aria-label="Main">
      {items.map((i) => (
        <Link key={i.key} href={i.href} aria-current={i.active ? "page" : undefined} className={i.key === "add" ? "adm-bar-add" : undefined}>
          <span className="adm-bar-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {icons[i.key]}
            </svg>
            {i.count > 0 && <b className="adm-bar-badge">{i.count > 99 ? "99+" : i.count}</b>}
          </span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
