"use client";
import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router'; // Changed from 'next/navigation' to 'next/router' for broader compatibility
// In a full Next.js app, you would use `useRouter` for navigation.
// For this environment, we'll use window.location.href directly for simplicity.

// --- Interfaces ---
interface JwtPayload {
  userId: string;
  username: string;
  exp: number; // Expiration timestamp in seconds
}

interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid';
  price: {
    subtotal: number;
    total: number;
  };
  ids: any[]; // Array of ID details, or could be more specific
  numberOfIds?: number; // Added by Lambda for summary/list
}

// --- SVG Icons ---
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path>
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const HashIcon = () => ( // Simple hash/pound icon
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
    <line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);
const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
    <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);


// --- Main Dashboard Component ---
export default function DashboardPage() {
  // const router = useRouter(); // Uncomment for full Next.js app
  const [loggedInUser, setLoggedInUser] = useState<JwtPayload | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Tracks initial auth check
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Lambda Function URL for Order Lookup
  // IMPORTANT: For local MVP testing, this URL is commented out for mock data.
  // Uncomment and replace with your actual URL when deploying to server.
  // const LAMBDA_LOOKUP_URL = 'https://wdzff7ud3albhgtlrtat2w46y40yglzn.lambda-url.us-east-1.on.aws/'; 

  // --- Utility function to decode JWT ---
  // This function is still useful for local JWT parsing.
  const decodeJwt = (token: string): JwtPayload | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      return decoded;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  // --- Check authentication status on mount ---
  useEffect(() => {
    // --- MVP Placeholder Start ---
    // Simulate being logged in for MVP testing.
    // In a real scenario, this would involve verifying a JWT from localStorage with the backend.
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJtdnAtZGV2LWxvY2FsLXVzZXIiLCJ1c2VybmFtZSI6Ik1WUEN1c3RvbWVyIiwiZXhwIjoxNzA1NTk2MDAwMH0.signature"; // A mock token (expired in reality, but we'll bypass real validation)
    const mockDecoded: JwtPayload = {
      userId: "mvp-dev-local-user",
      username: "MVPCustomer",
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expire in 1 hour from now for local checks
    };

    // For MVP, we'll assume a successful auth check directly.
    // Replace this block with actual JWT verification on client-side and backend call.
    setLoggedInUser(mockDecoded);
    setIsAuthChecking(false);
    
    // Call mock data fetch
    fetchUserOrders(mockDecoded.userId, mockToken); // Pass mock data
    // --- MVP Placeholder End ---

    /* // --- Uncomment this block for actual server integration ---
    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) {
      window.location.href = '/account'; // Redirect to login if no token
      return;
    }

    const decoded = decodeJwt(token);
    // In a real scenario, you might send this token to a backend /verify endpoint
    // to ensure it's truly valid and not just locally decoded.
    if (!decoded || decoded.exp * 1000 < Date.now()) { // Token invalid or expired
      localStorage.removeItem('idPirateAuthToken');
      window.location.href = '/account'; // Redirect to login
      return;
    }

    setLoggedInUser(decoded);
    setIsAuthChecking(false); // Auth check complete
    fetchUserOrders(decoded.userId, token); // Pass real token and userId
    */
  }, []); // Run only once on mount

  // --- Fetch User Orders (Modified for MVP placeholder data) ---
  // IMPORTANT: This function now uses static data for MVP.
  // Uncomment the server-side fetch logic when integrating with actual Lambda.
  const fetchUserOrders = async (userId: string, token: string) => { // token parameter kept for signature, but not used in MVP
    setIsLoadingOrders(true);
    setFetchError(null);

    // --- MVP Placeholder Start ---
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const staticOrders: OrderDetails[] = [
      {
        orderId: "mvp-order-001",
        createdAt: "2024-06-25T10:00:00Z",
        status: "shipped", // Example status
        paymentMethod: "Bitcoin",
        paymentStatus: "Paid",
        price: { subtotal: 190, total: 210 },
        ids: [{ /* simplified ID data */ state: 'Pennsylvania', firstName: 'John', lastName: 'Doe' }],
        numberOfIds: 1
      },
      {
        orderId: "mvp-order-002",
        createdAt: "2024-06-20T15:30:00Z",
        status: "processing", // Example status
        paymentMethod: "Zelle",
        paymentStatus: "Paid",
        price: { subtotal: 285, total: 305 },
        ids: [{ /* ... */ }, { /* ... */ }, { /* ... */ }],
        numberOfIds: 3
      },
      {
        orderId: "mvp-order-003",
        createdAt: "2024-06-18T08:15:00Z",
        status: "pending", // Example status
        paymentMethod: "Cash App",
        paymentStatus: "Unpaid",
        price: { subtotal: 95, total: 115 },
        ids: [{ /* ... */ }],
        numberOfIds: 1
      },
       {
        orderId: "mvp-order-004",
        createdAt: "2024-06-10T12:00:00Z",
        status: "delivered", // Example status
        paymentMethod: "Bitcoin",
        paymentStatus: "Paid",
        price: { subtotal: 100, total: 120 },
        ids: [{ /* ... */ }],
        numberOfIds: 1
      },
    ];

    setOrders(staticOrders);
    setFetchError(null); // Clear any errors
    setIsLoadingOrders(false);
    // --- MVP Placeholder End ---

    /* // --- Uncomment this block for actual server integration ---
    try {
      const payload = {
        requestType: "list_user_orders",
        userId: userId // Lambda will ignore this and use userId from JWT
      };

      const response = await fetch(LAMBDA_LOOKUP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      const data = await response.json();

      if (response.ok) {
        if (data.orders) {
          setOrders(data.orders);
        } else {
          setOrders([]); // No orders found
        }
        setFetchError(null);
      } else {
        setFetchError(data.error || 'Failed to fetch orders.');
        console.error('Order Fetch Error:', data);
      }
    } catch (error: any) {
      console.error('Network error fetching orders:', error);
      setFetchError(`Network error fetching orders: ${error.message || 'Please check your internet connection.'}`);
    } finally {
      setIsLoadingOrders(false);
    }
    */
  };

  // --- Handle User Logout ---
  const handleLogout = () => {
    localStorage.removeItem('idPirateAuthToken');
    // --- MVP Placeholder: No actual JWT removal needed for static MVP.
    // But keep this for future integration. ---
    window.location.href = '/account'; // Redirect to login page after logout
  };

  if (isAuthChecking) {
    return (
      <div className="bg-gray-900 min-h-screen text-gray-200 flex flex-col items-center justify-center">
        <p className="text-xl font-semibold">Checking authentication...</p>
        <svg className="animate-spin mt-4 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Header */}
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center px-8">
        <div className="flex items-center">
          <a href="/" className="flex items-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md">
            <BackArrowIcon />
            Home
          </a>
        </div>
        <h1 className="font-pirate-special text-4xl font-bold text-white tracking-wider">
          Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          {loggedInUser && (
            <span className="text-gray-300 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Welcome, <span className="font-semibold ml-1">{loggedInUser.username}</span>!
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-md transition-colors shadow-md"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 sm:p-8 mt-8">
        <h2 className="font-pirate-special text-4xl font-bold text-white text-center mb-8">
          My Orders
        </h2>

        {isLoadingOrders ? (
          <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <svg className="animate-spin mx-auto h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-4 text-xl text-gray-300">Loading your order history...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center p-8 bg-red-800/70 rounded-lg border border-red-700">
            <p className="text-xl text-red-400 font-semibold mb-2">Error Fetching Orders:</p>
            <p className="text-gray-300">{fetchError}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xl text-gray-400 font-semibold">No orders found for your account.</p>
            <p className="text-gray-500 mt-2">Time to create some treasure!</p>
            <a href="/order/new" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
              <PackageIcon /> Start New Order
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => (
              <div key={order.orderId} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl text-white mb-3 flex items-center">
                    <HashIcon /> Order #{order.orderId.substring(0, 8)}...
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center mb-2">
                    <CalendarIcon />
                    <span className="ml-1">Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </p>
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="font-semibold text-white">Status:</span> 
                    <span className={`ml-1 font-bold ${
                        order.status === 'shipped' || order.status === 'delivered' ? 'text-green-400' :
                        order.status === 'processing' ? 'text-blue-400' : 'text-yellow-400'
                    }`}>
                        {/* Map status key to display label */}
                        {
                          (order.status === 'pending' && 'Order Created') ||
                          (order.status === 'processing' && 'Order Processing') ||
                          (order.status === 'shipped' && 'Shipped') ||
                          (order.status === 'delivered' && 'Delivered') ||
                          order.status // Fallback if status key doesn't match
                        }
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm mb-2">
                    <span className="font-semibold text-white">IDs:</span> {order.numberOfIds || order.ids.length}
                  </p>
                  <p className="text-gray-400 text-sm flex items-center mb-4">
                    <DollarSignIcon />
                    <span className="ml-1">Total: ${order.price?.total ? order.price.total.toFixed(2) : 'N/A'}</span>
                  </p>
                </div>
                <a href={`/track?orderId=${order.orderId}`} className="mt-auto inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-md">
                  View Details
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-gray-500 text-sm text-center">
        &copy; {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}
