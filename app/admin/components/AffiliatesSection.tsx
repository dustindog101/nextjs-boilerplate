"use client";
import React, { useEffect, useMemo } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner, SortableTh } from '../../components/ui';
import { useAdminData } from '../AdminDataContext';
import { sortRows } from '@/lib/tableSort';
import { useTableSortState } from '@/app/hooks/useTableSort';
import type { ReferralGroup } from '@/lib/apiClient';

export const AffiliatesSection = () => {
    const { referrals, loadReferrals } = useAdminData();
    const [expandedReferrer, setExpandedReferrer] = React.useState<string | null>(null);

    useEffect(() => { loadReferrals(); }, [loadReferrals]);

    const groups = referrals.data || [];
    const totalReferred = groups.reduce((sum, r) => sum + r.count, 0);

    const { sortKey, direction, toggleSort } = useTableSortState('count', 'desc');

    const sorted = useMemo(() => {
        const tie = (a: ReferralGroup, b: ReferralGroup) => a.referrer.localeCompare(b.referrer);
        return sortRows(
            groups,
            sortKey,
            direction,
            {
                referrer: g => g.referrer,
                count: g => g.count,
            },
            tie
        );
    }, [groups, sortKey, direction]);

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
                                    <SortableTh
                                        columnKey="referrer"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                    >
                                        Referrer
                                    </SortableTh>
                                    <SortableTh
                                        columnKey="count"
                                        sortKey={sortKey}
                                        direction={direction}
                                        onSort={toggleSort}
                                        align="right"
                                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}
                                    >
                                        Referrals
                                    </SortableTh>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-10" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }} scope="col" aria-label="Expand" />
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(group => {
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
