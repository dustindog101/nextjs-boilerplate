/**
 * White-label reseller portal: persisted theme + in-progress order draft (localStorage via `storage.ts`).
 */

import {
    dayOptions,
    eyeColorOptions,
    hairColorOptions,
    monthOptions,
    sexOptions,
    yearOptions,
    defaultProductId,
} from '@/lib/constants';
import { resolveProductId, syncIdFormProduct } from '@/lib/productCatalog';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/lib/storage';
import type { IdFormData } from '@/lib/types';

export const RESELLER_THEME_KEY = 'idPirateResellerTheme';
export type ResellerTheme = 'dark' | 'light';

/** Draft kept until order succeeds or TTL — covers “closed tab, coming back” before submit. */
export const RESELLER_DRAFT_MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours

export function resellerDraftStorageKey(resellerId: string): string {
    return `idPirateResellerDraft_${resellerId}`;
}

export function readResellerTheme(): ResellerTheme | null {
    const v = getStorageItem(RESELLER_THEME_KEY);
    if (v === 'dark' || v === 'light') return v;
    return null;
}

export function writeResellerTheme(theme: ResellerTheme): void {
    setStorageItem(RESELLER_THEME_KEY, theme);
}

export type SerializableIdForm = Omit<IdFormData, 'photo' | 'signature'>;

export interface ResellerDraftV1 {
    v: 1;
    savedAt: number;
    idForms: SerializableIdForm[];
    activeIndex: number;
    nextFormId: number;
    deliveryMode: 'pickup' | 'ship';
    shipName: string;
    shipStreet: string;
    shipCity: string;
    shipState: string;
    shipZip: string;
    notes: string;
}

function inList<T extends string>(value: string, list: readonly T[], fallback: T): T {
    return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Map removed / legacy labels to current dropdown values. */
function mapLegacyHairColor(value: string): string {
    if (hairColorOptions.includes(value)) return value;
    const v = value.trim().toLowerCase();
    const legacy: Record<string, string> = {
        blonde: 'Blond',
        'dark brown': 'Brown',
        'light brown': 'Brown',
        auburn: 'Red',
        'bald / shaved': 'Bald',
    };
    if (legacy[v]) return legacy[v];
    return hairColorOptions[0];
}

function mapLegacyEyeColor(value: string): string {
    if (eyeColorOptions.includes(value)) return value;
    const v = value.trim().toLowerCase();
    if (v === 'amber') return 'Brown';
    return eyeColorOptions[0];
}

export function reviveIdForm(raw: SerializableIdForm): IdFormData {
    const productId = resolveProductId(raw.productId ?? raw.state);
    return syncIdFormProduct(
        {
            id: raw.id,
            productId,
            state: raw.state ?? '',
            dobMonth: inList(raw.dobMonth, monthOptions, monthOptions[0]),
            dobDay: inList(raw.dobDay, dayOptions, dayOptions[0]),
            dobYear: inList(raw.dobYear, yearOptions, yearOptions[0]),
            issueMonth: inList(raw.issueMonth, monthOptions, monthOptions[0]),
            issueDay: inList(raw.issueDay, dayOptions, dayOptions[0]),
            issueYear: inList(raw.issueYear, yearOptions, yearOptions[0]),
            firstName: raw.firstName ?? '',
            middleName: raw.middleName ?? '',
            lastName: raw.lastName ?? '',
            streetAddress: raw.streetAddress ?? '',
            city: raw.city ?? '',
            zipCode: raw.zipCode ?? '',
            zipPlus4: raw.zipPlus4 ?? '',
            heightFeet: raw.heightFeet ?? '',
            heightInches: raw.heightInches ?? '',
            weight: raw.weight ?? '',
            eyeColor: mapLegacyEyeColor(raw.eyeColor ?? ''),
            hairColor: mapLegacyHairColor(raw.hairColor ?? ''),
            sex: inList(raw.sex, sexOptions, sexOptions[0]),
            photoKey: raw.photoKey,
            signatureKey: raw.signatureKey,
            photoFileName: raw.photoFileName,
            signatureFileName: raw.signatureFileName,
        },
        productId,
    );
}

export function serializeIdForms(forms: IdFormData[]): SerializableIdForm[] {
    return forms.map(({ photo, signature, ...rest }) => rest);
}

export function loadResellerDraft(resellerId: string): ResellerDraftV1 | null {
    const raw = getStorageItem(resellerDraftStorageKey(resellerId));
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as ResellerDraftV1;
        if (parsed.v !== 1 || !Array.isArray(parsed.idForms)) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveResellerDraft(resellerId: string, draft: Omit<ResellerDraftV1, 'v' | 'savedAt'>): void {
    const payload: ResellerDraftV1 = {
        v: 1,
        savedAt: Date.now(),
        ...draft,
    };
    try {
        setStorageItem(resellerDraftStorageKey(resellerId), JSON.stringify(payload));
    } catch {
        /* quota / private mode */
    }
}

export function clearResellerDraft(resellerId: string): void {
    removeStorageItem(resellerDraftStorageKey(resellerId));
}

/** After restoring draft, mark upload slots as done when R2 keys exist (no blob preview until re-upload). */
export function buildUploadSlotsFromForms(
    forms: IdFormData[],
): Record<string, { status: 'done'; progress: number }> {
    const out: Record<string, { status: 'done'; progress: number }> = {};
    for (const f of forms) {
        if (f.photoKey) {
            out[`${f.id}-photo`] = { status: 'done', progress: 100 };
        }
        if (f.signatureKey) {
            out[`${f.id}-signature`] = { status: 'done', progress: 100 };
        }
    }
    return out;
}

export function createEmptyIdForm(id: number): IdFormData {
    return syncIdFormProduct(
        {
            id,
            productId: defaultProductId,
            state: '',
            dobMonth: monthOptions[0],
            dobDay: dayOptions[0],
            dobYear: yearOptions[0],
            issueMonth: monthOptions[0],
            issueDay: dayOptions[0],
            issueYear: String(new Date().getFullYear()),
            firstName: '',
            middleName: '',
            lastName: '',
            streetAddress: '',
            city: '',
            zipCode: '',
            zipPlus4: '',
            heightFeet: '',
            heightInches: '',
            weight: '',
            eyeColor: eyeColorOptions[0],
            hairColor: hairColorOptions[0],
            sex: sexOptions[0],
        },
        defaultProductId,
    );
}
