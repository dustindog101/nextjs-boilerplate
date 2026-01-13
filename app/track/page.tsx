"use client";
import React, { useState } from 'react';
import {
  SearchIcon,
  BackArrowIcon,
  OrderCreatedIcon,
  ProcessingIcon,
  ShippedIcon,
  DeliveredIcon,
} from '../components/icons';
import { Footer } from '../components/ui';
import { OrderDetails, TRACKING_STAGES } from '../../lib/types';

// --- Payment Method Icons ---
const getPaymentMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'bitcoin': return '₿';
    case 'zelle': return 'Z';
    case 'apple pay': return '';
    case 'cash app': return '$';
    case 'venmo': return 'V';
    default: return '';
  }
};

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderDetails | null>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);

  const LAMBDA_LOOKUP_URL = 'https://wdzff7ud3albhgtlrtat2w46y40yglzn.lambda-url.us-east-1.on.aws/';

  const handleTrackOrder = async () => {
    setOrderData(null);
    setDisplayError(null);

    if (!orderNumber.trim()) {
      setDisplayError('Please enter an order number.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        requestType: "summary",
        orderId: orderNumber
      };

      const response = await fetch(LAMBDA_LOOKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      const data = await response.json();

      if (response.ok) {
        if (data) {
          setOrderData(data);
          setDisplayError(null);
        } else {
          setDisplayError('Order data is empty. Please check the order number.');
        }
      } else if (response.status === 404) {
        setDisplayError(data.error || 'Order not found. Please check your order number and try again.');
      } else {
        setDisplayError(data.error || 'An unexpected error occurred while fetching order status.');
      }
    } catch (error: any) {
      setDisplayError(`Network error: ${error.message || 'Please check your internet connection and try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageIcon = (stageKey: string) => {
    switch (stageKey) {
      case 'pending': return <OrderCreatedIcon className="h-6 w-6 text-gray-400" />;
      case 'processing': return <ProcessingIcon className="h-6 w-6 text-gray-400 animate-spin" />;
      case 'shipped': return <ShippedIcon className="h-6 w-6 text-gray-400" />;
      case 'delivered': return <DeliveredIcon className="h-6 w-6 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center p-4 text-center text-gray-200">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <a href="/" className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
          <BackArrowIcon className="mr-2 h-5 w-5" />
          Back to Home
        </a>
      </div>

      <div className="w-full flex-grow flex flex-col items-center justify-center">
        <main className="w-full max-w-md">
          <h1 className="font-pirate text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
            ID Pirate
          </h1>

          <p className="mt-2 text-lg text-gray-400 mb-8">
            Track Your Treasure
          </p>

          <div className="flex flex-col space-y-4">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter your order number..."
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
            />
            <button
              onClick={handleTrackOrder}
              disabled={isLoading}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-5 w-5" />
                  Check Status
                </>
              )}
            </button>
          </div>
        </main>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 p-6 bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 animate-fade-in w-full max-w-lg md:max-w-xl lg:max-w-2xl">
            <p className="text-center text-blue-400 text-lg font-semibold flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading order details...
            </p>
          </div>
        )}

        {/* Error State */}
        {displayError && !isLoading && (
          <div className="mt-8 p-6 bg-red-800/70 rounded-lg shadow-lg border border-red-700 animate-fade-in w-full max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h2 className="text-xl font-bold text-red-400 mt-4">Error</h2>
              <p className="text-gray-300 mt-2">{displayError}</p>
            </div>
          </div>
        )}

        {/* Order Results */}
        {orderData && !isLoading && !displayError && (
          <div className="mt-8 p-6 bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 animate-fade-in w-full max-w-lg md:max-w-xl lg:max-w-3xl">
            <h2 className="text-3xl font-bold text-white mb-6 font-pirate">Order Tracking</h2>

            <div className="text-left mb-6 space-y-2 text-gray-300">
              <p><span className="font-semibold text-white">Order ID:</span> {orderData.orderId}</p>
              <p><span className="font-semibold text-white">Order Date:</span> {new Date(orderData.createdAt).toLocaleDateString()}</p>
              <p><span className="font-semibold text-white">Total Items:</span> {orderData.ids.length}</p>
              <p><span className="font-semibold text-white">Total Price:</span> ${orderData.price?.total ? orderData.price.total.toFixed(2) : 'N/A'}</p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg mb-6 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">Payment Status: <span className={`${orderData.paymentStatus === 'Paid' ? 'text-green-400' : 'text-red-400'}`}>{orderData.paymentStatus || 'N/A'}</span></h3>
              <div className="flex items-center text-xl font-bold text-gray-300">
                <span className="mr-2 text-blue-400 text-3xl">{getPaymentMethodIcon(orderData.paymentMethod || '')}</span>
                {orderData.paymentMethod || 'N/A'}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="relative flex justify-between items-center text-center py-6 px-2 sm:px-4">
              {TRACKING_STAGES.map((stage, index) => {
                const currentStageIndex = TRACKING_STAGES.findIndex(s => s.key === orderData.status);
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <React.Fragment key={stage.key}>
                    {index > 0 && (
                      <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r ${isCompleted ? 'from-green-500 to-green-500' : 'from-gray-700 to-gray-700'} ${isCurrent ? 'to-transparent' : ''}`} style={{ width: `${(100 / (TRACKING_STAGES.length - 1)) * index}%`, zIndex: 0, top: '40%' }}></div>
                    )}

                    <div className={`relative z-10 flex flex-col items-center flex-1 mx-1`}>
                      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out 
                                      ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                                      ${isCurrent ? 'ring-4 ring-blue-500 ring-offset-gray-800' : ''}
                                  `}>
                        {isCurrent ? (
                          <span className="text-white">
                            {getStageIcon(stage.key)}
                          </span>
                        ) : (
                          <svg className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        )}
                      </div>
                      <p className={`mt-2 text-sm text-center font-semibold ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{stage.label}</p>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer className="w-full" />
    </div>
  );
}
