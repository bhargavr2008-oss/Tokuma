'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Project, Product } from '@/lib/types';
import { Modal } from './ui';
import { Download, Printer, Link as LinkIcon } from 'lucide-react';

export function useQrDataUrl(url: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) { setSrc(null); return; }
    QRCode.toDataURL(url, {
      width: 720, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#05100c', light: '#ffffff' },
    }).then(setSrc).catch(() => setSrc(null));
  }, [url]);
  return src;
}

export function publicPath(project: Project, product?: Product) {
  return product ? `/p/${project.slug}/${product.slug}` : `/p/${project.slug}`;
}

export function QrModal({ project, product, onClose }: {
  project: Project | null; product?: Product; onClose: () => void;
}) {
  const path = project ? publicPath(project, product) : null;
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const url = path ? `${origin}${path}` : null;
  const src = useQrDataUrl(url);
  const label = product?.name ?? project?.name ?? '';

  return (
    <Modal open={!!project} onClose={onClose} title="Public transparency QR code">
      {project && (
        <div className="grid gap-6 sm:grid-cols-[210px_1fr]">
          <div className="mx-auto rounded-2xl bg-white p-3">
            {src ? <img src={src} alt={`QR code linking to the public page for ${label}`} width={186} height={186} /> :
              <div className="h-[186px] w-[186px] animate-pulse rounded bg-black/10" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{label}</div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-secondary)]">
              Print this onto the product, the packaging or the pilot-line label. Scanning it opens the
              public transparency page — score, materials, end-of-life route and repair instructions.
              No private financial data is published.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-bone-100 px-3 py-2">
              <LinkIcon size={13} className="shrink-0 text-[var(--ink-muted)]" />
              <code className="truncate text-[11px] text-[var(--ink-secondary)]">{url}</code>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {src && <a href={src} download={`tokuma-${product?.slug ?? project.slug}.png`} className="btn-primary text-xs"><Download size={14} /> Save PNG</a>}
              <button onClick={() => window.print()} className="btn-ghost text-xs"><Printer size={14} /> Print</button>
              <a href={path!} target="_blank" rel="noreferrer" className="btn-ghost text-xs">Open page</a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function QrThumb({ url, size = 108 }: { url: string; size?: number }) {
  const src = useQrDataUrl(url);
  return (
    <div className="rounded-xl bg-white p-2" style={{ width: size + 16, height: size + 16 }}>
      {src ? <img src={src} alt="" width={size} height={size} /> : <div className="h-full w-full animate-pulse rounded bg-black/10" />}
    </div>
  );
}
