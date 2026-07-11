"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Footer, Notification, Spinner } from '../components/ui';
import {
  applyForAffiliate,
  getAffiliateStats,
  requestAffiliatePayout,
  type AffiliateApplication,
  type AffiliateStats,
} from '@/lib/apiClient';

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYOUT_MINIMUM = 50;
const REFERRAL_BASE = 'idpirate.com';

const AUDIENCE_SIZE_OPTIONS: { value: NonNullable<AffiliateApplication['audienceSize']>; label: string }[] = [
  { value: '<1k', label: 'Less than 1,000' },
  { value: '1k-10k', label: '1,000 – 10,000' },
  { value: '10k-100k', label: '10,000 – 100,000' },
  { value: '100k+', label: '100,000+' },
];

// Shared input class — matches the Bold Minimal form input recipe from AGENTS.md
const INPUT_CLASS =
  'w-full bg-white/[0.04] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:outline-none transition';

// ============================================================================
// ICONS (inline SVGs — kept off lucide-react per AGENTS.md non-admin rule)
// ============================================================================

function CopyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function WalletIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function ChartIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PulseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ImageIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function UsersIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 2.18L1.4 10.07c-.86.36-.74 1.6.16 1.78l5.27 1.08 1.98 6.06c.18.55.83.7 1.23.28l2.85-2.83 5.32 3.92c.5.37 1.2.1 1.34-.5l3.5-16.05c.16-.74-.55-1.36-1.05-1.63zM9.7 14.04l8.74-7.13c.16-.13.34.1.21.24l-7.2 6.6-.27 3.04-1.48-2.75z" />
    </svg>
  );
}

function TwitterIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function shortOrderId(orderId: string): string {
  if (!orderId) return '—';
  return orderId.length > 12 ? `${orderId.slice(0, 8)}…${orderId.slice(-4)}` : orderId;
}

