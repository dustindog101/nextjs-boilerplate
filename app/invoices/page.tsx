"use client";
import React, { useState, useEffect, useRef } from 'react';

// --- Type Definitions for TypeScript ---
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

// You can add these font imports to your global CSS file in your Next.js project.
// For this example, I'm including them in a style tag for self-containment.
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Pirata+One&display=swap');
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-pirate {
      font-family: 'Pirata One', cursive;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #invoice-container, #invoice-container * {
        visibility: visible;
      }
      #invoice-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  `}</style>
);

// Data for the ID types and their prices
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

const paymentMethods = [
    'Apple Pay', 'Crypto', 'Zelle', 'Card', 'Venmo', 'Cash App'
];

// Main Invoice Component
const Invoice: React.FC<{ data: InvoiceData | null }> = ({ data }) => {
    if (!data) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div id="invoice-container" className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-xl overflow-hidden mt-8">
            <div className="p-8 md:p-12">
                <header className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="font-pirate text-5xl md:text-6xl text-white tracking-wider">ID Pirate</h1>
                        <p className="text-gray-400">idpirate.com</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">INVOICE</h2>
                    </div>
                </header>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center"><span className="font-semibold text-gray-400 w-32">Order Number:</span><span className="ml-2 text-white">{data.orderNumber}</span></div>
                        <div className="flex items-center"><span className="font-semibold text-gray-400 w-32">Date:</span><span className="ml-2 text-white">{data.date}</span></div>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="flex items-center"><span className="font-semibold text-gray-400 w-20">Customer:</span><span className="ml-2 text-white">{data.customer}</span></div>
                    </div>
                </section>
                <section className="mb-12">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-600">
                                <th className="p-3 text-sm font-semibold uppercase text-gray-400">Item</th>
                                <th className="p-3 text-center text-sm font-semibold uppercase text-gray-400">Quantity</th>
                                <th className="p-3 text-right text-sm font-semibold uppercase text-gray-400">Unit Price</th>
                                <th className="p-3 text-right text-sm font-semibold uppercase text-gray-400">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-700">
                                <td className="p-3">{data.idType}</td>
                                <td className="p-3 text-center">{data.quantity}</td>
                                <td className="p-3 text-right">${data.unitPrice.toFixed(2)}</td>
                                <td className="p-3 text-right">${data.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-gray-700">
                                <td className="p-3">Processing & Handling</td>
                                <td className="p-3 text-center"></td>
                                <td className="p-3 text-right"></td>
                                <td className="p-3 text-right">${data.handlingFee.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <section className="mb-12 border-t border-gray-700 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-gray-400 mb-2 uppercase text-sm">Payment Method</h3>
                            <div className="flex items-center space-x-3 bg-black/20 p-3 rounded-lg w-fit">
                                <span className="text-white font-medium">{data.paymentMethod}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-start md:justify-end md:pt-6">
                            <div className="flex items-center space-x-3"><input type="checkbox" id="crypto-discount" className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 rounded" /><label htmlFor="crypto-discount" className="text-lg font-semibold text-white">Crypto Discount</label></div>
                        </div>
                    </div>
                </section>
                <section className="flex justify-between items-start">
                    <div className="flex items-center space-x-3"><input type="checkbox" id="paid-status" className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 rounded" /><label htmlFor="paid-status" className="text-lg font-semibold text-white">Paid?</label></div>
                    <div className="text-right">
                        <div className="text-gray-400 mb-1">Total</div>
                        <div className="text-4xl font-bold text-white">${data.total.toFixed(2)}</div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-gray-900/50 text-center no-print">
                <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Print Invoice</button>
            </footer>
        </div>
    );
};


// Main App Component
export default function App() {
    // State to hold all form data
    const [formData, setFormData] = useState({
        customer: '',
        batch: '',
        idType: idOptions[0].name, // Default to the first ID type
        unitPrice: idOptions[0].price, // Default to the first price
        quantity: 1,
        paymentMethod: paymentMethods[0], // Default to the first payment method
        handlingFee: 5.00
    });

    // State for the generated invoice data
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    // Effect to scroll to the invoice when it's generated
    useEffect(() => {
        if (invoiceData && invoiceRef.current) {
            invoiceRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [invoiceData]);

    // Handle standard input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle changes to the ID type dropdown to also update the price
    const handleIdTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedName = e.target.value;
        const selectedOption = idOptions.find(opt => opt.name === selectedName);
        setFormData(prev => ({
            ...prev,
            idType: selectedName,
            unitPrice: selectedOption ? selectedOption.price : 0,
        }));
    };
    
    // Generate the invoice
    const handleGenerateInvoice = () => {
        // --- 1. Calculations ---
        const quantity = parseFloat(String(formData.quantity)) || 0;
        const unitPrice = parseFloat(String(formData.unitPrice)) || 0;
        const handlingFee = parseFloat(String(formData.handlingFee)) || 0;
        const subtotal = quantity * unitPrice;
        const total = subtotal + handlingFee;

        // --- 2. Generate dynamic data ---
        const customer = formData.customer || 'N/A';
        const batch = formData.batch || 'B0';
        const customerLastFour = customer.slice(-4);
        const orderNumber = `IDP${batch}${customerLastFour}`;
        const today = new Date();
        const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        // --- 3. Set invoice data to state ---
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
        <div className="bg-gray-900 text-gray-200 p-4 sm:p-8 min-h-screen">
            <GlobalStyles />
            <div className="max-w-4xl mx-auto">
                {/* MANAGER SECTION */}
                <div className="bg-gray-800 shadow-lg rounded-xl p-8 md:p-12 mb-8">
                    <header className="text-center mb-8">
                        <h1 className="font-pirate text-5xl md:text-6xl text-white tracking-wider">Invoice Generator</h1>
                        <p className="text-gray-400">Create a new invoice</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium text-gray-400 mb-2">Customer Info (Phone Number)</label>
                            <input type="text" id="customer" name="customer" value={formData.customer} onChange={handleChange} placeholder="e.g., 5712347562" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {/* Batch */}
                        <div>
                            <label htmlFor="batch" className="block text-sm font-medium text-gray-400 mb-2">Batch Number</label>
                            <input type="text" id="batch" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., B7" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {/* ID Type */}
                        <div>
                            <label htmlFor="id-type" className="block text-sm font-medium text-gray-400 mb-2">Type of ID</label>
                            <select id="id-type" name="idType" value={formData.idType} onChange={handleIdTypeChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                {idOptions.map(option => (
                                    <option key={option.name} value={option.name}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Unit Price */}
                        <div>
                            <label htmlFor="unit-price" className="block text-sm font-medium text-gray-400 mb-2">Unit Price ($)</label>
                            <input type="number" id="unit-price" name="unitPrice" value={formData.unitPrice} onChange={handleChange} step="0.01" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
                            <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="1" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {/* Payment Method */}
                        <div>
                            <label htmlFor="payment-method" className="block text-sm font-medium text-gray-400 mb-2">Payment Method</label>
                            <select id="payment-method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                {paymentMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="mt-6">
                        <label htmlFor="handling-fee" className="block text-sm font-medium text-gray-400 mb-2">Processing & Handling ($)</label>
                        <input type="number" id="handling-fee" name="handlingFee" value={formData.handlingFee} onChange={handleChange} step="0.01" min="0" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={handleGenerateInvoice} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                            Generate Invoice
                        </button>
                    </div>
                </div>

                {/* INVOICE DISPLAY SECTION */}
                <div ref={invoiceRef}>
                    <Invoice data={invoiceData} />
                </div>
            </div>
        </div>
    );
}
