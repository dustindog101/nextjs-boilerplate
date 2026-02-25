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
