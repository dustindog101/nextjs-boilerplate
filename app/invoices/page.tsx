"use client";
import React, { useState, useEffect, useRef } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';

// --- Type ---
interface InvoiceData {
    orderNumber: string;
    date: string;
    customer: string;
    idType: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    handlingFee: number;
    total: number;
    paymentMethod: string;
}

// Print-only styles (fonts already loaded by layout.tsx)
const PrintStyles = () => (
    <style jsx global>{`
    @media print {
      body * { visibility: hidden; }
      #invoice-container, #invoice-container * { visibility: visible; }
      #invoice-container { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none; }
    }
  `}</style>
);

// Data for ID types and prices
const idOptions = [
    { name: 'New Jersey (New Version)', price: 100 },
    { name: 'Old Maine', price: 85 },
    { name: 'Washington (Old Version)', price: 85 },
    { name: 'Oregon (Old Version)', price: 85 },
    { name: 'South Carolina (Old Version)', price: 85 },
    { name: 'Pennsylvania', price: 90 },
    { name: 'Missouri (Old Version)', price: 85 },
    { name: 'Illinois', price: 90 },
    { name: 'Connecticut', price: 90 },
    { name: 'Arizona', price: 90 },
];

const paymentMethods = ['Apple Pay', 'Crypto', 'Zelle', 'Card', 'Venmo', 'Cash App'];

