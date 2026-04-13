"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    stateOptions,
    eyeColorOptions,
    hairColorOptions,
    sexOptions,
    monthOptions,
    dayOptions,
    yearOptions,
    handlingFee as HANDLING_FEE,
    shippingFee as SHIPPING_FEE,
    R2_MAX_UPLOAD_BYTES,
    STORAGE_UPLOAD_CONTENT_TYPE,
} from '@/lib/constants';
import { prepareImageForUpload } from '@/lib/imagePrepare';
import { invalidateViewCacheForKey } from '@/lib/viewImageCache';
import { IdFormData } from '@/lib/types';
import {
    submitOrder,
    createResellerUploadSession,
    requestUploadPresign,
    uploadFileToR2,
    deleteUploadedObject,
} from '@/lib/apiClient';
import { userFacingUploadError } from '@/lib/uploadUserMessage';
import {
    readResellerTheme,
    writeResellerTheme,
    loadResellerDraft,
    saveResellerDraft,
    clearResellerDraft,
    serializeIdForms,
    reviveIdForm,
    buildUploadSlotsFromForms,
    RESELLER_DRAFT_MAX_AGE_MS,
} from '@/lib/resellerPortalStorage';
import { UploadSlot, ImageLightbox, type UploadSlotStatus } from '@/app/components/ui';
import {
    ShieldCheck, Plus, Trash2, CheckCircle2, ChevronRight,
    ChevronLeft, MapPin, Truck, Moon, Sun
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pass explicit `id` so SSR and client hydration match (avoid Date.now() in initial state). */
const createNewIdForm = (id: number): IdFormData => ({
    id,
    state: stateOptions[0],
    dobMonth: '01', dobDay: '01', dobYear: '2000',
    issueMonth: '01', issueDay: '01', issueYear: String(new Date().getFullYear()),
    firstName: '', middleName: '', lastName: '',
    streetAddress: '', city: '', zipCode: '', zipPlus4: '',
    heightFeet: '', heightInches: '', weight: '',
    eyeColor: eyeColorOptions[0], hairColor: hairColorOptions[0], sex: sexOptions[0],
});

// ─── Styles helper (light/dark) ───────────────────────────────────────────────

function useStyles(dark: boolean) {
    const bg = dark ? 'bg-[#0f0f13]' : 'bg-slate-50';
    const surface = dark ? 'bg-[#1a1a22] border-white/[0.06]' : 'bg-white border-slate-200';
    const text = dark ? 'text-white' : 'text-slate-900';
    const subtext = dark ? 'text-zinc-400' : 'text-slate-500';
    const label = dark ? 'text-zinc-400 text-xs font-semibold uppercase tracking-wider' : 'text-slate-500 text-xs font-semibold uppercase tracking-wider';
    const fieldLabel = dark ? 'text-zinc-400 text-xs font-medium' : 'text-slate-500 text-xs font-medium';
    const input = dark
        ? 'w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 focus:outline-none transition-all'
        : 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all';
    const select = input;
    const divider = dark ? 'border-white/[0.06]' : 'border-slate-100';
    const pill = dark ? 'bg-white/[0.06] border-white/[0.06] text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600';
    const pillActive = dark ? 'bg-indigo-500/20 border-indigo-500/40 text-white' : 'bg-blue-50 border-blue-300 text-blue-700';
    const card = `${surface} rounded-2xl border`;
    const header = dark ? 'bg-[#0f0f13]/80 border-white/[0.06]' : 'bg-white/80 border-slate-200';
    return { bg, text, subtext, label, fieldLabel, input, select, divider, pill, pillActive, card, header };
}

// ─── Form Field ───────────────────────────────────────────────────────────────

const Field: React.FC<{
    label?: string; name: string; value: string; onChange: (e: any) => void;
    type?: string; placeholder?: string; inputCls: string; labelCls: string;
    min?: string | number; max?: string | number;
}> = ({ label, name, value, onChange, type = 'text', placeholder, inputCls, labelCls, min, max }) => (
    <div>
        {label && <label className={`${labelCls} block mb-1.5`}>{label}</label>}
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={inputCls} min={min} max={max} />
    </div>
);

const SelectField: React.FC<{
    label?: string; name: string; value: string; onChange: (e: any) => void;
    options: string[]; inputCls: string; labelCls: string;
}> = ({ label, name, value, onChange, options, inputCls, labelCls }) => (
    <div>
        {label && <label className={`${labelCls} block mb-1.5`}>{label}</label>}
        <select name={name} value={value} onChange={onChange} className={inputCls}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

// ─── ID Card Form ─────────────────────────────────────────────────────────────

interface IdCardProps {
    form: IdFormData;
    onChange: (id: number, e: any) => void;
    getUploadSlot: (formId: number, field: 'photo' | 'signature') => { status: UploadSlotStatus; progress: number; error?: string };
    getPreviewUrl: (formId: number, field: 'photo' | 'signature') => string | undefined;
    onOpenPreview: (formId: number, field: 'photo' | 'signature') => void;
    onUploadFile: (formId: number, field: 'photo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => void;
    onRetryUpload: (formId: number, field: 'photo' | 'signature') => void | Promise<void>;
    onSignatureFile: (formId: number, file: File) => void | Promise<void>;
    s: ReturnType<typeof useStyles>;
    uploadAppearance: 'dark' | 'light';
}

const IdCard: React.FC<IdCardProps> = ({
    form,
    onChange,
    getUploadSlot,
    getPreviewUrl,
    onOpenPreview,
    onUploadFile,
    onRetryUpload,
    onSignatureFile,
    s,
    uploadAppearance,
}) => {
    const onField = (e: any) => onChange(form.id, e);
    const photoSlot = getUploadSlot(form.id, 'photo');
    const sigSlot = getUploadSlot(form.id, 'signature');
    const photoDisplay = form.photoFileName || form.photo?.name;
    const sigDisplay = form.signatureFileName || form.signature?.name;

    return (
        <div className="space-y-5">
            {/* State */}
            <SelectField label="State" name="state" value={form.state} onChange={onField}
                options={stateOptions} inputCls={s.input} labelCls={s.fieldLabel} />

            {/* Name */}
            <div>
                <label className={`${s.label} block mb-2`}>Personal Information</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="First" name="firstName" value={form.firstName} onChange={onField} inputCls={s.input} labelCls={s.fieldLabel} />
                    <Field label="Middle" name="middleName" value={form.middleName} onChange={onField} placeholder="Optional" inputCls={s.input} labelCls={s.fieldLabel} />
                    <Field label="Last" name="lastName" value={form.lastName} onChange={onField} inputCls={s.input} labelCls={s.fieldLabel} />
                </div>
            </div>

            {/* Address on ID */}
            <div>
                <label className={`${s.fieldLabel} block mb-2`}>ID Address</label>
                <div className="space-y-3">
                    <Field name="streetAddress" value={form.streetAddress} onChange={onField} placeholder="Street Address" inputCls={s.input} labelCls={s.fieldLabel} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field name="city" value={form.city} onChange={onField} placeholder="City" inputCls={s.input} labelCls={s.fieldLabel} />
                        <Field name="zipCode" value={form.zipCode} onChange={onField} placeholder="ZIP" type="number" inputCls={s.input} labelCls={s.fieldLabel} />
                        <Field name="zipPlus4" value={form.zipPlus4} onChange={onField} placeholder="ZIP+4 (opt.)" type="number" inputCls={s.input} labelCls={s.fieldLabel} />
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div>
                <label className={`${s.label} block mb-2`}>Dates</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={`${s.subtext} text-xs font-medium block mb-1.5`}>Date of Birth</label>
                        <div className="grid grid-cols-3 gap-2">
                            <SelectField name="dobMonth" value={form.dobMonth} onChange={onField} options={monthOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                            <SelectField name="dobDay" value={form.dobDay} onChange={onField} options={dayOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                            <SelectField name="dobYear" value={form.dobYear} onChange={onField} options={yearOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                        </div>
                    </div>
                    <div>
                        <label className={`${s.subtext} text-xs font-medium block mb-1.5`}>Issue Date</label>
                        <div className="grid grid-cols-3 gap-2">
                            <SelectField name="issueMonth" value={form.issueMonth} onChange={onField} options={monthOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                            <SelectField name="issueDay" value={form.issueDay} onChange={onField} options={dayOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                            <SelectField name="issueYear" value={form.issueYear} onChange={onField} options={yearOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Physical */}
            <div>
                <label className={`${s.label} block mb-2`}>Physical Description</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SelectField label="Sex" name="sex" value={form.sex} onChange={onField} options={sexOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                    <div>
                        <label className={`${s.fieldLabel} block mb-1.5`}>Height</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <Field name="heightFeet" value={form.heightFeet} onChange={onField} placeholder="ft" type="number" min="4" max="7" inputCls={s.input} labelCls={s.fieldLabel} />
                            <Field name="heightInches" value={form.heightInches} onChange={onField} placeholder="in" type="number" min="0" max="12" inputCls={s.input} labelCls={s.fieldLabel} />
                        </div>
                    </div>
                    <Field label="Weight (lbs)" name="weight" value={form.weight} onChange={onField} type="number" inputCls={s.input} labelCls={s.fieldLabel} />
                    <SelectField label="Eye Color" name="eyeColor" value={form.eyeColor} onChange={onField} options={eyeColorOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                </div>
                <div className="mt-3 w-full sm:w-1/4">
                    <SelectField label="Hair Color" name="hairColor" value={form.hairColor} onChange={onField} options={hairColorOptions} inputCls={s.select} labelCls={s.fieldLabel} />
                </div>
            </div>

            {/* Uploads */}
            <div>
                <label className={`${s.label} block mb-2`}>Photo & Signature</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <UploadSlot
                        label="Photo"
                        name="photo"
                        status={photoSlot.status}
                        progress={photoSlot.progress}
                        error={photoSlot.error}
                        displayName={photoDisplay}
                        previewUrl={getPreviewUrl(form.id, 'photo')}
                        onPreviewOpen={() => onOpenPreview(form.id, 'photo')}
                        onFileChange={(e) => onUploadFile(form.id, 'photo', e)}
                        onRetry={() => void onRetryUpload(form.id, 'photo')}
                        appearance={uploadAppearance}
                    />
                    <UploadSlot
                        label="Signature"
                        name="signature"
                        status={sigSlot.status}
                        progress={sigSlot.progress}
                        error={sigSlot.error}
                        displayName={sigDisplay}
                        previewUrl={getPreviewUrl(form.id, 'signature')}
                        onPreviewOpen={() => onOpenPreview(form.id, 'signature')}
                        onFileChange={(e) => onUploadFile(form.id, 'signature', e)}
                        onRetry={() => void onRetryUpload(form.id, 'signature')}
                        onSignatureFile={(file) => void onSignatureFile(form.id, file)}
                        appearance={uploadAppearance}
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResellerPortalPage() {
    const params = useParams();
    const resellerId = params?.resellerId as string;

    // Theme — default false on server + first client paint; persist across reseller pages via storage.
    const [dark, setDark] = useState(false);
    const themeHydratedRef = useRef(false);
    useEffect(() => {
        const stored = readResellerTheme();
        if (stored === 'dark') setDark(true);
        else if (stored === 'light') setDark(false);
        else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }, []);
    useEffect(() => {
        if (!themeHydratedRef.current) {
            themeHydratedRef.current = true;
            return;
        }
        writeResellerTheme(dark ? 'dark' : 'light');
    }, [dark]);
    const s = useStyles(dark);

    // IDs: stable id=1 for initial row so server HTML matches hydrated client (no Date.now in useState).
    const nextFormIdRef = useRef(2);
    const [idForms, setIdForms] = useState<IdFormData[]>(() => [createNewIdForm(1)]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const uploadTokenRef = useRef<string | null>(null);
    const [uploadSessionReady, setUploadSessionReady] = useState(false);
    const [uploadSessionError, setUploadSessionError] = useState<string | null>(null);
    const [uploadSlots, setUploadSlots] = useState<
        Record<string, { status: UploadSlotStatus; progress: number; error?: string }>
    >({});
    const [slotPreviewUrls, setSlotPreviewUrls] = useState<Record<string, string>>({});
    const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

    const slotKey = (formId: number, field: 'photo' | 'signature') => `${formId}-${field}`;
    const getUploadSlot = (formId: number, field: 'photo' | 'signature') =>
        uploadSlots[slotKey(formId, field)] ?? { status: 'idle' as const, progress: 0 };

    const getPreviewUrl = (formId: number, field: 'photo' | 'signature') =>
        slotPreviewUrls[slotKey(formId, field)];

    const onOpenPreview = (formId: number, field: 'photo' | 'signature') => {
        const u = slotPreviewUrls[slotKey(formId, field)];
        if (u) setLightbox({ url: u, label: field === 'photo' ? 'Photo' : 'Signature' });
    };

    const onRetryUpload = async (formId: number, field: 'photo' | 'signature') => {
        const sk = slotKey(formId, field);
        const form = idForms.find((f) => f.id === formId);
        const objectKey = field === 'photo' ? form?.photoKey : form?.signatureKey;
        const tok = uploadTokenRef.current;
        if (objectKey && tok) {
            try {
                await deleteUploadedObject(objectKey, { resellerUploadToken: tok });
                invalidateViewCacheForKey(objectKey);
            } catch {
                /* clear local state even if delete fails */
            }
        }
        setSlotPreviewUrls((p) => {
            const prev = p[sk];
            if (prev) URL.revokeObjectURL(prev);
            const n = { ...p };
            delete n[sk];
            return n;
        });
        setUploadSlots((s) => {
            const next = { ...s };
            delete next[sk];
            return next;
        });
        setIdForms((prev) =>
            prev.map((f) => {
                if (f.id !== formId) return f;
                return {
                    ...f,
                    photoKey: field === 'photo' ? undefined : f.photoKey,
                    signatureKey: field === 'signature' ? undefined : f.signatureKey,
                    photoFileName: field === 'photo' ? undefined : f.photoFileName,
                    signatureFileName: field === 'signature' ? undefined : f.signatureFileName,
                };
            })
        );
    };

    useEffect(() => {
        if (!resellerId) return;
        let cancelled = false;
        setUploadSessionError(null);
        setUploadSessionReady(false);
        uploadTokenRef.current = null;
        (async () => {
            try {
                const { token } = await createResellerUploadSession(resellerId);
                if (!cancelled) {
                    uploadTokenRef.current = token;
                    setUploadSessionReady(true);
                }
            } catch (e) {
                if (!cancelled) {
                    setUploadSessionError(
                        e instanceof Error ? e.message : 'Could not verify reseller link for uploads.'
                    );
                    setUploadSessionReady(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resellerId]);

    const uploadFromFile = async (formId: number, field: 'photo' | 'signature', file: File) => {
        const tok = uploadTokenRef.current;
        if (!tok) {
            setError('Upload session not ready. Refresh the page.');
            return;
        }

        if (file.size > R2_MAX_UPLOAD_BYTES) {
            setUploadSlots((s) => ({
                ...s,
                [slotKey(formId, field)]: {
                    status: 'error',
                    progress: 0,
                    error: userFacingUploadError(new Error('FILE_RAW_TOO_LARGE')),
                },
            }));
            return;
        }

        const sk = slotKey(formId, field);
        setUploadSlots((s) => ({ ...s, [sk]: { status: 'presigning', progress: 0 } }));

        try {
            const prepared = await prepareImageForUpload(file);
            const preview = URL.createObjectURL(prepared);
            setSlotPreviewUrls((p) => {
                const n = { ...p };
                const old = n[sk];
                if (old) URL.revokeObjectURL(old);
                n[sk] = preview;
                return n;
            });
            const presign = await requestUploadPresign(
                {
                    contentType: STORAGE_UPLOAD_CONTENT_TYPE,
                    kind: field,
                    idFormClientId: formId,
                    fileSize: prepared.size,
                },
                { resellerUploadToken: tok }
            );
            setUploadSlots((s) => ({ ...s, [sk]: { status: 'uploading', progress: 0 } }));
            await uploadFileToR2(presign, prepared, (p) =>
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
                              photoFileName: field === 'photo' ? prepared.name : f.photoFileName,
                              signatureFileName: field === 'signature' ? prepared.name : f.signatureFileName,
                          }
                        : f
                )
            );
            setUploadSlots((s) => ({ ...s, [sk]: { status: 'done', progress: 100 } }));
        } catch (err: unknown) {
            setSlotPreviewUrls((p) => {
                const u = p[sk];
                if (u) URL.revokeObjectURL(u);
                const n = { ...p };
                delete n[sk];
                return n;
            });
            setUploadSlots((s) => ({
                ...s,
                [sk]: { status: 'error', progress: 0, error: userFacingUploadError(err) },
            }));
        }
    };

    const onUploadFile = async (formId: number, field: 'photo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        await uploadFromFile(formId, field, file);
    };

    // Shipping
    const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'ship'>('pickup');
    const [shipName, setShipName] = useState('');
    const [shipStreet, setShipStreet] = useState('');
    const [shipCity, setShipCity] = useState('');
    const [shipState, setShipState] = useState('');
    const [shipZip, setShipZip] = useState('');

    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [successOrderId, setSuccessOrderId] = useState('');
    const [portalHydrated, setPortalHydrated] = useState(false);

    const shipping = deliveryMode === 'ship' ? SHIPPING_FEE : 0;
    const fees = HANDLING_FEE + shipping;

    const uploadsIncomplete =
        idForms.length > 0 && idForms.some((f) => !f.photoKey || !f.signatureKey);
    const uploadBusy = Object.values(uploadSlots).some(
        (s) => s.status === 'presigning' || s.status === 'uploading'
    );

    // Restore in-progress draft (same reseller link, within TTL). Cleared on successful submit.
    useEffect(() => {
        if (!resellerId) return;
        const d = loadResellerDraft(resellerId);
        if (d && Date.now() - d.savedAt < RESELLER_DRAFT_MAX_AGE_MS && d.idForms.length > 0) {
            const forms = d.idForms.map(reviveIdForm);
            setIdForms(forms);
            setActiveIndex(Math.min(d.activeIndex, Math.max(0, forms.length - 1)));
            const maxId = Math.max(...forms.map((f) => f.id));
            nextFormIdRef.current = Math.max(d.nextFormId, maxId + 1);
            setDeliveryMode(d.deliveryMode);
            setShipName(d.shipName);
            setShipStreet(d.shipStreet);
            setShipCity(d.shipCity);
            setShipState(d.shipState);
            setShipZip(d.shipZip);
            setNotes(d.notes);
            setUploadSlots(buildUploadSlotsFromForms(forms));
        }
        setPortalHydrated(true);
    }, [resellerId]);

    useEffect(() => {
        if (!resellerId || !portalHydrated) return;
        if (status === 'success') return;
        const t = window.setTimeout(() => {
            saveResellerDraft(resellerId, {
                idForms: serializeIdForms(idForms),
                activeIndex,
                nextFormId: nextFormIdRef.current,
                deliveryMode,
                shipName,
                shipStreet,
                shipCity,
                shipState,
                shipZip,
                notes,
            });
        }, 450);
        return () => window.clearTimeout(t);
    }, [
        resellerId,
        portalHydrated,
        idForms,
        activeIndex,
        deliveryMode,
        shipName,
        shipStreet,
        shipCity,
        shipState,
        shipZip,
        notes,
        status,
    ]);

    // ── ID Actions ──────────────────────────────────────────────────────────

    const addForm = () => {
        const next = createNewIdForm(nextFormIdRef.current++);
        setIdForms(prev => [...prev, next]);
        setActiveIndex(idForms.length);
    };

    const removeForm = (idx: number) => {
        if (idForms.length <= 1) return;
        const removed = idForms[idx];
        if (removed) {
            setSlotPreviewUrls((p) => {
                const n = { ...p };
                for (const field of ['photo', 'signature'] as const) {
                    const k = slotKey(removed.id, field);
                    const u = n[k];
                    if (u) URL.revokeObjectURL(u);
                    delete n[k];
                }
                return n;
            });
        }
        setIdForms((prev) => prev.filter((_, i) => i !== idx));
        setActiveIndex(Math.min(activeIndex, idForms.length - 2));
    };

    const handleChange = (id: number, e: any) => {
        setIdForms(prev => prev.map(f => {
            if (f.id !== id) return f;
            return { ...f, [e.target.name]: e.target.value };
        }));
    };

    // ── Submit ──────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!resellerId) { setError('Invalid link.'); return; }
        const incomplete = idForms.findIndex(f => !f.firstName || !f.lastName || !f.streetAddress || !f.city || !f.zipCode);
        if (incomplete !== -1) { setActiveIndex(incomplete); setError(`ID #${incomplete + 1} is missing required fields.`); return; }
        if (deliveryMode === 'ship' && (!shipName || !shipStreet || !shipCity || !shipState || !shipZip)) {
            setError('Please complete your shipping address.'); return;
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
        if (!uploadSessionReady || uploadSessionError) {
            setError('Upload session not ready. Refresh or try again later.');
            return;
        }

        setStatus('loading'); setError(null);

        const shippingAddress = deliveryMode === 'ship'
            ? `${shipName}, ${shipStreet}, ${shipCity}, ${shipState} ${shipZip}`
            : 'Local Pickup';

        const idsPayload = idForms.map(({ id, photo, signature, ...rest }) => ({
            ...rest,
            dob: `${rest.dobYear}-${rest.dobMonth}-${rest.dobDay}`,
            issueDate: `${rest.issueYear}-${rest.issueMonth}-${rest.issueDay}`,
        }));

        try {
            const data = await submitOrder({
                userId: resellerId,
                resellerId,
                source: 'reseller_portal',
                shipping: shippingAddress,
                paymentMethod: 'Pay Later',
                notes,
                price: { total: fees },
                ids: idsPayload,
            });
            setSuccessOrderId(data.orderId);
            setStatus('success');
            clearResellerDraft(resellerId);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
            setStatus('error');
        }
    };

    // ── Success ─────────────────────────────────────────────────────────────

    if (status === 'success') {
        return (
            <div className={`${s.bg} min-h-screen flex items-center justify-center p-6`}>
                <div className={`${s.card} p-10 max-w-md w-full text-center`}>
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-5" />
                    <h1 className={`${s.text} text-2xl font-bold mb-2`}>Order Placed!</h1>
                    <p className={`${s.subtext} mb-4 text-sm`}>Your order has been received and is now being processed.</p>
                    <p className={`text-xs font-mono px-3 py-2 rounded-lg mb-5 ${dark ? 'bg-white/[0.05] text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                        Order ID: {successOrderId}
                    </p>
                    <Link
                        href={`/track?orderId=${encodeURIComponent(successOrderId)}`}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all mb-4 ${dark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        Track Your Order
                    </Link>
                    <p className={`${s.subtext} text-xs mb-5`}>Your reseller will be in touch with payment details.</p>
                    <Link
                        href="/"
                        className={`w-full py-3 rounded-xl font-medium text-sm text-center transition-all border ${dark ? 'border-white/[0.12] text-zinc-200 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                        Back to checkout
                    </Link>
                </div>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────

    const activeForm = idForms[activeIndex];

    return (
        <div className={`${s.bg} min-h-screen transition-colors duration-200`}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <header className={`sticky top-0 z-30 ${s.header} backdrop-blur-xl border-b`}>
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-500" />
                        <span className={`${s.text} text-sm font-semibold`}>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/track"
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${dark ? 'border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                            Track Order
                        </Link>
                        <span className={`${s.subtext} text-xs`}>{idForms.length} ID{idForms.length !== 1 ? 's' : ''}</span>
                        <button onClick={() => setDark(d => !d)} className={`p-2 rounded-lg ${dark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'} transition-all`}>
                            {dark ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 pb-32 pt-6 space-y-4">

                {/* ── Error Banner ─────────────────────────────────────── */}
                {(error || uploadSessionError) && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex flex-col sm:flex-row sm:items-start gap-2 justify-between">
                        <span className="text-left flex-1 min-w-0 whitespace-pre-wrap break-words">
                            {error || uploadSessionError}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setUploadSessionError(null);
                            }}
                            className="flex-shrink-0 opacity-60 hover:opacity-100 self-end sm:self-start"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── ID Tabs ───────────────────────────────────────────── */}
                <div className={`${s.card} overflow-hidden`}>
                    {/* Tab strip */}
                    <div className={`flex items-center gap-2 px-4 py-3 border-b ${s.divider} overflow-x-auto no-scrollbar`}>
                        {idForms.map((f, i) => (
                            <button
                                key={f.id}
                                onClick={() => setActiveIndex(i)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-all ${activeIndex === i ? s.pillActive : s.pill}`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${f.firstName ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                                ID #{i + 1}
                                {idForms.length > 1 && (
                                    <span onClick={e => { e.stopPropagation(); removeForm(i); }} className="ml-0.5 opacity-40 hover:opacity-100">
                                        <Trash2 size={10} />
                                    </span>
                                )}
                            </button>
                        ))}
                        <button onClick={addForm} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${dark ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-blue-600 hover:bg-blue-50'} transition-all`}>
                            <Plus size={12} /> Add ID
                        </button>
                    </div>

                    {/* ID label strip — no price shown */}
                    <div className={`px-4 py-2 border-b ${s.divider}`}>
                        <span className={`${s.subtext} text-xs`}>ID #{activeIndex + 1} · {activeForm.state}</span>
                    </div>

                    {/* Form */}
                    <div className="p-4 sm:p-5">
                        {activeForm && (
                            <IdCard
                                form={activeForm}
                                onChange={handleChange}
                                getUploadSlot={getUploadSlot}
                                getPreviewUrl={getPreviewUrl}
                                onOpenPreview={onOpenPreview}
                                onUploadFile={onUploadFile}
                                onRetryUpload={onRetryUpload}
                                onSignatureFile={(formId, file) => void uploadFromFile(formId, 'signature', file)}
                                s={s}
                                uploadAppearance={dark ? 'dark' : 'light'}
                            />
                        )}
                    </div>

                    {/* Prev / Next mobile navigation */}
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${s.divider}`}>
                        <button
                            onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                            disabled={activeIndex === 0}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-30 transition-all ${dark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className={`${s.subtext} text-xs`}>{activeIndex + 1} / {idForms.length}</span>
                        <button
                            onClick={() => setActiveIndex(i => Math.min(idForms.length - 1, i + 1))}
                            disabled={activeIndex === idForms.length - 1}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-30 transition-all ${dark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* ── Delivery ──────────────────────────────────────────── */}
                <div className={s.card}>
                    <div className="p-4 sm:p-5">
                        <h3 className={`${s.text} font-bold mb-3`}>Delivery</h3>

                        {/* Mode toggle */}
                        <div className={`grid grid-cols-2 rounded-xl overflow-hidden border ${s.divider} mb-4`}>
                            <button
                                onClick={() => setDeliveryMode('pickup')}
                                className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${deliveryMode === 'pickup' ? (dark ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white') : `${s.subtext} hover:opacity-80`}`}
                            >
                                <MapPin size={14} /> Local Pickup
                            </button>
                            <button
                                onClick={() => setDeliveryMode('ship')}
                                className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${deliveryMode === 'ship' ? (dark ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white') : `${s.subtext} hover:opacity-80`}`}
                            >
                                <Truck size={14} /> Ship to Me +${SHIPPING_FEE}
                            </button>
                        </div>

                        {/* Shipping address (only when ship selected) */}
                        {deliveryMode === 'ship' && (
                            <div className="space-y-3 animate-fade-up">
                                <input type="text" placeholder="Full Name" className={s.input} value={shipName} onChange={e => setShipName(e.target.value)} />
                                <input type="text" placeholder="Street Address" className={s.input} value={shipStreet} onChange={e => setShipStreet(e.target.value)} />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input type="text" placeholder="City" className={s.input} value={shipCity} onChange={e => setShipCity(e.target.value)} />
                                    <input type="text" placeholder="State" className={s.input} value={shipState} onChange={e => setShipState(e.target.value)} />
                                    <input type="text" placeholder="ZIP" className={s.input} value={shipZip} onChange={e => setShipZip(e.target.value)} />
                                </div>
                            </div>
                        )}
                        {deliveryMode === 'pickup' && (
                            <p className={`${s.subtext} text-xs`}>Your reseller will coordinate delivery with you directly.</p>
                        )}
                    </div>
                </div>

                {/* ── Payment info ──────────────────────────────────────── */}
                <div className={s.card}>
                    <div className="p-4 sm:p-5 flex items-start gap-3">
                        <ShieldCheck size={16} className={`mt-0.5 flex-shrink-0 ${dark ? 'text-indigo-400' : 'text-blue-500'}`} />
                        <p className={`${s.subtext} text-sm leading-relaxed`}>
                            <span className={`${s.text} font-semibold`}>No payment required here.</span>{' '}
                            Your reseller will send you payment instructions after your order is confirmed.
                        </p>
                    </div>
                </div>

                {/* ── Notes ─────────────────────────────────────────────── */}
                <div className={s.card}>
                    <div className="p-4 sm:p-5">
                        <h3 className={`${s.text} font-bold mb-3`}>Order Notes <span className={`${s.subtext} text-xs font-normal`}>(Optional)</span></h3>
                        <textarea rows={2} className={`${s.input} resize-none`} placeholder="Any special instructions or notes for your order…" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* ── Sticky Bottom Bar ────────────────────────────────────── */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 ${dark ? 'bg-[#0f0f13]/90 border-white/[0.06]' : 'bg-white/90 border-slate-200'} backdrop-blur-xl border-t`}>
                <div className="max-w-2xl mx-auto px-4 py-3">
                    {/* Order summary line */}
                    <div className={`flex items-center justify-between mb-2 text-xs ${s.subtext}`}>
                        <span>{idForms.length} ID{idForms.length !== 1 ? 's' : ''} · {deliveryMode === 'ship' ? 'Ship' : 'Local Pickup'}</span>
                        <div className="flex items-center gap-2">
                            <span>Fee ${HANDLING_FEE}</span>
                            {deliveryMode === 'ship' && <span>· Ship ${SHIPPING_FEE}</span>}
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            status === 'loading' ||
                            uploadsIncomplete ||
                            uploadBusy ||
                            !!uploadSessionError ||
                            !uploadSessionReady
                        }
                        className={`w-full py-4 rounded-xl font-bold text-base text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${dark ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99]' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'}`}
                    >
                        {status === 'loading' ? (
                            <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Placing Order…</>
                        ) : (
                            <>Place Order <ChevronRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>

            {lightbox && (
                <ImageLightbox url={lightbox.url} label={lightbox.label} onClose={() => setLightbox(null)} />
            )}
        </div>
    );
}
