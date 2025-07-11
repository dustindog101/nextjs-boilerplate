// --- START OF FILE app/checkout/page.tsx (Corrected) ---

"use client";
import React, { useState, useEffect } from 'react'; // <-- CORRECTED IMPORT STATEMENT
import { withAuth } from '../components/withAuth';
import { useAuth } from '../hooks/useAuth';

// --- Type Definitions ---
interface IdFormData {
  id: number;
  state: string;
  dobMonth: string; dobDay: string; dobYear: string;
  issueMonth: string; issueDay: string; issueYear: string;
  firstName: string; middleName: string; lastName: string;
  streetAddress: string; city: string; zipCode: string; zipPlus4: string;
  heightFeet: string; heightInches: string; weight: string;
  eyeColor: string; hairColor: string; sex: string;
}

// --- Component Data ---
const paymentMethods = [ { name: 'Bitcoin', icon: '₿' }, { name: 'Zelle', icon: 'Z' }, { name: 'Apple Pay', icon: '' }, { name: 'Cash App', icon: '$' }, { name: 'Venmo', icon: 'V' } ];
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

function CheckoutPage() {
    const { user } = useAuth();
    const [orderItems, setOrderItems] = useState<IdFormData[]>([]);
    const [deliveryMethod, setDeliveryMethod] = useState<'local' | 'shipping'>('shipping');
    const [activePayment, setActivePayment] = useState<string>(paymentMethods[0].name);
    const [orderNotes, setOrderNotes] = useState('');
    const [shippingFullName, setShippingFullName] = useState('');
    const [shippingStreetAddress, setShippingStreetAddress] = useState('');
    const [shippingCity, setShippingCity] = useState('');
    const [shippingStateProvince, setShippingStateProvince] = useState('');
    const [shippingZipCode, setShippingZipCode] = useState('');
    const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [orderMessage, setOrderMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const BASE_PRICE_PER_ID = 95.00;
    const HANDLING_FEE = 5.00;
    const SHIPPING_FEE = deliveryMethod === 'shipping' ? 15.00 : 0;
    
    useEffect(() => {
        try {
            const storedForms = localStorage.getItem('idPirateOrderForms');
            if (storedForms) {
                setOrderItems(JSON.parse(storedForms));
            } else {
                console.warn("No order data found.");
            }
        } catch (error) { console.error('Failed to parse order forms:', error); }
    }, []);

    const subtotal = orderItems.reduce((acc) => acc + BASE_PRICE_PER_ID, 0);
    const total = subtotal + HANDLING_FEE + SHIPPING_FEE;

    const handleFinalOrderSubmit = async () => {
        if (!user) {
            setOrderStatus('error'); setOrderMessage('You must be logged in to place an order.'); setShowModal(true); return;
        }
        if (orderItems.length === 0) {
            setOrderStatus('error'); setOrderMessage('No items in order.'); setShowModal(true); return;
        }
        if (deliveryMethod === 'shipping' && (!shippingFullName.trim() || !shippingStreetAddress.trim() || !shippingCity.trim() || !shippingStateProvince.trim() || !shippingZipCode.trim())) {
            setOrderStatus('error'); setOrderMessage('Please fill in all shipping address details.'); setShowModal(true); return;
        }

        setLoading(true); setOrderStatus('processing'); setOrderMessage('Submitting your order...'); setShowModal(true);

        const fullShippingAddress = deliveryMethod === 'shipping' ? `${shippingFullName}, ${shippingStreetAddress}, ${shippingCity}, ${shippingStateProvince}, ${shippingZipCode}, USA` : "Local Delivery";
        const idsPayload = orderItems.map(idForm => ({
            state: idForm.state, dob: `${idForm.dobYear}-${idForm.dobMonth}-${idForm.dobDay}`,
            issueDate: `${idForm.issueYear}-${idForm.issueMonth}-${idForm.issueDay}`, ...idForm
        }));

        const orderPayload = {
            userId: user.userId,
            shipping: fullShippingAddress, paymentMethod: activePayment, notes: orderNotes,
            price: { subtotal, total }, ids: idsPayload,
        };

        try {
            const response = await fetch('https://bc67gwp363wx7fs73yfxr3hnq40zuobe.lambda-url.us-east-1.on.aws/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload), mode: 'cors'
            });
            const data = await response.json();
            if (response.ok) {
                setOrderStatus('success'); setOrderMessage(`Order placed! ID: ${data.orderId}`);
                localStorage.removeItem('idPirateOrderForms');
            } else {
                setOrderStatus('error'); setOrderMessage(`Error: ${data.error || 'Failed to submit.'}`);
            }
        } catch (error: any) {
            setOrderStatus('error'); setOrderMessage(`Network error: ${error.message || 'Please try again.'}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="text-gray-200">
            <style>{`.font-pirate-special { font-family: 'Uncial Antiqua', cursive; }`}</style>
            <div className="container mx-auto p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="font-pirate-special text-6xl md:text-7xl font-bold text-white tracking-wider">Order Overview</h1>
                    <p className="mt-2 text-lg text-gray-400">Review your details and submit your order.</p>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-2/3 space-y-8">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
                            {orderItems.length > 0 ? (
                                <div className="space-y-4">
                                    {orderItems.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg">
                                            <div><p className="font-bold text-lg">{item.state} ID</p><p className="text-sm text-gray-400">{item.firstName || 'N/A'} {item.lastName || 'N/A'}</p></div>
                                            <p className="font-bold text-lg">${BASE_PRICE_PER_ID.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-gray-500 text-center py-4">No IDs added.</p>)}
                            <a href="/order/new" className="inline-flex items-center text-blue-400 hover:text-blue-300 mt-4 text-sm"><EditIcon /> Edit Order</a>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <label htmlFor="order-notes" className="block text-2xl font-bold text-white mb-4">Order Notes</label>
                            <textarea id="order-notes" rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500" placeholder="Add any special instructions..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}></textarea>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Delivery Method</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => setDeliveryMethod('local')} className={`p-4 rounded-lg border-2 text-left transition ${deliveryMethod === 'local' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}>
                                    <h3 className="font-bold text-lg">Local Delivery</h3><p className="text-sm text-gray-400">Arrange for local pickup.</p></button>
                                <button onClick={() => setDeliveryMethod('shipping')} className={`p-4 rounded-lg border-2 text-left transition ${deliveryMethod === 'shipping' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}>
                                    <h3 className="font-bold text-lg">Shipping</h3><p className="text-sm text-gray-400">Deliver to your address.</p></button>
                            </div>
                            {deliveryMethod === 'shipping' && (
                                <div className="mt-6 border-t border-gray-700 pt-6 space-y-4">
                                    <h3 className="font-bold text-lg text-white mb-2">Shipping Address</h3>
                                    <input type="text" placeholder="Full Name" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" value={shippingFullName} onChange={(e) => setShippingFullName(e.target.value)} />
                                    <input type="text" placeholder="Street Address" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" value={shippingStreetAddress} onChange={(e) => setShippingStreetAddress(e.target.value)} />
                                    <div className="grid grid-cols-3 gap-4">
                                        <input type="text" placeholder="City" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                                        <input type="text" placeholder="State / Province" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" value={shippingStateProvince} onChange={(e) => setShippingStateProvince(e.target.value)} />
                                        <input type="text" placeholder="ZIP / Postal Code" className="col-span-3 sm:col-span-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" value={shippingZipCode} onChange={(e) => setShippingZipCode(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-24 bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Cost Breakdown</h2>
                                <div className="space-y-2 text-gray-300">
                                    <div className="flex justify-between"><span>Subtotal ({orderItems.length} IDs)</span><span>${subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Handling</span><span>${HANDLING_FEE.toFixed(2)}</span></div>
                                    {deliveryMethod === 'shipping' && <div className="flex justify-between"><span>Shipping</span><span>${SHIPPING_FEE.toFixed(2)}</span></div>}
                                    <div className="border-t border-gray-600 my-2"></div>
                                    <div className="flex justify-between text-white font-bold text-xl"><span>Total</span><span>${total.toFixed(2)}</span></div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    {paymentMethods.map(method => (<button key={method.name} onClick={() => setActivePayment(method.name)} className={`w-full flex items-center p-3 rounded-lg border-2 transition ${activePayment === method.name ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'}`}><span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-700 mr-3 font-bold text-lg">{method.icon}</span><span className="font-semibold">{method.name}</span></button>))}
                                </div>
                            </div>
                            <button onClick={handleFinalOrderSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg flex items-center justify-center" disabled={loading || orderItems.length === 0}>
                                {loading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Submit Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="text-center py-8 text-gray-500 text-sm">© {new Date().getFullYear()} ID Pirate. All rights reserved.</footer>
            {showModal && (<div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"><div className={`bg-gray-800 rounded-lg p-8 shadow-xl border-2 ${orderStatus === 'success' ? 'border-green-500' : (orderStatus === 'error' ? 'border-red-500' : 'border-blue-500')}`}><h3 className={`text-2xl font-bold mb-4 text-center ${orderStatus === 'success' ? 'text-green-400' : (orderStatus === 'error' ? 'text-red-400' : 'text-blue-400')}`}>{orderStatus === 'processing' ? 'Processing...' : orderStatus === 'success' ? 'Order Placed!' : 'Order Failed'}</h3><p className="text-gray-300 text-center mb-6">{orderMessage}</p>{!loading && (<button onClick={() => setShowModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>)}</div></div>)}
        </div>
    );
}

export default withAuth(CheckoutPage);
// --- END OF FILE app/checkout/page.tsx (Corrected) ---