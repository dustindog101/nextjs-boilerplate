/**
 * Order pricing — volume discounts (retail) and reseller wholesale tiers.
 * Keep in sync with `lambda functions/shared/order_pricing.py`.
 */

import { defaultIdPrice, handlingFee, shippingFee } from './constants';
import { getProductListPrice, resolveProductId } from './productCatalog';

export const RETAIL_VOLUME_DISCOUNTS = {
    single: 0,
    twoToThree: 10,
    fourPlus: 20,
} as const;

export const RESELLER_WHOLESALE_TIERS = [
    { minIds: 1, maxIds: 4, perId: 65 },
    { minIds: 5, maxIds: 9, perId: 60 },
    { minIds: 10, maxIds: 19, perId: 55 },
    { minIds: 20, maxIds: Infinity, perId: 45 },
] as const;

export type PricingMode = 'retail' | 'reseller_wholesale';

/** One discounted line, mirroring the backend's `appliedTo` entry. */
export interface AppliedDiscountLine {
    productId: string;
    quantity: number;
    unitPrice: number;
    perUnitDiscount: number;
    lineDiscount: number;
}

export interface OrderPriceBreakdown {
    idCount: number;
    pricingMode: PricingMode;
    listSubtotal: number;
    volumeSavings: number;
    idSubtotal: number;
    handling: number;
    shipping: number;
    discountAmount?: number;
    /** 'cart' or 'line_item' — only set when a discount was applied. */
    discountScope?: 'cart' | 'line_item';
    /** Per-line breakdown — only set when discountScope='line_item'. */
    discountAppliedTo?: AppliedDiscountLine[];
    total: number;
    perIdEffective: number;
    /** Legacy field — same as idSubtotal for new orders */
    subtotal: number;
}

export function getStateListPrice(stateOrProductId: string): number {
    return getProductListPrice(resolveProductId(stateOrProductId));
}

/** Per-ID discount off list price for retail volume tiers. */
export function retailDiscountPerId(idCount: number): number {
    if (idCount <= 1) return RETAIL_VOLUME_DISCOUNTS.single;
    if (idCount <= 3) return RETAIL_VOLUME_DISCOUNTS.twoToThree;
    return RETAIL_VOLUME_DISCOUNTS.fourPlus;
}

/** Wholesale $/ID from order ID count. */
export function wholesalePerId(idCount: number): number {
    const n = Math.max(idCount, 1);
    for (const tier of RESELLER_WHOLESALE_TIERS) {
        if (n >= tier.minIds && n <= tier.maxIds) return tier.perId;
    }
    return RESELLER_WHOLESALE_TIERS[RESELLER_WHOLESALE_TIERS.length - 1].perId;
}

/** Effective per-ID price for one line item (retail volume or wholesale). */
export function effectivePerIdPrice(
    stateOrProductId: string,
    idCount: number,
    pricingMode: PricingMode,
): number {
    if (pricingMode === 'reseller_wholesale') {
        return wholesalePerId(idCount);
    }
    const productId = resolveProductId(stateOrProductId);
    const base = getProductListPrice(productId);
    if (productId === 'TEST:DONT_ORDER') return base;
    return Math.max(base - retailDiscountPerId(idCount), 0);
}

/** Retail effective prices for gallery display at fixed example counts. */
export function retailEffectiveAtCount(listPrice: number, idCount: number): number {
    if (listPrice <= 1) return listPrice;
    return Math.max(listPrice - retailDiscountPerId(idCount), 0);
}

export function resolvePricingMode(isReseller: boolean): PricingMode {
    return isReseller ? 'reseller_wholesale' : 'retail';
}

export interface DiscountCodeInput {
    /** Total discount amount in dollars (always required). */
    amount: number;
    /** Scope — when 'line_item', `appliedTo` should be provided for UI breakdown. */
    scope?: 'cart' | 'line_item';
    /** Per-line breakdown — only required when scope='line_item'. */
    appliedTo?: AppliedDiscountLine[];
}

export function calcOrderPricing(input: {
    ids: { productId?: string; state?: string }[];
    shippingIsDelivery: boolean;
    pricingMode: PricingMode;
    /** Old form: just the discount amount. Kept for backward compat. */
    discountCodeAmount?: number;
    /** New form: structured discount with scope + per-line breakdown. */
    discount?: DiscountCodeInput;
}): OrderPriceBreakdown {
    const idCount = input.ids.length;
    const pricingMode = input.pricingMode;

    let listSubtotal = 0;
    let idSubtotal = 0;

    const priceKey = (item: { productId?: string; state?: string }) =>
        resolveProductId(item.productId ?? item.state ?? '');

    if (pricingMode === 'reseller_wholesale') {
        const perId = wholesalePerId(idCount);
        listSubtotal = input.ids.reduce((sum, item) => sum + getProductListPrice(priceKey(item)), 0);
        idSubtotal = roundMoney(perId * idCount);
    } else {
        const discountPerId = retailDiscountPerId(idCount);
        for (const item of input.ids) {
            const productId = priceKey(item);
            const base = getProductListPrice(productId);
            listSubtotal += base;
            if (productId === 'TEST:DONT_ORDER') {
                idSubtotal += base;
            } else {
                idSubtotal += Math.max(base - discountPerId, 0);
            }
        }
        idSubtotal = roundMoney(idSubtotal);
        listSubtotal = roundMoney(listSubtotal);
    }

    const volumeSavings =
        pricingMode === 'retail' ? roundMoney(Math.max(listSubtotal - idSubtotal, 0)) : 0;

    const handling = handlingFee;
    const shipping = input.shippingIsDelivery ? shippingFee : 0;

    // Resolve discount: new structured form takes precedence over legacy scalar
    const discount = input.discount ?? (
        input.discountCodeAmount !== undefined && input.discountCodeAmount > 0
            ? { amount: input.discountCodeAmount, scope: 'cart' as const }
            : undefined
    );
    const discountAmount = discount?.amount ?? 0;
    const preDiscount = idSubtotal + handling + shipping;
    const total = roundMoney(Math.max(preDiscount - discountAmount, 0));
    const perIdEffective = idCount > 0 ? roundMoney(idSubtotal / idCount) : 0;

    const result: OrderPriceBreakdown = {
        idCount,
        pricingMode,
        listSubtotal: roundMoney(listSubtotal),
        volumeSavings,
        idSubtotal,
        handling,
        shipping,
        ...(discountAmount > 0 ? { discountAmount: roundMoney(discountAmount) } : {}),
        total,
        perIdEffective,
        subtotal: idSubtotal,
    };
    if (discount?.scope) {
        result.discountScope = discount.scope;
    }
    if (discount?.appliedTo && discount.appliedTo.length > 0) {
        result.discountAppliedTo = discount.appliedTo;
    }
    return result;
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}
