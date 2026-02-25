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
    if (referrals.error) return <div className="p-6 text-center text-red-500">Error: {referrals.error}</div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    Affiliates <span className="text-slate-400 font-normal text-sm">({groups.length} referrers · {totalReferred} referred)</span>
                </h2>
            </div>

            {/* Summary stats */}
            {groups.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div className="glass p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Referrers</p>
                        <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
                    </div>
                    <div className="glass p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Referred</p>
                        <p className="text-2xl font-bold text-slate-900">{totalReferred}</p>
                    </div>
                    <div className="glass p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Top Referrer</p>
                        <p className="text-lg font-bold text-blue-600 truncate">
                            {groups.length > 0 ? [...groups].sort((a, b) => b.count - a.count)[0].referrer : '—'}
                        </p>
                    </div>
                </div>
            )}

            {groups.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Users size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 mb-1">No referrals yet.</p>
                    <p className="text-slate-400 text-sm">Users who signed up with a referral code will appear here.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Referrer</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Referrals</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {groups.map(group => {
                                    const isExpanded = expandedReferrer === group.referrer;
                                    return (
                                        <React.Fragment key={group.referrer}>
                                            <tr
                                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => setExpandedReferrer(isExpanded ? null : group.referrer)}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-slate-900">{group.referrer}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{group.count}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 bg-slate-50/50">
                                                        <div className="space-y-1.5 pl-4">
                                                            {group.referredUsers.map(u => (
                                                                <div key={u.userId} className="flex items-center justify-between text-sm">
                                                                    <span className="text-slate-700">{u.username}</span>
                                                                    <span className="text-slate-400 text-xs">{new Date(u.joinedAt).toLocaleDateString()}</span>
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
