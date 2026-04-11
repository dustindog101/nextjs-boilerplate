"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { withAuth } from '../components/withAuth';
import { useAuth } from '../hooks/useAuth';
import { getStorageItem, removeStorageItem } from '../../lib/storage';
import { submitOrder, validateDiscount, DiscountValidation } from '../../lib/apiClient';
import { statePrices, defaultIdPrice, handlingFee as HANDLING_FEE, shippingFee as SHIPPING_BASE } from '../../lib/constants';
import { IdFormData } from '../../lib/types';
import { EditIcon } from '../components/icons';
import { Footer } from '../components/ui';
import { Spinner } from '../components/ui/Spinner';

// --- Component Data ---
const paymentMethods = [
    { name: 'Bitcoin', icon: '₿' },
    { name: 'Zelle', icon: 'Z' },
    { name: 'Apple Pay', icon: '' },
    { name: 'Cash App', icon: '$' },
    { name: 'Venmo', icon: 'V' },
];

const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none transition-all";

function CheckoutPage() {
    const { user } = useAuth();
    const router = useRouter();
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
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState<DiscountValidation | null>(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [showDiscountInput, setShowDiscountInput] = useState(false);

    const SHIPPING_FEE = deliveryMethod === 'shipping' ? SHIPPING_BASE : 0;

    useEffect(() => {
        const storedForms = getStorageItem('idPirateOrderForms');
        if (storedForms) {
            try {
                setOrderItems(JSON.parse(storedForms));
            } catch (error) { console.error('Failed to parse order forms:', error); }
        }
    }, []);

    const subtotal = orderItems.reduce((acc, item) => acc + (statePrices[item.state] ?? defaultIdPrice), 0);
    const discountAmount = discountResult?.discountAmount ?? 0;
    const total = subtotal + HANDLING_FEE + SHIPPING_FEE - discountAmount;

    const uploadsIncomplete =
        orderItems.length > 0 &&
        orderItems.some((item) => !item.photoKey || !item.signatureKey);

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setDiscountLoading(true);
        setDiscountError(null);
        setDiscountResult(null);
        try {
            const result = await validateDiscount(discountCode.trim(), subtotal + HANDLING_FEE + SHIPPING_FEE);
            setDiscountResult(result);
        } catch (err: any) {
            setDiscountError(err.message || 'Invalid code.');
        } finally {
            setDiscountLoading(false);
        }
    };

    const handleRemoveDiscount = () => {
        setDiscountResult(null);
        setDiscountCode('');
        setDiscountError(null);
    };

    const handleFinalOrderSubmit = async () => {
        if (!user) { setOrderStatus('error'); setOrderMessage('You must be logged in.'); setShowModal(true); return; }
        if (orderItems.length === 0) { setOrderStatus('error'); setOrderMessage('No items in order.'); setShowModal(true); return; }
        if (deliveryMethod === 'shipping' && (!shippingFullName.trim() || !shippingStreetAddress.trim() || !shippingCity.trim() || !shippingStateProvince.trim() || !shippingZipCode.trim())) {
            setOrderStatus('error'); setOrderMessage('Please fill in all shipping address details.'); setShowModal(true); return;
        }

        const missingAssets = orderItems.findIndex((item) => !item.photoKey || !item.signatureKey);
        if (missingAssets !== -1) {
            setOrderStatus('error');
            setOrderMessage(`ID #${missingAssets + 1} is missing photo or signature. Use Edit Order to upload.`);
            setShowModal(true);
            return;
        }

        setLoading(true); setOrderStatus('processing'); setOrderMessage('Submitting your order...'); setShowModal(true);

        const fullShippingAddress = deliveryMethod === 'shipping' ? `${shippingFullName}, ${shippingStreetAddress}, ${shippingCity}, ${shippingStateProvince}, ${shippingZipCode}, USA` : "Local Delivery";

        const idsPayload = orderItems.map(({ id, photo, signature, ...rest }) => ({
            ...rest,
            dob: `${rest.dobYear}-${rest.dobMonth}-${rest.dobDay}`,
            issueDate: `${rest.issueYear}-${rest.issueMonth}-${rest.issueDay}`,
        }));

        const orderPayload = {
            userId: user.userId,
            shipping: fullShippingAddress,
            paymentMethod: activePayment,
            notes: orderNotes,
            price: { subtotal, total },
            discountCode: discountResult?.code || undefined,
            ids: idsPayload,
        };

        try {
            const data = await submitOrder(orderPayload);
            setOrderStatus('success');
            setOrderMessage(`Order placed! ID: ${data.orderId}`);
            removeStorageItem('idPirateOrderForms');
        } catch (error: any) {
            setOrderStatus('error');
            setOrderMessage(`Error: ${error.message || 'Failed to submit.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                <header className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight animate-fade-up">
                        Checkout
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 animate-fade-up delay-1">Review your order and submit.</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="w-full lg:w-2/3 space-y-6">
                        {/* Order Items */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-1">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                            {orderItems.length > 0 ? (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="font-semibold text-slate-900">{item.state} ID</p>
                                                <p className="text-xs text-slate-500">{item.firstName || 'N/A'} {item.lastName || 'N/A'}</p>
                                            </div>
                                            <p className="text-price font-bold">${(statePrices[item.state] ?? defaultIdPrice).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-4 text-sm">No IDs added to your order.</p>
                            )}
                            <Link href="/order/new" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4 text-sm font-medium transition-colors">
                                <EditIcon className="h-4 w-4" /> Edit Order
                            </Link>
                        </div>

                        {/* Order Notes */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-2">
                            <label htmlFor="order-notes" className="text-label block mb-3">Order Notes</label>
                            <textarea
                                id="order-notes"
                                rows={3}
                                className={`${inputClasses} resize-none`}
                                placeholder="Any special instructions..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>

                        {/* Delivery Method */}
                        <div className="glass p-5 sm:p-6 animate-fade-up delay-3">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Delivery</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDeliveryMethod('local')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'local'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-slate-900">Local Pickup</h3>
                                    <p className="text-xs text-slate-500 mt-1">Free</p>
                                </button>
                                <button
                                    onClick={() => setDeliveryMethod('shipping')}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${deliveryMethod === 'shipping'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <h3 className="font-semibold text-sm text-slate-900">Shipping</h3>
                                    <p className="text-xs text-slate-500 mt-1">${SHIPPING_FEE.toFixed(2)}</p>
                                </button>
                            </div>
                            {deliveryMethod === 'shipping' && (
                                <div className="mt-5 border-t border-slate-200 pt-5 space-y-3">
                                    <h3 className="text-label mb-2">Shipping Address</h3>
                                    <input type="text" placeholder="Full Name" className={inputClasses} value={shippingFullName} onChange={(e) => setShippingFullName(e.target.value)} />
                                    <input type="text" placeholder="Street Address" className={inputClasses} value={shippingStreetAddress} onChange={(e) => setShippingStreetAddress(e.target.value)} />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input type="text" placeholder="City" className={inputClasses} value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                                        <input type="text" placeholder="State" className={inputClasses} value={shippingStateProvince} onChange={(e) => setShippingStateProvince(e.target.value)} />
                                        <input type="text" placeholder="ZIP Code" className={inputClasses} value={shippingZipCode} onChange={(e) => setShippingZipCode(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column — Sticky Sidebar */}
                    <div className="w-full lg:w-1/3">
                        <div className="lg:sticky top-20 glass p-5 sm:p-6 space-y-6 animate-fade-up delay-2">
                            {/* Cost Breakdown */}
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Total</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal ({orderItems.length} IDs)</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Processing</span>
                                        <span>${HANDLING_FEE.toFixed(2)}</span>
                                    </div>
                                    {deliveryMethod === 'shipping' && (
                                        <div className="flex justify-between text-slate-500">
                                            <span>Shipping</span>
                                            <span>${SHIPPING_FEE.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discountResult && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Discount ({discountResult.code})</span>
                                            <span>-${discountResult.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-slate-200 my-3" />
                                    <div className="flex justify-between text-slate-900 font-bold text-xl">
                                        <span>Total</span>
                                        <span className="text-price">${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Code */}
                            <div>
                                {discountResult ? (
                                    /* Applied state */
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                                                    ✅ {discountResult.code}
                                                </p>
                                                <p className="text-xs text-emerald-600 mt-0.5">
                                                    {discountResult.discountType === 'percentage'
                                                        ? `${discountResult.value}% off — saving $${discountResult.discountAmount.toFixed(2)}`
                                                        : `$${discountResult.value.toFixed(2)} off applied`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRemoveDiscount}
                                                className="text-xs text-emerald-600 hover:text-red-500 font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : showDiscountInput ? (
                                    /* Input state */
                                    <div>
                                        <h2 className="text-label mb-3">Discount Code</h2>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter code..."
                                                className={inputClasses}
                                                value={discountCode}
                                                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleApplyDiscount}
                                                disabled={discountLoading || !discountCode.trim()}
                                                className="btn btn-primary px-4 py-2.5 text-sm flex-shrink-0"
                                            >
                                                {discountLoading ? <Spinner size="sm" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {discountError && (
                                            <p className="text-red-500 text-xs mt-2">{discountError}</p>
                                        )}
                                        <button
                                            onClick={() => { setShowDiscountInput(false); setDiscountError(null); setDiscountCode(''); }}
                                            className="text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    /* Collapsed state */
                                    <button
                                        onClick={() => setShowDiscountInput(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                    >
                                        🏷️ Have a discount code?
                                    </button>
                                )}
                            </div>

                            {/* Payment */}
                            <div>
                                <h2 className="text-label mb-3">Payment Method</h2>
                                <div className="space-y-2">
                                    {paymentMethods.map(method => (
                                        <button
                                            key={method.name}
                                            onClick={() => setActivePayment(method.name)}
                                            className={`w-full flex items-center p-3 rounded-xl border transition-all cursor-pointer ${activePayment === method.name
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 mr-3 text-sm font-bold text-slate-600">{method.icon}</span>
                                            <span className="text-sm font-medium text-slate-900">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleFinalOrderSubmit}
                                className="btn btn-primary w-full py-3.5 text-base"
                                disabled={loading || orderItems.length === 0 || uploadsIncomplete}
                                title={uploadsIncomplete ? 'Upload photo and signature for each ID on the order form' : undefined}
                            >
                                {loading ? (
                                    <><Spinner size="sm" className="text-white" /> Processing...</>
                                ) : 'Submit Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-white rounded-2xl border shadow-xl p-8 max-w-sm w-full ${orderStatus === 'success' ? 'border-emerald-200' :
                        orderStatus === 'error' ? 'border-red-200' : 'border-blue-200'
                        } animate-fade-up`}>
                        <h3 className={`text-xl font-bold mb-3 text-center ${orderStatus === 'success' ? 'text-emerald-600' :
                            orderStatus === 'error' ? 'text-red-500' : 'text-blue-600'
                            }`}>
                            {orderStatus === 'processing' ? 'Processing...' : orderStatus === 'success' ? 'Order Placed!' : 'Error'}
                        </h3>
                        <p className="text-sm text-slate-500 text-center mb-6">{orderMessage}</p>
                        {!loading && (
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (orderStatus === 'success') {
                                        router.push('/dashboard');
                                    }
                                }}
                                className="btn btn-primary w-full"
                            >
                                {orderStatus === 'success' ? 'Go to Dashboard' : 'Close'}
                            </button>
                        )}
                        {loading && (
                            <div className="flex justify-center">
                                <Spinner size="md" className="text-blue-500" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAuth(CheckoutPage);