/* ── Invoice Preview ── */
const Invoice: React.FC<{ data: InvoiceData | null }> = ({ data }) => {
    if (!data) return null;

    return (
        <div id="invoice-container" className="max-w-4xl mx-auto glass overflow-hidden mt-8 animate-fade-up">
            <div className="p-8 md:p-12">
                <header className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">ID Pirate</h1>
                        <p className="text-[var(--text-tertiary)] text-sm">idpirate.com</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-wide">INVOICE</h2>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="space-y-2 text-sm">
                        <div className="flex"><span className="text-[var(--text-tertiary)] w-32">Order Number:</span><span className="text-[var(--text-primary)]">{data.orderNumber}</span></div>
                        <div className="flex"><span className="text-[var(--text-tertiary)] w-32">Date:</span><span className="text-[var(--text-primary)]">{data.date}</span></div>
                    </div>
                    <div className="bg-white/[0.04] p-4 rounded-lg border border-[var(--border)]">
                        <div className="flex text-sm"><span className="text-[var(--text-tertiary)] w-20">Customer:</span><span className="text-[var(--text-primary)]">{data.customer}</span></div>
                    </div>
                </section>

                <section className="mb-10">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="p-3 text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">Item</th>
                                <th className="p-3 text-center text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">Qty</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">Unit Price</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-[var(--border)]">
                                <td className="p-3 text-[var(--text-primary)]">{data.idType}</td>
                                <td className="p-3 text-center text-[var(--text-secondary)]">{data.quantity}</td>
                                <td className="p-3 text-right text-[var(--text-secondary)]">${data.unitPrice.toFixed(2)}</td>
                                <td className="p-3 text-right text-[var(--text-primary)] font-medium">${data.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-[var(--border)]">
                                <td className="p-3 text-[var(--text-tertiary)]">Processing & Handling</td>
                                <td className="p-3"></td>
                                <td className="p-3"></td>
                                <td className="p-3 text-right text-[var(--text-secondary)]">${data.handlingFee.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="mb-10 border-t border-[var(--border)] pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider mb-2">Payment Method</h3>
                            <div className="bg-white/[0.04] px-4 py-2 rounded-lg w-fit border border-[var(--border)]">
                                <span className="text-[var(--text-primary)] font-medium text-sm">{data.paymentMethod}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-start md:justify-end md:pt-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="crypto-discount" className="h-4 w-4 rounded bg-white/[0.04] border-white/20 focus:ring-[var(--accent)]" />
                                <label htmlFor="crypto-discount" className="text-sm font-semibold text-[var(--text-primary)]">Crypto Discount</label>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="paid-status" className="h-4 w-4 rounded bg-white/[0.04] border-white/20 focus:ring-[var(--accent)]" />
                        <label htmlFor="paid-status" className="text-sm font-semibold text-[var(--text-primary)]">Paid?</label>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total</div>
                        <div className="text-3xl font-bold text-price">${data.total.toFixed(2)}</div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-white/[0.02] text-center no-print border-t border-[var(--border)]">
                <button onClick={() => window.print()} className="btn btn-primary px-6 py-2 text-sm">
                    Print Invoice
                </button>
            </footer>
        </div>
    );
};

/* ── Input class ── */
const inputCls = "w-full bg-white/[0.04] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm [color-scheme:dark] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:outline-none transition-all";

/* ── Main Form ── */
function InvoicesPage() {
    const [formData, setFormData] = useState({
        customer: '',
        batch: '',
        idType: idOptions[0].name,
        unitPrice: idOptions[0].price,
        quantity: 1,
        paymentMethod: paymentMethods[0],
        handlingFee: 5.00
    });

    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (invoiceData && invoiceRef.current) {
            invoiceRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [invoiceData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIdTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value;
        const selectedOption = idOptions.find(opt => opt.name === selectedName);
        setFormData(prev => ({
            ...prev,
            idType: selectedName,
            unitPrice: selectedOption ? selectedOption.price : 0,
        }));
    };

    const handleGenerateInvoice = () => {
        const quantity = parseFloat(String(formData.quantity)) || 0;
        const unitPrice = parseFloat(String(formData.unitPrice)) || 0;
        const handlingFee = parseFloat(String(formData.handlingFee)) || 0;
        const subtotal = quantity * unitPrice;
        const total = subtotal + handlingFee;

        const customer = formData.customer || 'N/A';
        const batch = formData.batch || 'B0';
        const customerLastFour = customer.slice(-4);
        const orderNumber = `IDP${batch}${customerLastFour}`;
        const today = new Date();
        const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        setInvoiceData({
            ...formData,
            orderNumber,
            date: formattedDate,
            subtotal,
            total,
            unitPrice,
            quantity,
            handlingFee,
        });
    };

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <PrintStyles />
            <div className="max-w-4xl mx-auto">
                {/* Form Section */}
                <div className="glass p-8 md:p-12 mb-8 animate-fade-up">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Invoice Generator</h1>
                        <p className="text-[var(--text-tertiary)] text-sm mt-1">Create a new invoice</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="customer" className="text-label mb-1.5 block">Customer Info (Phone Number)</label>
                            <input type="text" id="customer" name="customer" value={formData.customer} onChange={handleChange} placeholder="e.g., 5712347562" className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="batch" className="text-label mb-1.5 block">Batch Number</label>
                            <input type="text" id="batch" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., B7" className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="id-type" className="text-label mb-1.5 block">Type of ID</label>
                            <select id="id-type" name="idType" value={formData.idType} onChange={handleIdTypeChange} className={inputCls}>
                                {idOptions.map(option => (
                                    <option key={option.name} value={option.name}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="unit-price" className="text-label mb-1.5 block">Unit Price ($)</label>
                            <input type="number" id="unit-price" name="unitPrice" value={formData.unitPrice} onChange={handleChange} step="0.01" min="0" className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="text-label mb-1.5 block">Quantity</label>
                            <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="1" className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="payment-method" className="text-label mb-1.5 block">Payment Method</label>
                            <select id="payment-method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className={inputCls}>
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-5">
                        <label htmlFor="handling-fee" className="text-label mb-1.5 block">Processing & Handling ($)</label>
                        <input type="number" id="handling-fee" name="handlingFee" value={formData.handlingFee} onChange={handleChange} step="0.01" min="0" className={inputCls} />
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={handleGenerateInvoice} className="btn btn-primary px-8 py-3 text-base">
                            Generate Invoice
                        </button>
                    </div>
                </div>

                {/* Invoice Display */}
                <div ref={invoiceRef}>
                    <Invoice data={invoiceData} />
                </div>
            </div>
        </div>
    );
}

export default withAdminAuth(InvoicesPage);
