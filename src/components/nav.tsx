'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, Package, Gauge, TrendingUp, Recycle,
  Share2, PlusCircle, QrCode, BookOpen, Menu, X,
} from 'lucide-react';

const GROUPS = [
  { title: 'Overview', links: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/connections', label: 'Connections', icon: Share2 },
  ] },
  { title: 'Portfolio', links: [
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/add', label: 'Add Project', icon: PlusCircle },
  ] },
  { title: 'Analysis', links: [
    { href: '/score', label: 'Circular Score', icon: Gauge },
    { href: '/financial', label: 'Financial Impact', icon: TrendingUp },
    { href: '/waste', label: 'Waste Intelligence', icon: Recycle },
  ] },
  { title: 'Publish', links: [
    { href: '/qr', label: 'QR Codes', icon: QrCode },
    { href: '/about', label: 'Methodology', icon: BookOpen },
  ] },
];

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-6">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="label-plain mb-2 px-3">{g.title}</div>
          <ul className="flex flex-col gap-0.5">
            {g.links.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href} onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
                      active
                        ? 'bg-forest-900 text-bone-100'
                        : 'text-[var(--ink-secondary)] hover:bg-bone-200 hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    <Icon size={15} className="shrink-0" strokeWidth={1.75} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bone-100/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setOpen(!open)} className="btn-ghost px-3 py-2" aria-label="Toggle navigation">
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>
      {open && <div className="border-b border-line bg-bone-100 px-4 py-5 lg:hidden">{nav}</div>}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-7 overflow-y-auto border-r border-line bg-bone-50 px-4 py-7 lg:flex">
        <Brand />
        {nav}
        <p className="mt-auto rounded-lg border border-line bg-bone-200 p-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
          Prototype methodology v1.0 — weights are configuration, not fixed truth.
        </p>
      </aside>
    </>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-baseline gap-2 px-1">
      <span className="font-serif text-[22px] leading-none tracking-tight text-forest-900">Tokuma</span>
      <span className="h-1.5 w-1.5 rounded-full bg-sage-500" aria-hidden />
    </Link>
  );
}