/** Copy text to clipboard with a graceful fallback for non-secure contexts. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ============================================================================
// TOAST HOOK
// ============================================================================

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
  show: boolean;
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', show: false });
  const push = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type, show: true });
  }, []);
  const dismiss = useCallback(() => setToast(t => ({ ...t, show: false })), []);
  return { toast, push, dismiss };
}

// ============================================================================
// COPY BUTTON
// ============================================================================

interface CopyButtonProps {
  value: string;
  label?: string;
  onCopied?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

function CopyButton({ value, label = 'Copy', onCopied, className = '', size = 'md' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      onCopied?.();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-white/[0.08] transition-colors cursor-pointer ${sizing} ${className}`}
      aria-label={`${label}${value ? `: ${value}` : ''}`}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-[var(--success)]" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span className="font-medium">{copied ? 'Copied' : label}</span>
    </button>
  );
}

// ============================================================================
// MARKETING LANDING + APPLY FORM
// ============================================================================

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Get Your Code',
    desc: 'We create a unique discount code (e.g. JOHN15) tied to your account.',
    icon: <TagIcon className="h-5 w-5" />,
  },
  {
    step: '2',
    title: 'Share & Earn',
    desc: 'Promote your code on social media, Telegram, Discord. Customers get 15% off, you earn 10–15% commission.',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    step: '3',
    title: 'Get Paid',
    desc: 'Track earnings in real-time. Request payout via PayPal when balance reaches $50.',
    icon: <WalletIcon className="h-5 w-5" />,
  },
];

const BENEFITS = [
  {
    title: '10–15% Commission',
    desc: 'On every order’s product subtotal.',
    icon: <WalletIcon className="h-5 w-5" />,
  },
  {
    title: 'Real-Time Dashboard',
    desc: 'Track clicks, conversions, and earnings.',
    icon: <ChartIcon className="h-5 w-5" />,
  },
  {
    title: 'Monthly Payouts',
    desc: 'Via PayPal, minimum $50 balance.',
    icon: <PulseIcon className="h-5 w-5" />,
  },
  {
    title: 'Marketing Assets',
    desc: 'Pre-made graphics + copy templates.',
    icon: <ImageIcon className="h-5 w-5" />,
  },
];

interface ApplyFormState {
  username: string;
  email: string;
  socialHandle: string;
  audienceSize: NonNullable<AffiliateApplication['audienceSize']> | '';
  audienceDescription: string;
}

const INITIAL_FORM: ApplyFormState = {
  username: '',
  email: '',
  socialHandle: '',
  audienceSize: '',
  audienceDescription: '',
};

function HeroSection({ onApplyClick }: { onApplyClick: () => void }) {
  return (
    <section className="hero-bg noise-overlay relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 badge badge-gold mb-6 animate-fade-up">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-pulse-soft" />
          Now accepting affiliate applications
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-5 animate-fade-up delay-1 tracking-tight font-display leading-[1.1] max-w-3xl">
          Become an{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-cyan-300">
            ID Pirate Affiliate
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl animate-fade-up delay-2 leading-relaxed">
          Earn 10–15% commission on every order placed with your unique discount code.
          Get paid monthly via PayPal.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-up delay-3">
          <button
            type="button"
            onClick={onApplyClick}
            className="btn btn-primary w-full sm:w-auto text-base px-8 py-3.5"
          >
            Apply Now
          </button>
          <a
            href="#how-it-works"
            className="btn btn-outline w-full sm:w-auto text-base px-8 py-3.5"
          >
            How It Works
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 animate-fade-up delay-4">
          {[
            { value: '10–15%', label: 'Commission' },
            { value: '$50', label: 'Min payout' },
            { value: 'Monthly', label: 'PayPal payouts' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-[var(--accent)] font-display">{stat.value}</span>
              <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 animate-fade-up font-display">
            How It Works
          </h2>
          <p className="text-sm text-[var(--text-secondary)] animate-fade-up delay-1">
            Three simple steps to start earning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className={`glass glass-hover p-6 sm:p-7 animate-fade-up delay-${i + 1}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--border-accent)] text-[var(--accent)] flex items-center justify-center text-sm font-bold font-display">
                  {item.step}
                </div>
                <div className="text-[var(--accent)]">{item.icon}</div>
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 font-display">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-[var(--bg-secondary)] section-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 animate-fade-up font-display">
            Why Partner With Us
          </h2>
          <p className="text-sm text-[var(--text-secondary)] animate-fade-up delay-1">
            Everything you need to monetize your audience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`glass glass-hover p-5 sm:p-6 animate-fade-up delay-${i + 1}`}
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] mb-3">
                {b.icon}
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 font-display">{b.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplyFormSection({
  isLoggedIn,
  prefillUsername,
  onToast,
}: {
  isLoggedIn: boolean;
  prefillUsername?: string;
  onToast: (msg: string, type?: ToastState['type']) => void;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<ApplyFormState>({
    ...INITIAL_FORM,
    username: prefillUsername ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplyFormState, string>>>({});

  // Prefill username when auth loads after mount
  useEffect(() => {
    if (prefillUsername && !form.username) {
      setForm(f => ({ ...f, username: prefillUsername }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUsername]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof ApplyFormState, string>> = {};
    if (!form.username.trim()) next.username = 'Username is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = <K extends keyof ApplyFormState>(key: K, value: ApplyFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: AffiliateApplication = {
      username: form.username.trim(),
      email: form.email.trim(),
    };
    if (form.socialHandle.trim()) payload.socialHandle = form.socialHandle.trim();
    if (form.audienceSize) payload.audienceSize = form.audienceSize;
    if (form.audienceDescription.trim()) payload.audienceDescription = form.audienceDescription.trim();

    setSubmitting(true);
    try {
      await applyForAffiliate(payload);
      setSuccess(true);
      onToast('Application submitted!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit application.';
      onToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="apply" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-20">
      <div ref={formRef} className="max-w-2xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 animate-fade-up font-display">
            Apply to the Affiliate Program
          </h2>
          <p className="text-sm text-[var(--text-secondary)] animate-fade-up delay-1">
            Tell us about you and your audience. We review every application within 2–3 business days.
          </p>
        </div>

        {success ? (
          <div className="glass p-8 sm:p-10 text-center animate-fade-up border border-emerald-500/20">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-5">
              <CheckIcon className="h-7 w-7 text-[var(--success)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-display">
              Application received!
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              We’ll review and email you within 2–3 business days. Watch your inbox (and spam folder)
              for a message from <span className="text-[var(--text-primary)]">support@idpirate.com</span>.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/" className="btn btn-outline px-6 py-2.5 text-sm">
                Back to Home
              </Link>
              <Link href="/order" className="btn btn-primary px-6 py-2.5 text-sm">
                Browse IDs
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="glass p-6 sm:p-8 animate-fade-up delay-1"
          >
            {isLoggedIn && (
              <div className="mb-6 rounded-lg border border-[var(--border-accent)] bg-[var(--accent-subtle)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--accent)] font-semibold">Signed in.</span>{' '}
                We’ll auto-link this application to your account
                {prefillUsername ? <> (<span className="text-[var(--text-primary)] font-medium">{prefillUsername}</span>)</> : null}.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Username */}
              <div className="sm:col-span-1">
                <label htmlFor="aff-username" className="text-label block mb-2">
                  Username <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  id="aff-username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={e => handleChange('username', e.target.value)}
                  placeholder="Your ID Pirate username"
                  className={INPUT_CLASS}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'aff-username-error' : undefined}
                />
                {errors.username && (
                  <p id="aff-username-error" className="mt-1.5 text-xs text-[var(--error)]">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div className="sm:col-span-1">
                <label htmlFor="aff-email" className="text-label block mb-2">
                  Email <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  id="aff-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASS}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'aff-email-error' : undefined}
                />
                {errors.email && (
                  <p id="aff-email-error" className="mt-1.5 text-xs text-[var(--error)]">{errors.email}</p>
                )}
              </div>

              {/* Social handle */}
              <div className="sm:col-span-1">
                <label htmlFor="aff-social" className="text-label block mb-2">
                  Social media handle <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                </label>
                <input
                  id="aff-social"
                  type="text"
                  value={form.socialHandle}
                  onChange={e => handleChange('socialHandle', e.target.value)}
                  placeholder="@yourhandle"
                  className={INPUT_CLASS}
                />
              </div>

              {/* Audience size */}
              <div className="sm:col-span-1">
                <label htmlFor="aff-audience" className="text-label block mb-2">
                  Audience size
                </label>
                <select
                  id="aff-audience"
                  value={form.audienceSize}
                  onChange={e => handleChange('audienceSize', e.target.value as ApplyFormState['audienceSize'])}
                  className={INPUT_CLASS}
                >
                  <option value="">Select…</option>
                  {AUDIENCE_SIZE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Audience description */}
              <div className="sm:col-span-2">
                <label htmlFor="aff-desc" className="text-label block mb-2">
                  Tell us about your audience <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                </label>
                <textarea
                  id="aff-desc"
                  rows={4}
                  value={form.audienceDescription}
                  onChange={e => handleChange('audienceDescription', e.target.value)}
                  placeholder="Where do you promote? What kind of content do you post? Any past brand deals?"
                  className={`${INPUT_CLASS} resize-y min-h-[100px]`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-tertiary)] text-left sm:flex-1">
                By submitting, you agree to our affiliate terms. We’ll never share your info.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full sm:w-auto px-8 py-3 text-sm"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" /> Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function MarketingLanding({
  isLoggedIn,
  prefillUsername,
  onToast,
}: {
  isLoggedIn: boolean;
  prefillUsername?: string;
  onToast: (msg: string, type?: ToastState['type']) => void;
}) {
  const applyRef = useRef<HTMLDivElement>(null);

  const scrollToApply = useCallback(() => {
    const el = document.getElementById('apply');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <HeroSection onApplyClick={scrollToApply} />
      <HowItWorksSection />
      <BenefitsSection />
      <ApplyFormSection
        isLoggedIn={isLoggedIn}
        prefillUsername={prefillUsername}
        onToast={onToast}
      />
      {/* keep ref below for legacy hook (smooth scroll anchor uses #apply id above) */}
      <div ref={applyRef} aria-hidden="true" className="sr-only" />
    </>
  );
}

// ============================================================================
// AFFILIATE DASHBOARD
// ============================================================================

function StatCard({
  label,
  value,
  sub,
  icon,
  delay,
  isPrice = false,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  delay: number;
  isPrice?: boolean;
}) {
  return (
    <div
      className="glass p-5 sm:p-6 animate-fade-up"
      style={{ animationDelay: `${75 * delay}ms` }}
    >
      <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-3">
        <span className="text-[var(--accent)]">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isPrice ? 'text-price' : 'text-[var(--text-primary)]'} font-display break-words`}>
        {value}
      </p>
      {sub && <div className="mt-2 text-xs text-[var(--text-tertiary)]">{sub}</div>}
    </div>
  );
}

function ReferralLinkCard({
  primaryCode,
  codes,
  onToast,
  delay,
}: {
  primaryCode: string;
  codes: AffiliateStats['codes'];
  onToast: (msg: string, type?: ToastState['type']) => void;
  delay: number;
}) {
  const link = `${REFERRAL_BASE}?ref=${encodeURIComponent(primaryCode)}`;

  const handleShare = (platform: 'telegram' | 'twitter') => {
    const text = 'Get 15% off your ID Pirate order with my code';
    const enc = encodeURIComponent(link);
    const encText = encodeURIComponent(text);
    const shareUrl =
      platform === 'telegram'
        ? `https://t.me/share/url?url=${enc}&text=${encText}`
        : `https://twitter.com/intent/tweet?url=${enc}&text=${encText}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=620,height=520');
  };

  const handleDiscord = async () => {
    const ok = await copyToClipboard(link);
    onToast(
      ok ? 'Link copied — paste it in your Discord server!' : 'Could not copy link.',
      ok ? 'success' : 'error'
    );
  };

  return (
    <div
      className="glass p-6 sm:p-7 animate-fade-up"
      style={{ animationDelay: `${75 * delay}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] font-display mb-1">
            Your referral link
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Share this anywhere. Customers get 15% off, you earn commission.
          </p>
        </div>
        {codes.length > 1 && (
          <span className="badge badge-cyan text-xs whitespace-nowrap">
            {codes.length} codes
          </span>
        )}
      </div>

      {/* Link row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:gap-3 mb-5">
        <code className="flex-1 min-w-0 bg-white/[0.04] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] font-mono truncate select-all">
          {link}
        </code>
        <CopyButton value={link} label="Copy link" onCopied={() => onToast('Link copied to clipboard.', 'success')} />
      </div>

      {/* All codes row (only if multiple) */}
      {codes.length > 1 && (
        <div className="mb-5">
          <p className="text-label mb-2">All your codes</p>
          <div className="flex flex-wrap gap-2">
            {codes.map(c => (
              <div
                key={c.code}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-1.5"
                title={`${c.code} — ${c.commissionPercent}% commission · ${c.usedCount} uses${c.isActive ? '' : ' · inactive'}`}
              >
                <span className="font-mono text-sm text-[var(--text-primary)]">{c.code}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {c.commissionPercent}% · {c.usedCount} use{c.usedCount === 1 ? '' : 's'}
                </span>
                {!c.isActive && <span className="text-xs text-[var(--text-tertiary)]">· inactive</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-tertiary)] mr-1">Share:</span>
        <button
          type="button"
          onClick={() => handleShare('telegram')}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.04] px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
          Telegram
        </button>
        <button
          type="button"
          onClick={() => handleShare('twitter')}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.04] px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <TwitterIcon className="h-4 w-4" />
          Twitter
        </button>
        <button
          type="button"
          onClick={handleDiscord}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.04] px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
          Discord
        </button>
      </div>
    </div>
  );
}

function ConversionsTable({ orders }: { orders: AffiliateStats['recentOrders'] }) {
  return (
    <div className="glass p-0 overflow-hidden animate-fade-up">
      <div className="p-5 sm:p-6 border-b border-[var(--border)]">
        <h3 className="text-base font-semibold text-[var(--text-primary)] font-display">
          Recent conversions
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Last {orders.length} order{orders.length === 1 ? '' : 's'} placed with your code.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="p-10 text-center">
          <UsersIcon className="h-8 w-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">No conversions yet.</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Share your referral link to start earning.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[var(--bg-secondary)]">
              <tr>
                {['Order ID', 'Date', 'Order Total', 'Commission', 'Status'].map(h => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border)] ${h === 'Order Total' || h === 'Commission' ? 'text-right' : ''} ${h === 'Status' ? 'text-center' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr
                  key={o.orderId}
                  className="transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 sm:px-5 py-3 text-sm font-mono text-[var(--text-secondary)] whitespace-nowrap">
                    {shortOrderId(o.orderId)}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-sm text-right whitespace-nowrap text-[var(--text-secondary)]">
                    ${formatMoney(o.orderTotal)}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-sm text-right whitespace-nowrap text-price">
                    ${formatMoney(o.commissionEarned)}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-center whitespace-nowrap">
                    {o.affiliatePaid ? (
                      <span className="inline-flex items-center gap-1 badge badge-green">
                        <CheckIcon className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="badge badge-amber">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PayoutCard({
  pendingPayout,
  onToast,
  onAfterPayout,
  delay,
}: {
  pendingPayout: number;
  onToast: (msg: string, type?: ToastState['type']) => void;
  onAfterPayout: () => void;
  delay: number;
}) {
  const [requesting, setRequesting] = useState(false);
  const canPayout = pendingPayout >= PAYOUT_MINIMUM;

  const handlePayout = async () => {
    if (!canPayout || requesting) return;
    setRequesting(true);
    try {
      await requestAffiliatePayout();
      onToast('Payout requested! We’ll email you within 1–2 business days.', 'success');
      onAfterPayout();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to request payout.';
      onToast(msg, 'error');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className="glass p-6 sm:p-7 animate-fade-up"
      style={{ animationDelay: `${75 * delay}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] font-display mb-1">
            Request a payout
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md">
            Payouts are sent via PayPal to the email on your account, within 1–2 business days.
            Minimum balance is <span className="text-[var(--text-primary)] font-medium">${PAYOUT_MINIMUM.toFixed(2)}</span>.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handlePayout}
            disabled={!canPayout || requesting}
            className="btn btn-primary w-full sm:w-auto px-6 py-3 text-sm"
            aria-disabled={!canPayout || requesting}
          >
            {requesting ? (
              <>
                <Spinner size="sm" /> Requesting…
              </>
            ) : (
              <>Request Payout (${formatMoney(pendingPayout)})</>
            )}
          </button>
          {!canPayout && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center sm:text-right">
              ${formatMoney(Math.max(0, PAYOUT_MINIMUM - pendingPayout))} more to unlock payouts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AffiliateDashboard({
  stats,
  onToast,
  onRefresh,
}: {
  stats: AffiliateStats;
  onToast: (msg: string, type?: ToastState['type']) => void;
  onRefresh: () => void;
}) {
  const primaryCode = stats.codes[0]?.code ?? '';
  const activeCodes = stats.codes.filter(c => c.isActive);
  const totalUsed = useMemo(
    () => stats.codes.reduce((s, c) => s + (c.usedCount ?? 0), 0),
    [stats.codes]
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
      <header className="mb-8 sm:mb-10 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight font-display">
              Affiliate Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Track your commissions, share your link, and request payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-outline px-4 py-2 text-xs self-start sm:self-center"
            aria-label="Refresh stats"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Your Code"
          value={primaryCode || '—'}
          sub={
            activeCodes.length > 0 ? (
              <span>
                {activeCodes.length} active · {totalUsed} total use{totalUsed === 1 ? '' : 's'}
              </span>
            ) : (
              <span>No active codes</span>
            )
          }
          icon={<TagIcon className="h-5 w-5" />}
          delay={1}
        />
        <StatCard
          label="Total Earnings"
          value={`$${formatMoney(stats.totalEarnings)}`}
          icon={<WalletIcon className="h-5 w-5" />}
          delay={2}
          isPrice
        />
        <StatCard
          label="Pending Payout"
          value={`$${formatMoney(stats.pendingPayout)}`}
          sub={stats.pendingPayout >= PAYOUT_MINIMUM ? 'Ready to request' : 'Below $50 minimum'}
          icon={<PulseIcon className="h-5 w-5" />}
          delay={3}
          isPrice
        />
        <StatCard
          label="Conversions"
          value={String(stats.conversionCount)}
          sub={stats.conversionCount === 1 ? '1 order' : `${stats.conversionCount} orders`}
          icon={<ChartIcon className="h-5 w-5" />}
          delay={4}
        />
      </div>

      {/* Referral link + share */}
      {primaryCode && (
        <div className="mb-6 sm:mb-8">
          <ReferralLinkCard
            primaryCode={primaryCode}
            codes={stats.codes}
            onToast={onToast}
            delay={5}
          />
        </div>
      )}

      {/* Payout */}
      <div className="mb-6 sm:mb-8">
        <PayoutCard
          pendingPayout={stats.pendingPayout}
          onToast={onToast}
          onAfterPayout={onRefresh}
          delay={6}
        />
      </div>

      {/* Recent conversions */}
      <ConversionsTable orders={stats.recentOrders} />
    </div>
  );
}

// ============================================================================
// LOADING / ERROR STATES
// ============================================================================

function FullPageMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}

// ============================================================================
// ROOT PAGE
// ============================================================================

export default function AffiliatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast, push, dismiss } = useToast();

  const [checkingAffiliate, setCheckingAffiliate] = useState(true);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    // Auth still loading — wait.
    if (authLoading) return;
    // No user → public landing. Don't bother hitting the API.
    if (!user) {
      setCheckingAffiliate(false);
      setStats(null);
      setStatsError(null);
      return;
    }

    setCheckingAffiliate(true);
    setStatsError(null);
    try {
      const s = await getAffiliateStats();
      // Treat as affiliate only if they have at least one code OR the backend
      // explicitly returned codes/earnings (some users may have legacy rows).
      if (s && Array.isArray(s.codes) && s.codes.length > 0) {
        setStats(s);
      } else {
        setStats(null);
      }
    } catch (err) {
      // 404 / 403 → not an affiliate yet. Other errors → surface a message
      // but still fall back to the marketing/apply view so the page stays usable.
      const msg = err instanceof Error ? err.message : '';
      if (/404|403|not.*affiliate|no.*affiliate/i.test(msg)) {
        setStats(null);
        setStatsError(null);
      } else {
        setStats(null);
        setStatsError(msg || 'Failed to load affiliate stats.');
      }
    } finally {
      setCheckingAffiliate(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="min-h-screen flex flex-col">
      <Notification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onDismiss={dismiss}
      />

      <div className="flex-grow flex-1">
        {/* Auth loading: minimal skeleton */}
        {authLoading ? (
          <FullPageMessage>
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading…</p>
          </FullPageMessage>
        ) : checkingAffiliate ? (
          <FullPageMessage>
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Checking affiliate status…</p>
          </FullPageMessage>
        ) : stats ? (
          <AffiliateDashboard stats={stats} onToast={push} onRefresh={loadStats} />
        ) : (
          <>
            {statsError && (
              <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                  Couldn’t load your affiliate stats ({statsError}). Showing the apply form below —
                  your dashboard will appear here once you’re approved.
                </div>
              </div>
            )}
            <MarketingLanding
              isLoggedIn={!!user}
              prefillUsername={user?.username}
              onToast={push}
            />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
