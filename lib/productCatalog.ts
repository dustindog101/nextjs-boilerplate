/**
 * Product catalog — single source of truth for ID variants (standard, premium, CDL, international).
 * **Keep in sync with `lambda functions/shared/product_catalog.py`** when changing products or list prices.
 * Volume/wholesale tier math: `lib/pricing.ts` ↔ `shared/order_pricing.py`.
 */

export type ProductCategory = 'us_standard' | 'us_premium' | 'cdl' | 'international';

export type ProductionAgency = 'DMV' | 'RMV' | 'MVC' | 'DPS';

export interface Product {
    id: string;
    region: string;
    category: ProductCategory;
    /** Short variant label shown in pickers */
    label: string;
    productionCode?: ProductionAgency;
    material: 'standard' | 'polycarbonate';
    docType: 'dl' | 'id' | 'cdl' | 'provisional';
    price: number;
    popular?: boolean;
    new?: boolean;
    hidden?: boolean;
}

export type GallerySection = 'us' | 'cdl' | 'international';

export interface RegionGalleryEntry {
    region: string;
    section: GallerySection;
    products: Product[];
    popular?: boolean;
    new?: boolean;
}

const DEFAULT_STANDARD_PRICE = 95;
const PREMIUM_PRICE_ADD = 25;
const CDL_PRICE_ADD = 35;
const UK_BASE_PRICE = 105;

/** Per-region standard (DL) list prices — unlisted regions use DEFAULT_STANDARD_PRICE */
const REGION_STANDARD_PRICES: Record<string, number> = {
    Pennsylvania: 90,
    'New Jersey': 100,
    Maine: 85,
    Washington: 85,
    Oregon: 85,
    'South Carolina': 85,
    Missouri: 85,
    Illinois: 90,
    Connecticut: 90,
    Arizona: 90,
    Florida: 100,
    Texas: 100,
    California: 100,
    'New York': 100,
};

const POPULAR_REGIONS = new Set([
    'Pennsylvania',
    'New Jersey',
    'Florida',
    'Texas',
    'California',
]);

const NEW_REGIONS = new Set(['Florida', 'Texas', 'California']);

const US_REGIONS: { code: string; name: string }[] = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
];

type PremiumDef = {
    suffix: string;
    label: string;
    productionCode?: ProductionAgency;
    docType?: Product['docType'];
    priceAdd?: number;
};

