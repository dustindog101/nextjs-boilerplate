"use client";
import React, { useState } from 'react';

// --- Type definition for the fetched order data ---
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered'; // Expanded possible statuses
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid'; // Explicitly from DB
  price: {
    subtotal: number;
    total: number;
  };
  ids: any[]; // Array of ID details
  // Add other fields from your DynamoDB item as needed for display
}

// --- Statuses for the progress tracker ---
// These map to the 'status' field from your DynamoDB item
const TRACKING_STAGES = [
  { key: 'pending', label: 'Order Created' },
  { key: 'processing', label: 'Order Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }, // Added delivered for a complete flow
];

// --- Payment Method Icons (reusing from checkout concept) ---
const getPaymentMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'bitcoin': return '₿';
    case 'zelle': return 'Z';
    case 'apple pay': return '';
    case 'cash app': return '$';
    case 'venmo': return 'V';
    default: return '';
  }
};

// --- SVG Icons ---
// Modified SVG components to accept className prop
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

// New Icons for Tracking Stages
const OrderCreatedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const ProcessingIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const ShippedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;
const DeliveredIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M22 11V3H2v8H22zM2 11h4v3H2v-3zm6 0h4v3H8v-3zm6 0h4v3h-4v-3z"></path><path d="M22 11V3h-2v8h2zm-20 0V3h2v8H2zm16 4H6l-2 5h16l-2-5z"></path></svg>; // Placeholder box icon


// --- Main App Component ---
export default function App() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderDetails | null>(null); // Stores full order data
  const [displayError, setDisplayError] = useState<string | null>(null); // For specific error messages

  // Lambda Function URL for order lookup
  // !!! IMPORTANT: REPLACE THIS WITH YOUR ACTUAL LAMBDA FUNCTION URL !!!
  const LAMBDA_LOOKUP_URL = 'https://wdzff7ud3albhgtlrtat2w46y40yglzn.lambda-url.us-east-1.on.aws/'; // Example: 'https://xxxxxxxxxxxx.lambda-url.us-east-1.on.aws/'

  const handleTrackOrder = async () => {
    // Clear previous results and errors
    setOrderData(null);
    setDisplayError(null);

    if (!orderNumber.trim()) {
        setDisplayError('Please enter an order number.');
        return;
    }
    
    setIsLoading(true);

    try {
        const payload = {
            requestType: "summary", // Requesting full summary
            orderId: orderNumber
        };

        console.log("Sending lookup payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(LAMBDA_LOOKUP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'cors'
        });

        const data = await response.json();

        if (response.ok) { // Status 200-299
            if (data) {
                setOrderData(data);
                setDisplayError(null); // Clear any previous errors
            } else {
                setDisplayError('Order data is empty. Please check the order number.');
            }
        } else if (response.status === 404) {
            setDisplayError(data.error || 'Order not found. Please check your order number and try again.');
        } else {
            setDisplayError(data.error || 'An unexpected error occurred while fetching order status.');
            console.error('Lambda Error Response:', data);
        }
    } catch (error: any) {
        console.error('Network or unexpected error during tracking:', error);
        setDisplayError(`Network error: ${error.message || 'Please check your internet connection and try again.'}`);
    } finally {
        setIsLoading(false);
    }
  };

  // Helper function to get the icon for each stage
  const getStageIcon = (stageKey: string) => {
    switch (stageKey) {
      case 'pending': return <OrderCreatedIcon className="text-gray-400" />;
      case 'processing': return <ProcessingIcon className="text-gray-400 animate-spin" />;
      case 'shipped': return <ShippedIcon className="text-gray-400" />;
      case 'delivered': return <DeliveredIcon className="text-gray-400" />;
      default: return null;
    }
  };

  return (
    // CHANGE 1: Main container modified for sticky footer layout. Removed `justify-center`.
    <div className="bg-gray-900 min-h-screen flex flex-col items-center p-4 text-center text-gray-200 font-inter">
      
      {/* Font Imports and Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
          .font-pirate-special {
            font-family: 'Uncial Antiqua', cursive;
          }
          .font-inter {
            font-family: 'Inter', sans-serif;
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          @keyframes pulse-ring {
            0% {
              transform: scale(0.33);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          .animate-pulse-ring {
            animation: pulse-ring 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
        `}
      </style>

      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <a href="/" className="flex items-center justify-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
            <BackArrowIcon />
            Back to Home
        </a>
      </div>

      {/* CHANGE 2: Added a wrapper div with `flex-grow` to push the footer down */}
      <div className="w-full flex-grow flex flex-col items-center justify-center">
        <main className="w-full max-w-md"> {/* This remains focused on search input */}
          {/* Main Heading */}
          <h1 className="font-pirate-special text-7xl md:text-8xl font-bold text-white tracking-wider mb-4">
            ID Pirate
          </h1>

          {/* Subheading */}
          <p className="mt-2 text-lg text-gray-400 mb-8">
            Track Your Treasure
          </p>

          {/* Tracking Input Section */}
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
                      <SearchIcon />
                      Check Status
                  </>
              )}
            </button>
          </div>
        </main>

        {/* --- Order Tracking Results Section (appears only after lookup) --- */}
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

        {orderData && !isLoading && !displayError && (
          <div className="mt-8 p-6 bg-gray-800/70 rounded-lg shadow-lg border border-gray-700 animate-fade-in w-full max-w-lg md:max-w-xl lg:max-w-3xl">
              <h2 className="text-3xl font-bold text-white mb-6 font-pirate-special">Order Tracking</h2>
              
              {/* Order Basic Info */}
              <div className="text-left mb-6 space-y-2 text-gray-300">
                  <p><span className="font-semibold text-white">Order ID:</span> {orderData.orderId}</p>
                  <p><span className="font-semibold text-white">Order Date:</span> {new Date(orderData.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-semibold text-white">Total Items:</span> {orderData.ids.length}</p>
                  <p><span className="font-semibold text-white">Total Price:</span> ${orderData.price?.total ? orderData.price.total.toFixed(2) : 'N/A'}</p>
              </div>

              {/* Payment Status */}
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
                              {/* Line connecting previous stage */}
                              {index > 0 && (
                                  <div className={`absolute left-0 right-0 h-1 bg-gradient-to-r ${isCompleted ? 'from-green-500 to-green-500' : 'from-gray-700 to-gray-700'} ${isCurrent ? 'to-transparent' : ''}`} style={{ width: `${(100 / (TRACKING_STAGES.length - 1)) * index}%`, zIndex: 0, top: '40%' }}></div>
                              )}
                              
                              {/* Stage Item */}
                              <div className={`relative z-10 flex flex-col items-center flex-1 mx-1`}>
                                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ease-in-out 
                                      ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                                      ${isCurrent ? 'ring-4 ring-blue-500 ring-offset-gray-800 animate-pulse-ring' : ''}
                                  `}>
                                      {isCurrent ? (
                                          <span className="text-white">
                                              {getStageIcon(stage.key)} {/* Display specific icon for current */}
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

      {/* CHANGE 3: Footer is no longer absolutely positioned and will be pushed down correctly. */}
      <footer className="w-full py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
