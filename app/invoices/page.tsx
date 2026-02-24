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
                        <h1 className="font-pirate text-4xl md:text-5xl text-white tracking-wider">ID Pirate</h1>
                        <p className="text-zinc-500 text-sm">idpirate.com</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">INVOICE</h2>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="space-y-2 text-sm">
                        <div className="flex"><span className="text-zinc-500 w-32">Order Number:</span><span className="text-white">{data.orderNumber}</span></div>
                        <div className="flex"><span className="text-zinc-500 w-32">Date:</span><span className="text-white">{data.date}</span></div>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06]">
                        <div className="flex text-sm"><span className="text-zinc-500 w-20">Customer:</span><span className="text-white">{data.customer}</span></div>
                    </div>
                </section>

                <section className="mb-10">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.08]">
                                <th className="p-3 text-xs font-semibold uppercase text-zinc-500 tracking-wider">Item</th>
                                <th className="p-3 text-center text-xs font-semibold uppercase text-zinc-500 tracking-wider">Qty</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase text-zinc-500 tracking-wider">Unit Price</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase text-zinc-500 tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/[0.04]">
                                <td className="p-3 text-white">{data.idType}</td>
                                <td className="p-3 text-center text-zinc-300">{data.quantity}</td>
                                <td className="p-3 text-right text-zinc-300">${data.unitPrice.toFixed(2)}</td>
                                <td className="p-3 text-right text-white font-medium">${data.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-white/[0.04]">
                                <td className="p-3 text-zinc-400">Processing & Handling</td>
                                <td className="p-3"></td>
                                <td className="p-3"></td>
                                <td className="p-3 text-right text-zinc-300">${data.handlingFee.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="mb-10 border-t border-white/[0.06] pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Payment Method</h3>
                            <div className="bg-white/[0.03] px-4 py-2 rounded-lg w-fit border border-white/[0.06]">
                                <span className="text-white font-medium text-sm">{data.paymentMethod}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-start md:justify-end md:pt-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="crypto-discount" className="h-4 w-4 rounded bg-white/[0.04] border-white/[0.08] text-indigo-500 focus:ring-indigo-600" />
                                <label htmlFor="crypto-discount" className="text-sm font-semibold text-white">Crypto Discount</label>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="paid-status" className="h-4 w-4 rounded bg-white/[0.04] border-white/[0.08] text-indigo-500 focus:ring-indigo-600" />
                        <label htmlFor="paid-status" className="text-sm font-semibold text-white">Paid?</label>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total</div>
                        <div className="text-3xl font-bold text-price">${data.total.toFixed(2)}</div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-white/[0.02] text-center no-print border-t border-white/[0.06]">
                <button onClick={() => window.print()} className="btn btn-primary px-6 py-2 text-sm">
                    Print Invoice
                </button>
            </footer>
        </div>
    );
};

/* ── Input class ── */
const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all";

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
                        <h1 className="text-3xl font-bold text-white tracking-tight">Invoice Generator</h1>
                        <p className="text-zinc-500 text-sm mt-1">Create a new invoice</p>
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
