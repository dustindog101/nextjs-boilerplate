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
        id: '8',
        date: 'Jul 2026',
        title: 'Warehouse Delays — Check Your Order',
        body: 'Warehouse issues are causing delays for some orders — a few may take up to 3 weeks. Please track your order and check for a message on your order for the latest update. We appreciate your patience while we work through this.',
        tag: 'Update',
        published: true,
    },
    {
        id: '9',
        date: 'Jul 2026',
        title: 'More 1:1 Polycarbonate States',
        body: 'We just added multiple new 1:1 IDs — about 80% of states now offer polycarbonate options. Poly is our most accurate build: same materials as the real card, same weight and finish. All barcodes have been updated too — happy ID scans :)',
        tag: 'Product',
        published: true,
    },
    {
        id: '6',
        date: 'Jun 2026',
        title: 'Premium, CDL & International IDs',
        body: 'More choices are live: premium polycarbonate variants, commercial (CDL) options for select states, and UK provisional IDs — all in the same easy order flow.',
        tag: 'Product',
        published: true,
    },
    {
        id: '7',
        date: 'Apr 2026',
        title: 'Smarter Order Tracking',
        body: 'Track any order with a clearer status view — live production progress, payment status, and order details in one place so you always know where things stand.',
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
