"use client";
import React, { useState, useEffect } from 'react';
import { adminListReferrals, ReferralGroup } from '../../../lib/apiClient';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Spinner } from '../../components/ui';

export const AffiliatesSection = () => {
    const [referrals, setReferrals] = useState<ReferralGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await adminListReferrals();
                setReferrals(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const totalReferred = referrals.reduce((sum, r) => sum + r.count, 0);

    if (isLoading) return <div className="p-12 flex items-center justify-center"><Spinner size="lg" /></div>;
    if (error) return <div className="p-6 text-center text-red-400">Error: {error}</div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                    Affiliates <span className="text-zinc-500 font-normal text-sm">({referrals.length} referrers · {totalReferred} referred)</span>
                </h2>
            </div>

            {referrals.length === 0 ? (
                <div className="glass p-8 text-center">
                    <Users size={32} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 mb-1">No referrals yet.</p>
                    <p className="text-zinc-600 text-sm">Users who signed up with a referral code will appear here.</p>
                </div>
            ) : (
                <div className="glass overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/[0.06]">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Referrer</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Referrals</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {referrals.map(group => {
                                    const isExpanded = expandedReferrer === group.referrer;
                                    return (
                                        <React.Fragment key={group.referrer}>
                                            <tr
                                                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                onClick={() => setExpandedReferrer(isExpanded ? null : group.referrer)}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <p className="text-sm font-bold text-white">{group.referrer}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{group.count}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 bg-white/[0.01]">
                                                        <div className="space-y-1.5 pl-4">
                                                            {group.referredUsers.map(u => (
                                                                <div key={u.userId} className="flex items-center justify-between text-sm">
                                                                    <span className="text-zinc-300">{u.username}</span>
                                                                    <span className="text-zinc-600 text-xs">{new Date(u.joinedAt).toLocaleDateString()}</span>
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
