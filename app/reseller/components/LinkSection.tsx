"use client";
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
    Copy, Check, ExternalLink, Instagram, MessageCircle,
    Smartphone, Globe, Zap, TrendingUp, ShieldCheck,
} from 'lucide-react';

// ─── QR Code via Google Charts (no install needed) ────────────────────────────

const QRCode: React.FC<{ url: string }> = ({ url }) => {
    const encoded = encodeURIComponent(url);
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&color=06B6D4&bgcolor=0f1520&margin=12`;
    return (
        <img
            src={src}
            alt="QR Code"
            width={140} height={140}
            className="rounded-xl"
            style={{ border: '1px solid var(--border)' }}
        />
    );
};

// ─── Tip card ─────────────────────────────────────────────────────────────────

const TipCard: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
    <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
        <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }}>{icon}</span>
        <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const LinkSection: React.FC = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const subdomain = user?.username ?? '';
    const resellerLink = `https://${subdomain}.idpirate.com`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(resellerLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
            {/* Hero link card */}
            <div
                className="rounded-2xl border p-6"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Your Reseller Link
                    </h2>
                </div>
                <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
                    This is your unique white-label checkout. Share it anywhere — customers will never see ID Pirate branding.
                </p>

                {/* Link + copy row */}
                <div className="flex items-center gap-3 mb-5">
                    <code
                        className="flex-1 text-sm font-mono px-4 py-3 rounded-xl truncate border"
                        style={{
                            background: 'var(--bg-primary)',
                            borderColor: 'var(--border)',
                            color: 'var(--accent)',
                        }}
                    >
                        {resellerLink}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
                        style={copied
                            ? { background: '#10B981', color: '#fff' }
                            : { background: 'var(--accent)', color: '#0f1520' }
                        }
                    >
                        {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
                    </button>
                    <a
                        href={resellerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border transition-all"
                        style={{
                            background: 'var(--bg-primary)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)',
                        }}
                        title="Preview your link"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>

                {/* QR + preview */}
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div>
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            QR Code
                        </p>
                        <QRCode url={resellerLink} />
                        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                            Print or screenshot this for in-person use.
                        </p>
                    </div>
                    <div className="flex-1 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            Quick Share
                        </p>
                        {/* Share chips */}
                        {[
                            {
                                label: 'Copy for Instagram Bio',
                                icon: <Instagram size={14} />,
                                text: `${resellerLink}`,
                            },
                            {
                                label: 'WhatsApp Message',
                                icon: <MessageCircle size={14} />,
                                text: `Order your custom ID here: ${resellerLink}`,
                            },
                            {
                                label: 'SMS Template',
                                icon: <Smartphone size={14} />,
                                text: `Hey! Place your order here: ${resellerLink}`,
                            },
                        ].map(({ label, icon, text }) => (
                            <button
                                key={label}
                                onClick={() => navigator.clipboard.writeText(text)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all text-left"
                                style={{
                                    background: 'var(--bg-primary)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                                }}
                            >
                                <span style={{ color: 'var(--accent)' }}>{icon}</span>
                                <span className="font-medium text-xs">{label}</span>
                                <Copy size={12} className="ml-auto opacity-50" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Growth tips */}
            <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Tips to Grow Your Sales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                        icon={<Instagram size={16} />}
                        title="Add to your Instagram bio"
                        body="A link in bio is the single highest-converting placement. Update it today and start seeing orders."
                    />
                    <TipCard
                        icon={<MessageCircle size={16} />}
                        title="Drop in group chats"
                        body="Send the link in group chats with your message. People share among friends — one message can bring many orders."
                    />
                    <TipCard
                        icon={<Zap size={16} />}
                        title="Quick response = higher conversion"
                        body="Customers who get a fast reply are far more likely to complete an order. Check your orders daily."
                    />
                    <TipCard
                        icon={<TrendingUp size={16} />}
                        title="Offer bundle deals"
                        body="Tell friends ordering 3+ get a discount. You control pricing — use this to drive volume."
                    />
                    <TipCard
                        icon={<Globe size={16} />}
                        title="Post on Reddit & Discord"
                        body="Communities like r/college have high intent buyers. Post your link in relevant threads."
                    />
                    <TipCard
                        icon={<ShieldCheck size={16} />}
                        title="Emphasize privacy"
                        body="Your customers never see ID Pirate branding. Reassure them their info stays between you and them."
                    />
                </div>
            </div>
        </div>
    );
};