const PREMIUM_BY_CODE: Record<string, PremiumDef[]> = {
    CA: [
        { suffix: 'DMV_POLY', label: 'DMV Polycarbonate', productionCode: 'DMV' },
        { suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' },
    ],
    CT: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    ID: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    IL: [{ suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' }],
    IA: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    KS: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    ME: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    MA: [{ suffix: 'ID_IDENTICAL_RMV_POLY', label: 'ID Identical — RMV Polycarbonate', productionCode: 'RMV', docType: 'id' }],
    MI: [{ suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' }],
    MN: [{ suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' }],
    MS: [{ suffix: 'ID_IDENTICAL_DPS_POLY', label: 'ID Identical — DPS Polycarbonate', productionCode: 'DPS', docType: 'id' }],
    MO: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    MT: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    NE: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    NV: [{ suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' }],
    NJ: [{ suffix: 'ID_IDENTICAL_MVC_POLY', label: 'NJ ID Identical — MVC Polycarbonate', productionCode: 'MVC', docType: 'id' }],
    NC: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    OK: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    RI: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
    TN: [{ suffix: 'ID_ONLY', label: 'Identification Card Only', docType: 'id' }],
    UT: [{ suffix: 'ID_IDENTICAL_DMV_POLY', label: 'ID Identical — DMV Polycarbonate', productionCode: 'DMV', docType: 'id' }],
    WV: [{ suffix: 'POLY', label: 'Polycarbonate (Official)' }],
};

const CDL_REGIONS: { code: string; name: string }[] = [
    { code: 'CA', name: 'California' },
    { code: 'GA', name: 'Georgia' },
    { code: 'OH', name: 'Ohio' },
];

function standardPrice(region: string): number {
    return REGION_STANDARD_PRICES[region] ?? DEFAULT_STANDARD_PRICE;
}

function premiumPrice(region: string, add = PREMIUM_PRICE_ADD): number {
    return standardPrice(region) + add;
}

function buildCatalog(): Product[] {
    const products: Product[] = [];

    for (const { code, name } of US_REGIONS) {
        const base = standardPrice(name);
        products.push({
            id: `${code}:STANDARD`,
            region: name,
            category: 'us_standard',
            label: 'Standard',
            material: 'standard',
            docType: 'dl',
            price: base,
            popular: POPULAR_REGIONS.has(name),
            new: NEW_REGIONS.has(name),
        });

        for (const prem of PREMIUM_BY_CODE[code] ?? []) {
            products.push({
                id: `${code}:${prem.suffix}`,
                region: name,
                category: 'us_premium',
                label: prem.label,
                productionCode: prem.productionCode,
                material: 'polycarbonate',
                docType: prem.docType ?? 'dl',
                price: premiumPrice(name, prem.priceAdd),
            });
        }
    }

    for (const { code, name } of CDL_REGIONS) {
        products.push({
            id: `${code}:CDL_POLY`,
            region: name,
            category: 'cdl',
            label: 'CDL Polycarbonate (Official)',
            material: 'polycarbonate',
            docType: 'cdl',
            price: standardPrice(name) + CDL_PRICE_ADD,
        });
    }

    products.push(
        {
            id: 'UK:ID_IDENTICAL_POLY',
            region: 'United Kingdom',
            category: 'international',
            label: 'UK ID Identical Polycarbonate',
            material: 'polycarbonate',
            docType: 'id',
            price: UK_BASE_PRICE,
        },
        {
            id: 'UK:PROVISIONAL_POLY',
            region: 'United Kingdom',
            category: 'international',
            label: 'UK Provisional (Polycarbonate)',
            material: 'polycarbonate',
            docType: 'provisional',
            price: UK_BASE_PRICE,
        },
    );

    products.push({
        id: 'TEST:DONT_ORDER',
        region: 'Test',
        category: 'us_standard',
        label: 'Test (do not order)',
        material: 'standard',
        docType: 'dl',
        price: 1,
        hidden: true,
    });

    return products;
}

export const PRODUCTS: Product[] = buildCatalog();

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(
    PRODUCTS.map((p) => [p.id, p]),
);

export const DEFAULT_PRODUCT_ID = 'PA:STANDARD';

/** All customer-visible products (for dropdowns) */
export const VISIBLE_PRODUCTS = PRODUCTS.filter((p) => !p.hidden);

export const ALL_REGION_COUNT = new Set(
    VISIBLE_PRODUCTS.filter((p) => p.category !== 'cdl').map((p) => p.region),
).size;

/** Legacy flat labels — region names for US gallery sections */
export const US_REGION_NAMES = US_REGIONS.map((r) => r.name);

/** @deprecated Use product catalog — kept for gradual migration */
export const LEGACY_STATE_TO_PRODUCT: Record<string, string> = {
    Pennsylvania: 'PA:STANDARD',
    'New Jersey': 'NJ:STANDARD',
    'Old Maine': 'ME:STANDARD',
    Maine: 'ME:STANDARD',
    Washington: 'WA:STANDARD',
    Oregon: 'OR:STANDARD',
    'South Carolina': 'SC:STANDARD',
    Missouri: 'MO:STANDARD',
    Illinois: 'IL:STANDARD',
    Connecticut: 'CT:STANDARD',
    Arizona: 'AZ:STANDARD',
    Florida: 'FL:STANDARD',
    Texas: 'TX:STANDARD',
    'TEST_DONT_ORDER': 'TEST:DONT_ORDER',
};

export function getProduct(productId: string): Product | undefined {
    return PRODUCT_BY_ID[productId];
}

export function resolveProductId(raw: string | undefined | null): string {
    if (!raw) return DEFAULT_PRODUCT_ID;
    if (PRODUCT_BY_ID[raw]) return raw;
    if (LEGACY_STATE_TO_PRODUCT[raw]) return LEGACY_STATE_TO_PRODUCT[raw];
    const byRegionStandard = PRODUCTS.find((p) => p.region === raw && p.category === 'us_standard');
    if (byRegionStandard) return byRegionStandard.id;
    return DEFAULT_PRODUCT_ID;
}

export function getProductListPrice(productId: string): number {
    return getProduct(productId)?.price ?? DEFAULT_STANDARD_PRICE;
}

/** Full label stored on orders / shown in admin */
export function getOrderStateLabel(productId: string): string {
    const p = getProduct(productId);
    if (!p) return productId;
    if (p.category === 'us_standard' && p.label === 'Standard') return p.region;
    return `${p.region} — ${p.label}`;
}

export function getProductShortLabel(productId: string): string {
    const p = getProduct(productId);
    if (!p) return productId;
    if (p.category === 'us_standard' && p.label === 'Standard') return p.region;
    return p.label;
}

export function syncIdFormProduct<T extends { productId?: string; state?: string }>(
    form: T,
    productId: string,
): T & { productId: string; state: string } {
    return {
        ...form,
        productId,
        state: getOrderStateLabel(productId),
    };
}

export function productsForRegion(region: string, section?: GallerySection): Product[] {
    const list = VISIBLE_PRODUCTS.filter((p) => {
        if (p.region !== region) return false;
        if (section === 'cdl') return p.category === 'cdl';
        if (section === 'international') return p.category === 'international';
        if (section === 'us') return p.category === 'us_standard' || p.category === 'us_premium';
        return p.category !== 'cdl';
    });
    return list.sort((a, b) => {
        const order = { us_standard: 0, us_premium: 1, cdl: 2, international: 3 };
        return order[a.category] - order[b.category] || a.label.localeCompare(b.label);
    });
}

export function defaultProductForRegion(region: string, section?: GallerySection): string {
    const list = productsForRegion(region, section);
    return list[0]?.id ?? DEFAULT_PRODUCT_ID;
}

export function buildRegionGallery(): RegionGalleryEntry[] {
    const usEntries: RegionGalleryEntry[] = US_REGIONS.map(({ name }) => ({
        region: name,
        section: 'us' as const,
        products: productsForRegion(name, 'us'),
        popular: POPULAR_REGIONS.has(name),
        new: NEW_REGIONS.has(name),
    }));

    const cdlEntries: RegionGalleryEntry[] = CDL_REGIONS.map(({ name }) => ({
        region: name,
        section: 'cdl' as const,
        products: productsForRegion(name, 'cdl'),
    }));

    const intlEntry: RegionGalleryEntry = {
        region: 'United Kingdom',
        section: 'international',
        products: productsForRegion('United Kingdom', 'international'),
    };

    return [...usEntries, ...cdlEntries, intlEntry];
}

export function lowestPriceForRegion(region: string, section?: GallerySection): number {
    const prices = productsForRegion(region, section).map((p) => p.price);
    return prices.length ? Math.min(...prices) : DEFAULT_STANDARD_PRICE;
}

export function regionHasPremium(region: string): boolean {
    return productsForRegion(region, 'us').some((p) => p.category === 'us_premium');
}

/** Grouped region options for in-form state / ID type selectors */
export function regionSelectGroups(): {
    label: string;
    options: { region: string; section: GallerySection }[];
}[] {
    const bySection: Record<GallerySection, { region: string; section: GallerySection }[]> = {
        us: [],
        cdl: [],
        international: [],
    };

    for (const entry of buildRegionGallery()) {
        bySection[entry.section].push({ region: entry.region, section: entry.section });
    }

    const groups: { label: string; options: { region: string; section: GallerySection }[] }[] = [];
    if (bySection.us.length) groups.push({ label: 'US States', options: bySection.us });
    if (bySection.cdl.length) groups.push({ label: 'Commercial (CDL)', options: bySection.cdl });
    if (bySection.international.length) groups.push({ label: 'International', options: bySection.international });
    return groups;
}

/** Grouped options for reseller / long selects */
export function productSelectGroups(): { label: string; options: { id: string; label: string }[] }[] {
    const groups: { label: string; options: { id: string; label: string }[] }[] = [];

    const us = VISIBLE_PRODUCTS.filter((p) => p.category === 'us_standard' || p.category === 'us_premium');
    const byRegion = new Map<string, Product[]>();
    for (const p of us) {
        const arr = byRegion.get(p.region) ?? [];
        arr.push(p);
        byRegion.set(p.region, arr);
    }
    for (const name of US_REGION_NAMES) {
        const items = byRegion.get(name);
        if (!items?.length) continue;
        groups.push({
            label: name,
            options: items.map((p) => ({
                id: p.id,
                label: p.category === 'us_standard' ? 'Standard' : p.label,
            })),
        });
    }

    const cdl = VISIBLE_PRODUCTS.filter((p) => p.category === 'cdl');
    if (cdl.length) {
        groups.push({
            label: 'Commercial (CDL)',
            options: cdl.map((p) => ({ id: p.id, label: `${p.region} — ${p.label}` })),
        });
    }

    const intl = VISIBLE_PRODUCTS.filter((p) => p.category === 'international');
    if (intl.length) {
        groups.push({
            label: 'International',
            options: intl.map((p) => ({ id: p.id, label: p.label })),
        });
    }

    return groups;
}

export const STATE_GRADIENTS: Record<string, string> = {
    Alabama: 'from-red-600 to-red-800',
    Alaska: 'from-sky-600 to-blue-800',
    Arizona: 'from-red-500 to-orange-600',
    Arkansas: 'from-red-600 to-rose-800',
    California: 'from-blue-600 to-indigo-800',
    Colorado: 'from-blue-500 to-cyan-700',
    Connecticut: 'from-slate-500 to-slate-700',
    Delaware: 'from-blue-600 to-blue-800',
    'District of Columbia': 'from-slate-600 to-slate-800',
    Florida: 'from-orange-500 to-red-500',
    Georgia: 'from-red-600 to-red-800',
    Hawaii: 'from-teal-500 to-cyan-700',
    Idaho: 'from-emerald-600 to-green-800',
    Illinois: 'from-blue-500 to-indigo-600',
    Indiana: 'from-blue-600 to-blue-800',
    Iowa: 'from-amber-600 to-orange-700',
    Kansas: 'from-sky-600 to-blue-700',
    Kentucky: 'from-blue-600 to-indigo-800',
    Louisiana: 'from-purple-600 to-indigo-800',
    Maine: 'from-emerald-600 to-teal-700',
    Maryland: 'from-red-600 to-red-800',
    Massachusetts: 'from-blue-600 to-blue-800',
    Michigan: 'from-blue-600 to-cyan-800',
    Minnesota: 'from-sky-600 to-blue-800',
    Mississippi: 'from-red-600 to-red-800',
    Missouri: 'from-sky-600 to-sky-800',
    Montana: 'from-amber-600 to-yellow-700',
    Nebraska: 'from-red-600 to-red-800',
    Nevada: 'from-slate-600 to-slate-800',
    'New Hampshire': 'from-slate-600 to-slate-800',
    'New Jersey': 'from-amber-500 to-orange-600',
    'New Mexico': 'from-yellow-600 to-amber-700',
    'New York': 'from-blue-600 to-blue-800',
    'North Carolina': 'from-blue-600 to-blue-800',
    'North Dakota': 'from-green-600 to-emerald-800',
    Ohio: 'from-red-600 to-red-800',
    Oklahoma: 'from-red-600 to-red-800',
    Oregon: 'from-cyan-600 to-blue-700',
    Pennsylvania: 'from-blue-600 to-blue-800',
    'Puerto Rico': 'from-red-500 to-orange-600',
    'Rhode Island': 'from-blue-600 to-blue-800',
    'South Carolina': 'from-indigo-500 to-indigo-700',
    'South Dakota': 'from-amber-600 to-yellow-700',
    Tennessee: 'from-red-600 to-red-800',
    Texas: 'from-red-600 to-red-800',
    Utah: 'from-red-600 to-orange-700',
    Vermont: 'from-green-600 to-emerald-800',
    Virginia: 'from-blue-600 to-blue-800',
    Washington: 'from-green-600 to-green-800',
    'West Virginia': 'from-blue-600 to-blue-800',
    Wisconsin: 'from-red-600 to-red-800',
    Wyoming: 'from-amber-600 to-yellow-700',
    'United Kingdom': 'from-red-600 to-blue-800',
};
