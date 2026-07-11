/**
 * Unit tests for lib/pricing.ts scope-aware discount logic.
 *
 * Run: npx vitest run
 */
import { describe, it, expect } from 'vitest';
import {
    calcOrderPricing,
    retailDiscountPerId,
    wholesalePerId,
    type DiscountCodeInput,
} from '../lib/pricing';
import { getProductListPrice } from '../lib/productCatalog';

describe('retailDiscountPerId', () => {
    it('returns 0 for single ID', () => {
        expect(retailDiscountPerId(1)).toBe(0);
    });
    it('returns 10 for 2-3 IDs', () => {
        expect(retailDiscountPerId(2)).toBe(10);
        expect(retailDiscountPerId(3)).toBe(10);
    });
    it('returns 20 for 4+ IDs', () => {
        expect(retailDiscountPerId(4)).toBe(20);
        expect(retailDiscountPerId(10)).toBe(20);
    });
});

describe('wholesalePerId', () => {
    it('returns tier 1 ($65) for 1-4 IDs', () => {
        expect(wholesalePerId(1)).toBe(65);
        expect(wholesalePerId(4)).toBe(65);
    });
    it('returns tier 2 ($60) for 5-9 IDs', () => {
        expect(wholesalePerId(5)).toBe(60);
        expect(wholesalePerId(9)).toBe(60);
    });
    it('returns tier 3 ($55) for 10-19 IDs', () => {
        expect(wholesalePerId(10)).toBe(55);
        expect(wholesalePerId(19)).toBe(55);
    });
    it('returns tier 4 ($45) for 20+ IDs', () => {
        expect(wholesalePerId(20)).toBe(45);
        expect(wholesalePerId(100)).toBe(45);
    });
});

describe('calcOrderPricing — no discount', () => {
    it('computes retail single-ID total with shipping', () => {
        const result = calcOrderPricing({
            ids: [{ productId: 'PA:STANDARD' }],
            shippingIsDelivery: true,
            pricingMode: 'retail',
        });
        // PA:STANDARD list price = 90; retail single = no discount; +5 handling +15 shipping = 110
        expect(result.idSubtotal).toBe(90);
        expect(result.handling).toBe(5);
        expect(result.shipping).toBe(15);
        expect(result.total).toBe(110);
        expect(result.discountAmount).toBeUndefined();
        expect(result.discountScope).toBeUndefined();
    });

    it('computes retail 4-ID total with volume discount', () => {
        const result = calcOrderPricing({
            ids: [
                { productId: 'PA:STANDARD' },
                { productId: 'PA:STANDARD' },
                { productId: 'PA:STANDARD' },
                { productId: 'PA:STANDARD' },
            ],
            shippingIsDelivery: false,
            pricingMode: 'retail',
        });
        // 4 × $90 = $360 list, 4 × ($90-$20) = $280 id subtotal, +$5 handling, no shipping = $285
        expect(result.idSubtotal).toBe(280);
        expect(result.volumeSavings).toBe(80);
        expect(result.handling).toBe(5);
        expect(result.shipping).toBe(0);
        expect(result.total).toBe(285);
    });

    it('computes reseller wholesale total', () => {
        const result = calcOrderPricing({
            ids: [
                { productId: 'PA:STANDARD' },
                { productId: 'CA:DMV_POLY' },
            ],
            shippingIsDelivery: true,
            pricingMode: 'reseller_wholesale',
        });
        // 2 IDs × $65 wholesale = $130, +5 +15 = $150
        expect(result.idSubtotal).toBe(130);
        expect(result.total).toBe(150);
        expect(result.volumeSavings).toBe(0); // wholesale has no volume savings
    });
});

describe('calcOrderPricing — cart-scope discount (legacy scalar)', () => {
    it('applies scalar discount as cart scope', () => {
        const result = calcOrderPricing({
            ids: [{ productId: 'PA:STANDARD' }],
            shippingIsDelivery: true,
            pricingMode: 'retail',
            discountCodeAmount: 10,
        });
        // 90 + 5 + 15 = 110; 110 - 10 = 100
        expect(result.discountAmount).toBe(10);
        expect(result.discountScope).toBe('cart');
        expect(result.discountAppliedTo).toBeUndefined();
        expect(result.total).toBe(100);
    });
});

