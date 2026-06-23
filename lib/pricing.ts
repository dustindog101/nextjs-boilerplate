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

export interface OrderPriceBreakdown {
    idCount: number;
    pricingMode: PricingMode;
    listSubtotal: number;
    volumeSavings: number;
    idSubtotal: number;
    handling: number;
    shipping: number;
    discountAmount?: number;
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

export function calcOrderPricing(input: {
    ids: { productId?: string; state?: string }[];
    shippingIsDelivery: boolean;
    pricingMode: PricingMode;
    discountCodeAmount?: number;
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
    const discountAmount = input.discountCodeAmount ?? 0;
    const preDiscount = idSubtotal + handling + shipping;
    const total = roundMoney(Math.max(preDiscount - discountAmount, 0));
    const perIdEffective = idCount > 0 ? roundMoney(idSubtotal / idCount) : 0;

    return {
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
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}
