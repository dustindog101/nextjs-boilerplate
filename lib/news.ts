// Shared News Data — Single source of truth
// Edit this file to add/remove/update news items.
// The admin panel shows a read-only view; the public /news page renders published items.

export interface NewsItem {
    id: string;
    date: string;
    title: string;
    body: string;
    tag: 'Product' | 'Update' | 'Promo';
    published: boolean;
}

export const newsItems: NewsItem[] = [
    {
        id: '5',
        date: 'Jul 2026',
        title: 'Pay with Crypto at Checkout',
        body: 'You can now pay with Bitcoin, Litecoin, Solana, or USDC directly at checkout. Pick your coin, get a QR code and exact amount on the invoice page, and we confirm payment automatically — no back-and-forth needed.',
        tag: 'Product',
        published: true,
    },
    {
        id: '6',
        date: 'Jun 2026',
        title: 'Premium, CDL & International IDs',
        body: 'The catalog now goes beyond standard state licenses. Choose premium polycarbonate variants, commercial (CDL) options for select states, and UK provisional IDs — all from the same order flow.',
        tag: 'Product',
        published: true,
    },
    {
        id: '7',
        date: 'Apr 2026',
        title: 'Smarter Order Tracking',
        body: 'The track page now shows live production status, payment method, and whether your order is paid or still pending. Unpaid crypto orders can be completed right from your tracking link.',
        tag: 'Update',
        published: true,
    },
    {
        id: '1',
        date: 'Feb 2026',
        title: 'New States Added',
        body: 'Florida and Texas are now available with the latest security features including UV & OVI holograms.',
        tag: 'Product',
        published: true,
    },
    {
        id: '2',
        date: 'Jan 2026',
        title: 'Faster Turnaround Times',
        body: "We've upgraded our production pipeline. Most orders now ship within 1-3 business days.",
        tag: 'Update',
        published: true,
    },
    {
        id: '3',
        date: 'Jan 2026',
        title: 'Group Order Discounts',
        body: 'Orders of 4+ IDs now receive automatic discounts at checkout. The more you order, the more you save.',
        tag: 'Promo',
        published: true,
    },
    {
        id: '4',
        date: 'Dec 2025',
        title: 'Improved Security Features',
        body: 'All IDs now include enhanced microprint, updated holographic overlays, and improved barcode scanning.',
        tag: 'Product',
        published: true,
    },
];