describe('calcOrderPricing — cart-scope discount (structured)', () => {
    it('applies structured cart discount', () => {
        const discount: DiscountCodeInput = { amount: 25, scope: 'cart' };
        const result = calcOrderPricing({
            ids: [{ productId: 'PA:STANDARD' }],
            shippingIsDelivery: true,
            pricingMode: 'retail',
            discount,
        });
        expect(result.discountAmount).toBe(25);
        expect(result.discountScope).toBe('cart');
        expect(result.discountAppliedTo).toBeUndefined();
        expect(result.total).toBe(85); // 110 - 25
    });

    it('clamps total to >= 0 when discount exceeds total', () => {
        const result = calcOrderPricing({
            ids: [{ productId: 'PA:STANDARD' }],
            shippingIsDelivery: false,
            pricingMode: 'retail',
            discount: { amount: 1000, scope: 'cart' },
        });
        expect(result.total).toBe(0);
    });
});

describe('calcOrderPricing — line_item scope discount', () => {
    it('surfaces scope + appliedTo breakdown without recomputing amount', () => {
        // The frontend trusts the backend's discountAmount + appliedTo breakdown.
        // We just pass it through to the breakdown.
        const discount: DiscountCodeInput = {
            amount: 36.0,
            scope: 'line_item',
            appliedTo: [
                {
                    productId: 'PA:STANDARD',
                    quantity: 2,
                    unitPrice: 90.0,
                    perUnitDiscount: 18.0,
                    lineDiscount: 36.0,
                },
            ],
        };
        const result = calcOrderPricing({
            ids: [
                { productId: 'PA:STANDARD' },
                { productId: 'PA:STANDARD' },
                { productId: 'FL:STANDARD' },
            ],
            shippingIsDelivery: true,
            pricingMode: 'retail',
            discount,
        });
        expect(result.discountAmount).toBe(36.0);
        expect(result.discountScope).toBe('line_item');
        expect(result.discountAppliedTo).toHaveLength(1);
        expect(result.discountAppliedTo![0].productId).toBe('PA:STANDARD');
        expect(result.discountAppliedTo![0].lineDiscount).toBe(36.0);
        // 3 IDs: 2× PA:STANDARD (90 list) + 1× FL:STANDARD (100 list)
        // 2-3 IDs volume tier = $10/id off list
        // idSubtotal = (90-10)*2 + (100-10)*1 = 160 + 90 = 250
        // + $5 handling + $15 shipping = $270
        // - $36 discount = $234
        expect(result.idSubtotal).toBe(250);
        expect(result.total).toBe(234);
    });

    it('omits appliedTo when scope is line_item but no lines match', () => {
        const discount: DiscountCodeInput = {
            amount: 0,
            scope: 'line_item',
            appliedTo: [],
        };
        const result = calcOrderPricing({
            ids: [{ productId: 'PA:STANDARD' }],
            shippingIsDelivery: true,
            pricingMode: 'retail',
            discount,
        });
        expect(result.discountScope).toBe('line_item');
        expect(result.discountAppliedTo).toBeUndefined();
        // discountAmount is omitted when 0 (conditional spread in the result shape)
        expect(result.discountAmount ?? 0).toBe(0);
    });
});

describe('calcOrderPricing — TEST product is excluded from volume discount', () => {
    it('TEST:DONT_ORDER gets no volume discount', () => {
        const result = calcOrderPricing({
            ids: [
                { productId: 'TEST:DONT_ORDER' },
                { productId: 'TEST:DONT_ORDER' },
                { productId: 'TEST:DONT_ORDER' },
                { productId: 'TEST:DONT_ORDER' },
            ],
            shippingIsDelivery: false,
            pricingMode: 'retail',
        });
        // 4 × $1 = $4, no volume discount applied
        expect(result.idSubtotal).toBe(4);
        expect(result.volumeSavings).toBe(0);
        expect(result.total).toBe(9); // 4 + 5 handling
    });
});
