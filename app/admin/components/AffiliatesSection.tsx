"use client";
import React, { useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';

export const AffiliatesSection = () => {
    const { referrals, loadReferrals } = useAdminData();
    const [expandedReferrer, setExpandedReferrer] = React.useState<string | null>(null);

    useEffect(() => { loadReferrals(); }, [loadReferrals]);

    const totalReferred = (referrals.data || []).reduce((sum, r) => sum + r.count, 0);
    const groups = referrals.data || [];

    if (referrals.isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (referrals.error) return <div className="p-6 text-center text-red-400">Error: {referrals.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Affiliates <span className="font-normal text-sm" style={{ color: 'var(--text-tertiary)' }}>({groups.length} referrers · {totalReferred} referred)</span>
                </h2>
            </div>

            {groups.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Total Referrers', value: String(groups.length) },
                        { label: 'Total Referred', value: String(totalReferred) },
                        { label: 'Top Referrer', value: [...groups].sort((a, b) => b.count - a.count)[0]?.referrer || '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="card p-4">
                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                            <p className="text-2xl font-bold truncate" style={{ color: label === 'Top Referrer' ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {groups.length === 0 ? (
                <div className="card p-8 text-center">
                    <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>No referrals yet.</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Users who signed up with a referral code will appear here.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)' }}>
                                    {['Referrer', 'Referrals', ''].map((h, i) => (
                                        <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map(group => {
                                    const isExpanded = expandedReferrer === group.referrer;
                                    return (
                                        <React.Fragment key={group.referrer}>
                                            <tr
                                                className="transition-colors cursor-pointer"
                                                style={{ borderBottom: '1px solid var(--border)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                onClick={() => setExpandedReferrer(isExpanded ? null : group.referrer)}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{group.referrer}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{group.count}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right" style={{ color: 'var(--text-tertiary)' }}>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3" style={{ background: 'var(--bg-secondary)' }}>
                                                        <div className="space-y-1.5 pl-4">
                                                            {group.referredUsers.map(u => (
                                                                <div key={u.userId} className="flex items-center justify-between text-sm">
                                                                    <span style={{ color: 'var(--text-secondary)' }}>{u.username}</span>
                                                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(u.joinedAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
