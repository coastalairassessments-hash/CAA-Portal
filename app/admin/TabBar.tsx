"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavCounts = { new: number; waiting: number; upcoming: number };

const icons = {
  new: <path d="M4 13l2-7h12l2 7v5H4v-5zm0 0h4l1 2h6l1-2h4" />,
  waiting: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  booked: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
} as const;

export default function TabBar({ counts }: { counts: NavCounts }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab") ?? "new";
  const onList = path === "/admin";
  const items = [
    { key: "new", label: "New", href: "/admin", count: counts.new, active: onList && tab === "new" },
    { key: "waiting", label: "Waiting", href: "/admin?tab=waiting", count: counts.waiting, active: onList && tab === "waiting" },
    { key: "booked", label: "Booked", href: "/admin?tab=booked", count: counts.upcoming, active: onList && tab === "booked" },
    { key: "more", label: "More", href: "/admin/more", count: 0, active: path === "/admin/more" || (onList && (tab === "declined" || tab === "all")) },
  ] as const;

  return (
    <nav className="adm-bar" aria-label="Main">
      {items.map((i) => (
        <Link key={i.key} href={i.href} aria-current={i.active ? "page" : undefined}>
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
