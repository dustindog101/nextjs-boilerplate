"use client";
import React, { useState } from 'react';

// --- Type Definitions ---
interface OrderItem {
  id: number;
  state: string;
  price: number;
  firstName: string;
  lastName: string;
}

// --- Mock Data (in a real app, this would come from the previous page's state) ---
const mockOrderItems: OrderItem[] = [
  { id: 1, state: 'Pennsylvania', price: 90, firstName: 'John', lastName: 'Doe' },
  { id: 2, state: 'New Jersey', price: 100, firstName: 'Jane', lastName: 'Smith' },
];

const paymentMethods = [
    { name: 'Bitcoin', icon: '₿' },
    { name: 'Zelle', icon: 'Z' },
    { name: 'Apple Pay', icon: '' },
    { name: 'Cash App', icon: '$' },
    { name: 'Venmo', icon: 'V' }
];

// --- SVG Icons ---
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

// --- Main Page Component ---
export default function CheckoutPage() {
    const [deliveryMethod, setDeliveryMethod] = useState<'local' | 'shipping'>('shipping');
    const [activePayment, setActivePayment] = useState<string>(paymentMethods[0].name);

    // --- Calculations ---
    const subtotal = mockOrderItems.reduce((acc, item) => acc + item.price, 0);
    const handlingFee = 5.00;
    const shippingFee = deliveryMethod === 'shipping' ? 15.00 : 0;
    const total = subtotal + handlingFee + shippingFee;

    return (
        <div className="bg-gray-900 min-h-screen text-gray-200">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
              .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
            `}</style>

            <div className="container mx-auto p-4 sm:p-8">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <a href="/order/new" className="inline-flex items-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors">
                        <BackArrowIcon /> Back to Edit Order
                    </a>
                </div>

                <header className="text-center mb-12">
                    <h1 className="font-pirate-special text-6xl md:text-7xl font-bold text-white tracking-wider">
                        Order Overview
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Review your details and submit your order.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column */}
                    <div className="w-full lg:w-2/3 space-y-8">
                        {/* Order Summary */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
                            <div className="space-y-4">
                                {mockOrderItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg">
                                        <div>
                                            <p className="font-bold text-lg">{item.state} ID</p>
                                            <p className="text-sm text-gray-400">{item.firstName} {item.lastName}</p>
                                        </div>
                                        <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                             <a href="/order/new" className="inline-flex items-center text-blue-400 hover:text-blue-300 mt-4 text-sm">
                                <EditIcon /> Edit Order
                            </a>
                        </div>

                        {/* Order Notes */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                           <label htmlFor="order-notes" className="block text-2xl font-bold text-white mb-4">Order Notes</label>
                           <textarea id="order-notes" rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500" placeholder="Add any special instructions for your order..."></textarea>
                        </div>
                        
                        {/* Delivery Method */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Delivery Method</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => setDeliveryMethod('local')} className={`p-4 rounded-lg border-2 text-left transition ${deliveryMethod === 'local' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}>
                                    <h3 className="font-bold text-lg">Local Delivery</h3>
                                    <p className="text-sm text-gray-400">Arrange for local pickup or drop-off.</p>
                                </button>
                                <button onClick={() => setDeliveryMethod('shipping')} className={`p-4 rounded-lg border-2 text-left transition ${deliveryMethod === 'shipping' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}>
                                     <h3 className="font-bold text-lg">Shipping</h3>
                                    <p className="text-sm text-gray-400">Get your order delivered to your address.</p>
                                </button>
                            </div>
                            {/* Shipping Address Form */}
                            {deliveryMethod === 'shipping' && (
                                <div className="mt-6 border-t border-gray-700 pt-6 space-y-4">
                                     <h3 className="font-bold text-lg text-white mb-2">Shipping Address</h3>
                                     <input type="text" placeholder="Full Name" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                     <input type="text" placeholder="Street Address" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                     <div className="grid grid-cols-3 gap-4">
                                         <input type="text" placeholder="City" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                         <input type="text" placeholder="State / Province" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                         <input type="text" placeholder="ZIP / Postal Code" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-8 bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
                            {/* Cost Breakdown */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Cost Breakdown</h2>
                                <div className="space-y-2 text-gray-300">
                                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Processing & Handling</span><span>${handlingFee.toFixed(2)}</span></div>
                                    {deliveryMethod === 'shipping' && <div className="flex justify-between"><span>Shipping</span><span>${shippingFee.toFixed(2)}</span></div>}
                                    <div className="border-t border-gray-600 my-2"></div>
                                    <div className="flex justify-between text-white font-bold text-xl"><span>Total</span><span>${total.toFixed(2)}</span></div>
                                </div>
                            </div>

                            {/* Payment Method */}
                             <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    {paymentMethods.map(method => (
                                        <button key={method.name} onClick={() => setActivePayment(method.name)} className={`w-full flex items-center p-3 rounded-lg border-2 transition ${activePayment === method.name ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}>
                                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-700 mr-3 font-bold text-lg">{method.icon}</span>
                                            <span className="font-semibold">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Submit Button */}
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg">
                                Submit Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             <footer className="text-center py-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
            </footer>
        </div>
    );
}
