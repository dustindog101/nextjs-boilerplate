"use client";
import React from 'react';
import { BoxIcon, HashIcon, CalendarIcon, DollarSignIcon } from '../icons';
import { EditIcon } from '../icons';
import { OrderDetails } from '../../../lib/types';

interface OrderSummaryCardProps {
    order: OrderDetails;
    onStartEdit: () => void;
    canEdit: boolean;
}

const statusStyles: Record<string, string> = {
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    shipped: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    processing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order, onStartEdit, canEdit }) => {
    return (
        <div className="glass p-6 lg:p-8 relative overflow-hidden group animate-fade-up">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <BoxIcon className="h-48 w-48 text-indigo-400 transform rotate-12 translate-x-10 -translate-y-10" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <HashIcon className="h-5 w-5 text-indigo-400" />
                        Order #{order.orderId}
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                </div>
                <div className={`mt-4 md:mt-0 px-4 py-1.5 rounded-full font-semibold text-xs tracking-wide uppercase border ${statusStyles[order.status] || statusStyles.pending}`}>
                    {order.status}
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/[0.06] pt-6">
                <div>
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Total Amount</p>
                    <p className="text-price text-xl font-bold flex items-center gap-1">
                        <DollarSignIcon className="h-4 w-4" />
                        {order.price?.total?.toFixed(2) || '0.00'}
                    </p>
                </div>
                <div>
                    <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">IDs Ordered</p>
                    <p className="text-white text-xl font-bold">{order.numberOfIds || order.ids.length}</p>
                </div>
                <div className="flex items-center justify-end">
                    {canEdit && (
                        <button
                            onClick={onStartEdit}
                            className="btn btn-primary px-6 py-2 text-sm flex items-center gap-2"
                        >
                            <EditIcon className="h-4 w-4" /> Edit Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
