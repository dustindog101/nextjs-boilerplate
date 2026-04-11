"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAuth } from '../../components/withAuth';
import { useAuth } from '../../hooks/useAuth';
import {
    stateOptions,
    eyeColorOptions,
    hairColorOptions,
    sexOptions,
    monthOptions,
    dayOptions,
    yearOptions,
    statePrices,
    defaultIdPrice,
    R2_MAX_UPLOAD_BYTES,
    ALLOWED_UPLOAD_IMAGE_TYPES,
} from '../../../lib/constants';
import { IdFormData } from '../../../lib/types';
import { setStorageItem } from '../../../lib/storage';
import { requestUploadPresign, uploadFileToR2 } from '../../../lib/apiClient';
import { FormInput, FormSelect, Footer, UploadSlot, UploadSlotStatus } from '../../components/ui';
import {
    PlusIcon,
    TrashIcon,
} from '../../components/icons';

/* ─── Helpers ─── */
const getPrice = (state: string) => statePrices[state] ?? defaultIdPrice;
const completionPct = (f: IdFormData) => {
    const fields = [f.firstName, f.lastName, f.streetAddress, f.city, f.zipCode, f.dobMonth, f.dobDay, f.dobYear];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
};

/* ====================================================================
   ID Form Card
   ==================================================================== */
