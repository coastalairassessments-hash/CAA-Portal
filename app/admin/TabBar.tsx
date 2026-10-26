"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavCounts = { today: number; requests: number };

const icons = {
  today: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  requests: <path d="M4 13l2-7h12l2 7v5H4v-5zm0 0h4l1 2h6l1-2h4" />,
  add: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
} as const;

export default function TabBar({ counts }: { counts: NavCounts }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab") ?? "requests";
  const onList = path === "/admin";
  const items = [
    { key: "today", label: "Today", href: "/admin/today", count: counts.today, active: path === "/admin/today" },
    { key: "requests", label: "Requests", href: "/admin", count: counts.requests, active: onList && tab === "requests" },
    { key: "add", label: "Add", href: "/admin/add", count: 0, active: path === "/admin/add" },
    { key: "more", label: "More", href: "/admin/more", count: 0, active: path === "/admin/more" || (onList && tab !== "requests") },
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
