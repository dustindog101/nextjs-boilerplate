"use client";

import React, { useState } from 'react';
import { Copy } from 'lucide-react';

export interface LoginIpEntry {
  ip: string;
  at?: string;
}

interface IpAuditBlockProps {
  registrationIp?: string;
  loginHistory?: LoginIpEntry[];
  lastLoginIp?: string;
  lastLoginAt?: string;
}

function formatWhen(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function CopyIpButton({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="p-1 rounded-md transition-colors hover:bg-white/[0.06]"
      style={{ color: copied ? 'var(--success)' : 'var(--text-tertiary)' }}
      aria-label={`Copy IP ${ip}`}
      title={copied ? 'Copied' : 'Copy IP'}
    >
      <Copy size={12} />
    </button>
  );
}

function IpRow({ label, ip, when }: { label: string; ip: string; when?: string }) {
  return (
    <li
      className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </p>
        <p className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
          {ip}
        </p>
        {when ? (
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {formatWhen(when)}
          </p>
        ) : null}
      </div>
      <CopyIpButton ip={ip} />
    </li>
  );
}

export function IpAuditBlock({
  registrationIp,
  loginHistory,
  lastLoginIp,
  lastLoginAt,
}: IpAuditBlockProps) {
  const logins =
    loginHistory && loginHistory.length > 0
      ? loginHistory
      : lastLoginIp
        ? [{ ip: lastLoginIp, at: lastLoginAt }]
        : [];

  return (
    <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div>
        <p className="text-label">IP log</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Server-captured on register and login. Last 5 logins kept.
        </p>
      </div>

      {registrationIp ? (
        <ul className="space-y-1.5">
          <IpRow label="Registration" ip={registrationIp} />
        </ul>
      ) : null}

      {logins.length > 0 ? (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Login history ({logins.length})
          </p>
          <ul className="space-y-1.5">
            {logins.map((row, i) => (
              <IpRow
                key={`${row.ip}-${row.at ?? i}`}
                label={i === 0 ? 'Latest login' : `Login ${i + 1}`}
                ip={row.ip}
                when={row.at}
              />
            ))}
          </ul>
        </div>
      ) : !registrationIp ? (
        <p className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          No IP data yet. New registrations and logins are recorded automatically.
        </p>
      ) : null}
    </div>
  );
}

export function CopyableMonoField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const display = value?.trim() || '—';

  return (
    <div>
      <span className="text-label block mb-0.5">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <p
          className="text-xs font-mono break-all flex-1"
          style={{ color: display === '—' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
        >
          {display}
        </p>
        {value?.trim() ? <CopyIpButton ip={value.trim()} /> : null}
      </div>
    </div>
  );
}