interface IdFormProps {
    formData: IdFormData;
    index: number;
    total: number;
    onChange: (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isFile?: boolean) => void;
    getUploadSlot: (formId: number, field: 'photo' | 'signature') => { status: UploadSlotStatus; progress: number; error?: string };
    onUploadFile: (formId: number, field: 'photo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => void;
    onRetryUpload: (formId: number, field: 'photo' | 'signature') => void;
}

const IdFormCard: React.FC<IdFormProps> = ({
    formData,
    index,
    total,
    onChange,
    getUploadSlot,
    onUploadFile,
    onRetryUpload,
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(formData.id, e);
    const photoSlot = getUploadSlot(formData.id, 'photo');
    const sigSlot = getUploadSlot(formData.id, 'signature');
    const photoDisplay = formData.photoFileName || formData.photo?.name;
    const sigDisplay = formData.signatureFileName || formData.signature?.name;

    return (
        <div className="glass overflow-hidden animate-fade-up">
            {/* Form header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">ID #{index + 1}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">of {total} in this order</p>
                </div>
                <span className="text-price text-lg font-bold">${getPrice(formData.state)}</span>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
                {/* ── State Selection ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">State</h3>
                    <FormSelect name="state" value={formData.state} onChange={handleInputChange} options={stateOptions} />
                </section>

                {/* ── Personal Info ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                        <FormInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} placeholder="Optional" />
                        <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                </section>

                {/* ── Address ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Address</h3>
                    <div className="space-y-3">
                        <FormInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <FormInput label="City" name="city" value={formData.city} onChange={handleInputChange} />
                            <FormInput label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="5 digits" type="number" />
                            <FormInput label="ZIP+4" name="zipPlus4" value={formData.zipPlus4} onChange={handleInputChange} placeholder="Optional" type="number" />
                        </div>
                    </div>
                </section>

                {/* ── Dates ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Dates</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-label block mb-2">Date of Birth</label>
                            <div className="grid grid-cols-3 gap-2">
                                <FormSelect name="dobMonth" value={formData.dobMonth} onChange={handleInputChange} options={monthOptions} />
                                <FormSelect name="dobDay" value={formData.dobDay} onChange={handleInputChange} options={dayOptions} />
                                <FormSelect name="dobYear" value={formData.dobYear} onChange={handleInputChange} options={yearOptions} />
                            </div>
                        </div>
                        <div>
                            <label className="text-label block mb-2">Issue Date</label>
                            <div className="grid grid-cols-3 gap-2">
                                <FormSelect name="issueMonth" value={formData.issueMonth} onChange={handleInputChange} options={monthOptions} />
                                <FormSelect name="issueDay" value={formData.issueDay} onChange={handleInputChange} options={dayOptions} />
                                <FormSelect name="issueYear" value={formData.issueYear} onChange={handleInputChange} options={yearOptions} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Physical Description ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Physical Description</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <FormSelect label="Sex" name="sex" value={formData.sex} onChange={handleInputChange} options={sexOptions} />
                        <div>
                            <label className="text-label block mb-2">Height</label>
                            <div className="grid grid-cols-2 gap-2">
                                <FormInput name="heightFeet" value={formData.heightFeet} onChange={handleInputChange} placeholder="ft" type="number" />
                                <FormInput name="heightInches" value={formData.heightInches} onChange={handleInputChange} placeholder="in" type="number" />
                            </div>
                        </div>
                        <FormInput label="Weight (lbs)" name="weight" value={formData.weight} onChange={handleInputChange} type="number" />
                        <FormSelect label="Eye Color" name="eyeColor" value={formData.eyeColor} onChange={handleInputChange} options={eyeColorOptions} />
                    </div>
                    <div className="mt-3 w-full sm:w-1/4">
                        <FormSelect label="Hair Color" name="hairColor" value={formData.hairColor} onChange={handleInputChange} options={hairColorOptions} />
                    </div>
                </section>

                {/* ── Uploads ── */}
                <section>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Uploads</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <UploadSlot
                            label="Photo"
                            name="photo"
                            status={photoSlot.status}
                            progress={photoSlot.progress}
                            error={photoSlot.error}
                            displayName={photoDisplay}
                            onFileChange={(e) => onUploadFile(formData.id, 'photo', e)}
                            onRetry={() => onRetryUpload(formData.id, 'photo')}
                        />
                        <UploadSlot
                            label="Signature"
                            name="signature"
                            status={sigSlot.status}
                            progress={sigSlot.progress}
                            error={sigSlot.error}
                            displayName={sigDisplay}
                            onFileChange={(e) => onUploadFile(formData.id, 'signature', e)}
                            onRetry={() => onRetryUpload(formData.id, 'signature')}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

/* ====================================================================
   Main Page
   ==================================================================== */
function OrderFormPage() {
    const router = useRouter();
    const { token } = useAuth();

    const slotKey = (formId: number, field: 'photo' | 'signature') => `${formId}-${field}`;

    const [uploadSlots, setUploadSlots] = useState<
        Record<string, { status: UploadSlotStatus; progress: number; error?: string }>
    >({});

    const getUploadSlot = (formId: number, field: 'photo' | 'signature') =>
        uploadSlots[slotKey(formId, field)] ?? { status: 'idle' as const, progress: 0 };

    const onRetryUpload = (formId: number, field: 'photo' | 'signature') => {
        setUploadSlots((s) => {
            const next = { ...s };
            delete next[slotKey(formId, field)];
            return next;
        });
    };

    const onUploadFile = async (formId: number, field: 'photo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!token) {
            setError('Please log in to upload images.');
            return;
        }
        const allowed = ALLOWED_UPLOAD_IMAGE_TYPES as readonly string[];
        if (!allowed.includes(file.type)) {
            setUploadSlots((s) => ({
                ...s,
                [slotKey(formId, field)]: { status: 'error', progress: 0, error: 'Use JPEG, PNG, or WebP.' },
            }));
            return;
        }
        if (file.size > R2_MAX_UPLOAD_BYTES) {
            setUploadSlots((s) => ({
                ...s,
                [slotKey(formId, field)]: { status: 'error', progress: 0, error: 'Max file size is 5 MB.' },
            }));
            return;
        }

        const sk = slotKey(formId, field);
        setUploadSlots((s) => ({ ...s, [sk]: { status: 'presigning', progress: 0 } }));

        try {
            const presign = await requestUploadPresign({
                contentType: file.type,
                kind: field,
                idFormClientId: formId,
                fileSize: file.size,
            });
            setUploadSlots((s) => ({ ...s, [sk]: { status: 'uploading', progress: 0 } }));
            await uploadFileToR2(presign, file, (p) =>
                setUploadSlots((s) => ({ ...s, [sk]: { ...s[sk], status: 'uploading', progress: p } }))
            );
            setIdForms((prev) =>
                prev.map((f) =>
                    f.id === formId
                        ? {
                              ...f,
                              photo: field === 'photo' ? undefined : f.photo,
                              signature: field === 'signature' ? undefined : f.signature,
                              photoKey: field === 'photo' ? presign.key : f.photoKey,
                              signatureKey: field === 'signature' ? presign.key : f.signatureKey,
                              photoFileName: field === 'photo' ? file.name : f.photoFileName,
                              signatureFileName: field === 'signature' ? file.name : f.signatureFileName,
                          }
                        : f
                )
            );
            setUploadSlots((s) => ({ ...s, [sk]: { status: 'done', progress: 100 } }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Upload failed.';
            setUploadSlots((s) => ({ ...s, [sk]: { status: 'error', progress: 0, error: message } }));
        }
    };

    const createNewIdForm = (): IdFormData => ({
        id: Date.now(),
        state: stateOptions[0],
        dobMonth: '01', dobDay: '01', dobYear: '2000',
        issueMonth: '01', issueDay: '01', issueYear: String(new Date().getFullYear()),
        firstName: '', middleName: '', lastName: '',
        streetAddress: '', city: '', zipCode: '', zipPlus4: '',
        heightFeet: '', heightInches: '', weight: '',
        eyeColor: eyeColorOptions[0], hairColor: hairColorOptions[0], sex: sexOptions[0],
    });

    const [idForms, setIdForms] = useState<IdFormData[]>([createNewIdForm()]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    /* ── Actions ── */
    const addIdForm = () => {
        const newForm = createNewIdForm();
        setIdForms(prev => [...prev, newForm]);
        setActiveIndex(idForms.length); // go to the new one
    };

    const removeIdForm = (idx: number) => {
        if (idForms.length <= 1) return;
        setIdForms(prev => prev.filter((_, i) => i !== idx));
        setActiveIndex(prev => Math.min(prev, idForms.length - 2));
    };

    const handleFormChange = (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, isFile = false) => {
        setIdForms(prev => prev.map(form => {
            if (form.id === id) {
                if (isFile) {
                    const target = e.target as HTMLInputElement;
                    return { ...form, [target.name]: target.files ? target.files[0] : undefined };
                }
                return { ...form, [e.target.name]: e.target.value };
            }
            return form;
        }));
    };

    const handleProceedToCheckout = () => {
        if (idForms.length === 0) { setError('Add at least one ID.'); return; }
        const incomplete = idForms.findIndex(f => !f.firstName || !f.lastName || !f.streetAddress || !f.city || !f.zipCode);
        if (incomplete !== -1) {
            setActiveIndex(incomplete);
            setError(`ID #${incomplete + 1} is missing required fields.`);
            return;
        }
        const missingUpload = idForms.findIndex((f) => !f.photoKey || !f.signatureKey);
        if (missingUpload !== -1) {
            setActiveIndex(missingUpload);
            setError(`ID #${missingUpload + 1}: upload both photo and signature.`);
            return;
        }
        const uploadBusy = Object.values(uploadSlots).some(
            (s) => s.status === 'presigning' || s.status === 'uploading'
        );
        if (uploadBusy) {
            setError('Wait for uploads to finish.');
            return;
        }
        setError(null);
        const idFormsForStorage = idForms.map(({ photo, signature, ...rest }) => rest);
        try {
            setStorageItem('idPirateOrderForms', JSON.stringify(idFormsForStorage));
            router.push('/checkout');
        } catch (err) {
            console.error('Failed to save:', err);
            setError('Could not proceed to checkout. Please try again.');
        }
    };

    const total = idForms.reduce((sum, f) => sum + getPrice(f.state), 0);
    const activeForm = idForms[activeIndex];

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex-grow flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">

                {/* ══════════════════════════════════════════════
                    SIDEBAR — desktop only (lg+)
                   ══════════════════════════════════════════════ */}
                <aside className="hidden lg:flex flex-col w-72 xl:w-80 border-r border-white/[0.06] sticky top-16 h-[calc(100vh-4rem)]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-3">
                            IDs in Order ({idForms.length})
                        </h3>
                        {idForms.map((form, i) => {
                            const pct = completionPct(form);
                            return (
                                <button
                                    key={form.id}
                                    onClick={() => setActiveIndex(i)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer
                                        ${activeIndex === i
                                            ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {/* Completion dot */}
                                    <span className={`h-2 w-2 rounded-full flex-shrink-0
                                        ${pct === 100 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-zinc-600'}`}
                                    />
                                    <span className="flex-1 text-left truncate">
                                        ID #{i + 1} · {form.state || 'New'}
                                    </span>
                                    <span className="text-xs text-zinc-500">${getPrice(form.state)}</span>
                                    {idForms.length > 1 && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); removeIdForm(i); }}
                                            className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                        <button
                            onClick={addIdForm}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all cursor-pointer"
                        >
                            <PlusIcon className="h-4 w-4" /> Add Another ID
                        </button>
                    </div>

                    {/* Sidebar footer — total + checkout */}
                    <div className="border-t border-white/[0.06] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">{idForms.length} ID{idForms.length !== 1 ? 's' : ''}</span>
                            <span className="text-price text-xl font-bold">${total}</span>
                        </div>
                        <button
                            onClick={handleProceedToCheckout}
                            className="btn btn-primary w-full py-3 text-sm font-semibold"
                        >
                            Proceed to Checkout →
                        </button>
                    </div>
                </aside>

                {/* ══════════════════════════════════════════════
                    MOBILE NAV STRIP (< lg)
                   ══════════════════════════════════════════════ */}
                <div className="lg:hidden sticky top-16 z-30 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 px-4 py-3">
                        {/* Prev */}
                        <button
                            onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                            disabled={activeIndex === 0}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        {/* ID pills — scrollable */}
                        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {idForms.map((form, i) => {
                                const pct = completionPct(form);
                                return (
                                    <button
                                        key={form.id}
                                        onClick={() => setActiveIndex(i)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer
                                            ${activeIndex === i
                                                ? 'bg-indigo-500/15 text-white border border-indigo-500/25'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full
                                            ${pct === 100 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-zinc-600'}`}
                                        />
                                        #{i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next */}
                        <button
                            onClick={() => setActiveIndex(i => Math.min(idForms.length - 1, i + 1))}
                            disabled={activeIndex === idForms.length - 1}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        {/* Add */}
                        <button
                            onClick={addIdForm}
                            className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all flex-shrink-0 cursor-pointer"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    MAIN FORM AREA
                   ══════════════════════════════════════════════ */}
                <main className="flex-1 flex flex-col">
                    <div className="p-4 sm:p-6 lg:p-8 flex-grow">
                        {/* Error banner */}
                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between animate-fade-up">
                                <span>{error}</span>
                                <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 ml-3 cursor-pointer">✕</button>
                            </div>
                        )}

                        {/* Active form */}
                        {activeForm && (
                            <IdFormCard
                                formData={activeForm}
                                index={activeIndex}
                                total={idForms.length}
                                onChange={handleFormChange}
                                getUploadSlot={getUploadSlot}
                                onUploadFile={onUploadFile}
                                onRetryUpload={onRetryUpload}
                            />
                        )}

                        {/* Mobile: remove button */}
                        {idForms.length > 1 && (
                            <div className="lg:hidden mt-3">
                                <button
                                    onClick={() => removeIdForm(activeIndex)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 border border-white/[0.06] transition-all cursor-pointer"
                                >
                                    Remove ID #{activeIndex + 1}
                                </button>
                            </div>
                        )}
                    </div>

                    <Footer className="w-full" />
                </main>
            </div>

            {/* ══════════════════════════════════════════════
                MOBILE BOTTOM BAR
               ══════════════════════════════════════════════ */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg)]/90 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <span className="text-xs text-zinc-500">{idForms.length} ID{idForms.length !== 1 ? 's' : ''}</span>
                        <span className="text-price text-lg font-bold ml-2">${total}</span>
                    </div>
                    <button
                        onClick={handleProceedToCheckout}
                        className="btn btn-primary py-2.5 px-6 text-sm font-semibold"
                    >
                        Checkout →
                    </button>
                </div>
            </div>

            {/* Bottom spacer so content isn't hidden behind fixed bar on mobile */}
            <div className="lg:hidden h-16" />
        </div>
    );
}

export default withAuth(OrderFormPage);