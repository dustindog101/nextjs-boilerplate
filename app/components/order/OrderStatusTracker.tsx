"use client";
import React from 'react';
import { CheckCircleIcon, RefreshCwIcon, TruckIcon, HomeIcon } from 'lucide-react';

interface OrderStatusTrackerProps {
    status: string;
}

const TRACKING_STAGES = [
    { id: 'pending', label: 'Order Placed', icon: CheckCircleIcon },
    { id: 'processing', label: 'Processing', icon: RefreshCwIcon },
    { id: 'shipped', label: 'Shipped', icon: TruckIcon },
    { id: 'delivered', label: 'Delivered', icon: HomeIcon },
];

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status }) => {
    const currentStageIndex = TRACKING_STAGES.findIndex(stage => stage.id === status) !== -1
        ? TRACKING_STAGES.findIndex(stage => stage.id === status)
        : 0;

    return (
        <div className="glass p-6 lg:p-8 mb-8">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-8">Tracking Progress</h3>
            <div className="relative">
                <div className="absolute top-[22px] left-0 w-full h-0.5 bg-white/[0.06] hidden sm:block z-0"></div>
                <div
                    className="absolute top-[22px] left-0 h-0.5 bg-indigo-500 transition-all duration-1000 ease-in-out hidden sm:block z-0"
                    style={{ width: `${(currentStageIndex / (TRACKING_STAGES.length - 1)) * 100}%` }}
                ></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 space-y-8 sm:space-y-0">
                    {TRACKING_STAGES.map((stage, index) => {
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        const Icon = stage.icon;

                        return (
                            <div key={stage.id} className="flex sm:flex-col items-center group w-full sm:w-auto">
                                <div className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-500 ease-in-out flex-shrink-0 ${isCompleted
                                    ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)]'
                                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-500'
                                    }`}>
                                    <Icon size={18} className={`transition-transform duration-500 ${isCurrent ? 'scale-110' : ''}`} color="white" />
                                </div>
                                <div className="ml-4 sm:ml-0 sm:mt-4 flex flex-col sm:items-center">
                                    <span className={`font-semibold text-sm transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
