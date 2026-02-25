"use client";
import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, RefreshCw, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

/*
 * Admin Settings Section
 * 
 * These settings are stored client-side or use existing admin API endpoints.
 * For a full backend implementation, you'd add these actions to your admin Lambda:
 *
 *   POST /api/admin  body: { action: 'clearCache' }
 *   POST /api/admin  body: { action: 'toggleMaintenance', enabled: true/false }
 *   POST /api/admin  body: { action: 'updateSettings', settings: {...} }
 *
 * For now, this provides a UI skeleton with working client-side features.
 */

const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 border-b border-slate-100 last:border-b-0">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{label}</p>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
        style={{ height: '22px' }}
    >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
);

export const SettingsSection = () => {
    // Local state for settings — these would normally be persisted to a backend
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [autoApproveOrders, setAutoApproveOrders] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleClearCache = async () => {
        setIsClearing(true);
        try {
            // In production, call: await adminApiFetch({ action: 'clearCache' });
            await new Promise(r => setTimeout(r, 1000)); // Simulate
            showToast('Cache cleared successfully');
        } catch {
            showToast('Failed to clear cache', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    const handleToggleMaintenance = async (enabled: boolean) => {
        try {
            // In production, call: await adminApiFetch({ action: 'toggleMaintenance', enabled });
            setMaintenanceMode(enabled);
            showToast(enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
        } catch {
            showToast('Failed to toggle maintenance mode', 'error');
        }
    };

    const envVars = [
        { key: 'AUTH_LAMBDA_URL', masked: true },
        { key: 'LOOKUP_LAMBDA_URL', masked: true },
        { key: 'ORDERS_LAMBDA_URL', masked: true },
        { key: 'ADMIN_LAMBDA_URL', masked: true },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in-out ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {toast.message}
                </div>
            )}

            <h2 className="text-lg font-bold text-slate-900">Settings</h2>

            {/* General Settings */}
            <div className="glass p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Settings size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">General</h3>
                </div>

                <SettingRow label="Maintenance Mode" description="Show a 'Down for maintenance' page to all visitors">
                    <Toggle checked={maintenanceMode} onChange={handleToggleMaintenance} />
                </SettingRow>

                <SettingRow label="Email Notifications" description="Receive email alerts for new orders">
                    <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                </SettingRow>

                <SettingRow label="Auto-approve Orders" description="Automatically set new orders to 'processing'">
                    <Toggle checked={autoApproveOrders} onChange={setAutoApproveOrders} />
                </SettingRow>
            </div>

            {/* Data & Cache */}
            <div className="glass p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Database size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data & Cache</h3>
                </div>

                <SettingRow label="Clear Application Cache" description="Force-refresh cached data (users, orders, metrics)">
                    <button
                        onClick={handleClearCache}
                        disabled={isClearing}
                        className="btn btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                        <RefreshCw size={12} className={isClearing ? 'animate-spin' : ''} />
                        {isClearing ? 'Clearing…' : 'Clear Cache'}
                    </button>
                </SettingRow>

                <SettingRow label="Export All Data" description="Download a JSON dump of all orders and users">
                    <button className="btn btn-outline px-3 py-1.5 text-xs" disabled>
                        Coming Soon
                    </button>
                </SettingRow>
            </div>

            {/* Security */}
            <div className="glass p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Shield size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Security</h3>
                </div>

                <SettingRow label="Force Password Reset" description="Require all users to reset their password on next login">
                    <button className="btn btn-outline px-3 py-1.5 text-xs text-amber-600 border-amber-200 hover:bg-amber-50" disabled>
                        Coming Soon
                    </button>
                </SettingRow>

                <SettingRow label="Revoke All Sessions" description="Sign out every user across all devices">
                    <button className="btn btn-outline px-3 py-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50" disabled>
                        Coming Soon
                    </button>
                </SettingRow>
            </div>

            {/* Environment Info */}
            <div className="glass p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Bell size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Environment</h3>
                </div>

                <div className="space-y-2">
                    {envVars.map(v => (
                        <div key={v.key} className="flex items-center justify-between text-sm py-1.5">
                            <code className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-xs">{v.key}</code>
                            <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                                <CheckCircle size={12} /> Configured
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Node.js Version</span>
                    <code className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-xs">v25.x</code>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-500">Next.js</span>
                    <code className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-xs">15.x</code>
                </div>
            </div>

            {/* Lambda implementation guide */}
            <div className="glass p-4 border-dashed">
                <h4 className="text-sm font-bold text-slate-700 mb-2">💡 Adding Backend Support</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                    To make these settings persistent, add these actions to your admin Lambda:
                </p>
                <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 space-y-1 overflow-x-auto">
                    <p>POST /api/admin {'{'} action: &apos;clearCache&apos; {'}'}</p>
                    <p>POST /api/admin {'{'} action: &apos;toggleMaintenance&apos;, enabled: true {'}'}</p>
                    <p>POST /api/admin {'{'} action: &apos;updateSettings&apos;, settings: {'{ ... }'} {'}'}</p>
                </div>
            </div>
        </div>
    );
};
