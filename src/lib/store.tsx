'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Project } from './types';
import { PROJECTS } from './data';

// Projects live in localStorage so the prototype is fully usable — and
// demoable — with no backend. supabase/schema.sql mirrors this shape exactly,
// so swapping the provider for a Supabase query changes nothing downstream.

const KEY = 'tokuma.projects.v1';

interface Store {
  projects: Project[];
  add: (p: Project) => void;
  remove: (id: string) => void;
  reset: () => void;
  hydrated: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [custom, setCustom] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {
      /* corrupt or unavailable storage falls back to seed data only */
    }
    setHydrated(true);
  }, []);

  const persist = (next: Project[]) => {
    setCustom(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const value = useMemo<Store>(() => ({
    projects: [...PROJECTS, ...custom],
    add: (p) => persist([...custom, p]),
    remove: (id) => persist(custom.filter((c) => c.id !== id)),
    reset: () => persist([]),
    hydrated,
  }), [custom, hydrated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
