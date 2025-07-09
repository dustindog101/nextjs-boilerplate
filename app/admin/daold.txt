"use client";
import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router'; // Uncomment for full Next.js app
// For this MVP, we'll use window.location.href directly for navigation.

// --- Interfaces (Reused from other pages, expanded for admin needs) ---
interface JwtPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin'; // Role now included in JWT payload
  isReseller: boolean;   // Reseller status included
  exp: number; // Expiration timestamp in seconds
}

interface OrderDetails {
  orderId: string;
  userId: string; // User who placed the order
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid';
  price: {
    subtotal: number;
    total: number;
  };
  ids: any[]; // Array of ID details (simplified for dashboard view)
  numberOfIds?: number;
}

interface UserDetails {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  isReseller: boolean;
  referredBy?: string; // Optional
  createdAt: string;
  updatedAt: string;
}

interface DiscountCodeDetails {
  code: string;
  value: number;
  valueType: 'percentage' | 'fixed';
  expiryDate: string;
  maxUses: number | null;
  currentUses: number;
  createdAt: string;
}

// --- SVG Icons (Consistent styling) ---
const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${props.className || ''}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path>
  </svg>
);
const HashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M12.586 12.586a2 2 0 1 0 2.828 2.828L22 7V2h-5z"></path><path d="M2 12l6.64 6.64a2 2 0 0 0 2.828 0L22 7"></path>
  </svg>
);
const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="m21 2-2 2m-7 7-6 6M22 17a5 5 0 0 1-5 5c-1.74 0-3.3-1-4-2l-3.5-3.5a2 2 0 0 0 0-2.828L14.28 2.828a2 2 0 0 1 2.828 0L21 6"></path>
  </svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-8.13"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87C17.5 13.99 16.29 14 15 14s-2.5-.01-3.13-.87A4 4 0 0 0 7 21v2"></path><circle cx="15" cy="7" r="4"></circle>
  </svg>
);
const PercentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
const Edit3Icon = (props: React.SVGProps<SVGSVGElement>) => ( // Another edit icon
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${props.className || ''}`}>
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${props.className || ''}`}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);


// --- Main Dashboard Component ---
export default function AdminDashboardPage() {
  // const router = useRouter(); // Uncomment for full Next.js app
  const [loggedInUser, setLoggedInUser] = useState<JwtPayload | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'discounts'>('orders');

  const [isLoadingData, setIsLoadingData] = useState(false); // Unified loading state for tab content
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Mock Data States
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeDetails[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for user dropdown

  // --- Lambda Function URLs (Commented out for MVP) ---
  // const LAMBDA_LOOKUP_URL = 'https://your-order-lookup-lambda-url/'; // For orders: list_all_orders
  // const USER_MANAGEMENT_LAMBDA_URL = 'https://your-user-management-lambda-url/'; // For users: list_all_users, update_user_role, etc.
  // const DISCOUNT_MANAGEMENT_LAMBDA_URL = 'https://your-discount-management-lambda-url/'; // For discounts: create, list, update, delete

  // --- Utility function to decode JWT ---
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

  // --- Handle User Logout ---
  const handleLogout = () => {
    localStorage.removeItem('idPirateAuthToken');
    window.location.href = '/account'; // Redirect to login page
  };

  // --- Authentication Check & Initial Data Fetch (MVP Mock) ---
  useEffect(() => {
    // --- MVP Placeholder Start (Auth & Mock Data Fetch) ---
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi11c2VyLTAwMSIsInVzZXJuYW1lIjoiQWRtaW5UZXN0Iiwicm9sZSI6ImFkbWluIiwiaXNSZXNlbGxlciI6ZmFsc2UsImV4cCI6OTk5OTk5OTk5OX0.signature"; // Mock Admin token
    const mockDecoded: JwtPayload = {
      userId: "admin-user-001",
      username: "AdminTest",
      role: "admin", // IMPORTANT: Mock this as 'admin'
      isReseller: false,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expire in 1 hour
    };

    // Simulate auth check and redirect if not admin
    if (mockDecoded.role !== 'admin') {
      window.location.href = '/account'; // Redirect if not admin
      return;
    }

    setLoggedInUser(mockDecoded);
    setIsAuthChecking(false);

    // Initial data fetch for the default tab (Orders)
    fetchTabContent('orders');
    // --- MVP Placeholder End ---

    /* // --- Uncomment for actual server integration ---
    const token = localStorage.getItem('idPirateAuthToken');
    if (!token) {
      window.location.href = '/account'; // Redirect to login
      return;
    }

    const decoded = decodeJwt(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('idPirateAuthToken');
      window.location.href = '/account'; // Redirect if token expired/invalid
      return;
    }

    // AUTH CHECK: Ensure user is an admin
    if (decoded.role !== 'admin') {
      setFetchError("Access Denied: You do not have administrator privileges.");
      setIsAuthChecking(false);
      // Optionally, redirect to a non-admin dashboard or home
      // window.location.href = '/dashboard';
      return;
    }

    setLoggedInUser(decoded);
    setIsAuthChecking(false);
    fetchTabContent('orders', decoded.userId, token); // Fetch initial data
    */
  }, []);

  // --- Fetch content for active tab (MVP Mock) ---
  const fetchTabContent = async (tab: 'orders' | 'users' | 'discounts', userId?: string, token?: string) => {
    setIsLoadingData(true);
    setFetchError(null);

    // --- MVP Placeholder Start (Mock API calls) ---
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading delay

    if (tab === 'orders') {
      const mockOrders: OrderDetails[] = [
        { orderId: "ord-001", userId: "user-123", createdAt: "2024-06-20T10:00:00Z", status: "shipped", paymentMethod: "Bitcoin", paymentStatus: "Paid", price: { subtotal: 100, total: 115 }, ids: [{id:1, state: 'PA'}], numberOfIds: 1 },
        { orderId: "ord-002", userId: "user-124", createdAt: "2024-06-22T14:30:00Z", status: "processing", paymentMethod: "Zelle", paymentStatus: "Paid", price: { subtotal: 250, total: 275 }, ids: [{id:1, state: 'NJ'},{id:2, state: 'NJ'}], numberOfIds: 2 },
        { orderId: "ord-003", userId: "user-123", createdAt: "2024-06-25T08:15:00Z", status: "pending", paymentMethod: "Apple Pay", paymentStatus: "Unpaid", price: { subtotal: 90, total: 105 }, ids: [{id:1, state: 'FL'}], numberOfIds: 1 },
        { orderId: "ord-004", userId: "user-125", createdAt: "2024-06-28T11:00:00Z", status: "delivered", paymentMethod: "Bitcoin", paymentStatus: "Paid", price: { subtotal: 300, total: 320 }, ids: [{id:1, state: 'TX'}, {id:2, state: 'TX'}, {id:3, state: 'TX'}], numberOfIds: 3 },
      ];
      setOrders(mockOrders);
    } else if (tab === 'users') {
      const mockUsers: UserDetails[] = [
        { userId: "user-123", username: "john.doe", role: "user", isReseller: false, referredBy: null, createdAt: "2024-01-01T09:00:00Z", updatedAt: "2024-06-20T10:00:00Z" },
        { userId: "admin-user-001", username: "AdminTest", role: "admin", isReseller: true, referredBy: "super-admin", createdAt: "2023-12-15T14:00:00Z", updatedAt: "2024-06-28T11:00:00Z" },
        { userId: "user-124", username: "jane.smith", role: "user", isReseller: false, referredBy: "john.doe", createdAt: "2024-02-10T11:00:00Z", updatedAt: "2024-05-01T15:00:00Z" },
        { userId: "user-125", username: "crypto_fan", role: "user", isReseller: true, referredBy: null, createdAt: "2024-03-05T16:00:00Z", updatedAt: "2024-06-27T09:00:00Z" },
      ];
      setUsers(mockUsers);
    } else if (tab === 'discounts') {
      const mockDiscounts: DiscountCodeDetails[] = [
        { code: "SUMMER20", value: 0.20, valueType: "percentage", expiryDate: "2024-09-01T00:00:00Z", maxUses: 100, currentUses: 55, createdAt: "2024-05-01T10:00:00Z" },
        { code: "FREESHIP", value: 15, valueType: "fixed", expiryDate: "2024-07-31T00:00:00Z", maxUses: null, currentUses: 120, createdAt: "2024-06-01T14:00:00Z" },
        { code: "NEWUSER10", value: 0.10, valueType: "percentage", expiryDate: "2024-12-31T00:00:00Z", maxUses: 50, currentUses: 48, createdAt: "2024-01-15T09:00:00Z" },
      ];
      setDiscountCodes(mockDiscounts);
    }
    setIsLoadingData(false);
    // --- MVP Placeholder End ---

    /* // --- Uncomment for actual server integration ---
    // Make sure userId and token are passed when calling this function
    if (!userId || !token) {
        setFetchError("Authentication details missing for API call.");
        setIsLoadingData(false);
        return;
    }

    try {
        let payload: any;
        let lambdaUrl: string;

        if (tab === 'orders') {
            payload = { requestType: "list_all_orders", userId: userId }; // userId is for backend auth, not query
            lambdaUrl = LAMBDA_LOOKUP_URL;
        } else if (tab === 'users') {
            payload = { requestType: "list_all_users", userId: userId };
            lambdaUrl = USER_MANAGEMENT_LAMBDA_URL;
        } else if (tab === 'discounts') {
            payload = { requestType: "list_discount_codes", userId: userId };
            lambdaUrl = DISCOUNT_MANAGEMENT_LAMBDA_URL;
        } else {
            setFetchError("Invalid tab selected.");
            setIsLoadingData(false);
            return;
        }

        const response = await fetch(lambdaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
            mode: 'cors'
        });

        const data = await response.json();

        if (response.ok) {
            if (tab === 'orders') {
                setOrders(data.orders || []);
            } else if (tab === 'users') {
                setUsers(data.users || []);
            } else if (tab === 'discounts') {
                setDiscountCodes(data.discountCodes || []);
            }
            setFetchError(null);
        } else if (response.status === 401 || response.status === 403) {
            setFetchError(data.error || "Authentication/Authorization failed. Please log in again.");
            handleLogout(); // Force logout on auth failure
        } else {
            setFetchError(data.error || `Failed to fetch ${tab} data.`);
            console.error(`Error fetching ${tab} data:`, data);
        }
    } catch (error: any) {
        console.error(`Network error fetching ${tab} data:`, error);
        setFetchError(`Network error: ${error.message || 'Please check your internet connection.'}`);
    } finally {
        setIsLoadingData(false);
    }
    */
  };

  // --- Handlers for Admin Actions (Mocked) ---
  const handleEditUserRole = (userId: string, currentRole: string) => {
    // --- MVP Placeholder ---
    alert(`MVP: Attempting to change role for user ${userId} from ${currentRole}. (Backend not connected)`);
    // Logic to open a modal or inline edit form to select new role
    // On save, call USER_MANAGEMENT_LAMBDA_URL with requestType: "update_user_role"
    // After successful update, refresh user list: fetchTabContent('users', loggedInUser.userId, localStorage.getItem('idPirateAuthToken'))
    // --- End MVP Placeholder ---
  };

  const handleToggleReseller = (userId: string, currentStatus: boolean) => {
    // --- MVP Placeholder ---
    alert(`MVP: Attempting to toggle reseller status for user ${userId} from ${currentStatus}. (Backend not connected)`);
    // Call USER_MANAGEMENT_LAMBDA_URL with requestType: "toggle_reseller_status"
    // After successful update, refresh user list.
    // --- End MVP Placeholder ---
  };

  const handleResetUserPassword = (userId: string) => {
    // --- MVP Placeholder ---
    alert(`MVP: Attempting to reset password for user ${userId}. (Backend not connected)`);
    // Call USER_MANAGEMENT_LAMBDA_URL with requestType: "reset_user_password"
    // --- End MVP Placeholder ---
  };

  const handleCreateDiscountCode = () => {
    // --- MVP Placeholder ---
    alert('MVP: Opening form to create new discount code. (Backend not connected)');
    // Logic to open a modal form for new discount code details
    // On save, call DISCOUNT_MANAGEMENT_LAMBDA_URL with requestType: "create_discount_code"
    // After successful creation, refresh discount list.
    // --- End MVP Placeholder ---
  };

  const handleEditDiscountCode = (code: string) => {
    // --- MVP Placeholder ---
    alert(`MVP: Opening form to edit discount code ${code}. (Backend not connected)`);
    // Logic to open modal/form pre-filled with discount code details
    // On save, call DISCOUNT_MANAGEMENT_LAMBDA_URL with requestType: "update_discount_code"
    // --- End MVP Placeholder ---
  };

  const handleDeleteDiscountCode = (code: string) => {
    // --- MVP Placeholder ---
    if (confirm(`MVP: Are you sure you want to delete discount code ${code}? (Backend not connected)`)) {
      // Call DISCOUNT_MANAGEMENT_LAMBDA_URL with requestType: "delete_discount_code"
      // After successful deletion, refresh discount list.
    }
    // --- End MVP Placeholder ---
  };


  if (isAuthChecking) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl font-semibold text-gray-300">Checking administrator privileges...</p>
        <svg className="animate-spin mt-4 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  // --- Access Denied / Not Admin ---
  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-bold text-red-400 mb-2 font-pirate-special">Access Denied</h2>
        <p className="text-gray-300 text-lg mb-6">You do not have the necessary permissions to view this page.</p>
        <a href="/account" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 shadow-md">
          <BackArrowIcon className="mr-2" /> Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col font-inter text-gray-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
        .font-inter { font-family: 'Inter', sans-serif; }
        /* Dropdown Styles */
        .group:hover .group-hover-show {
          display: block;
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        /* Custom scrollbar for tables for professional look */
        .table-container::-webkit-scrollbar {
          height: 8px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #374151; /* gray-700 */
          border-radius: 10px;
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #4B5563; /* gray-600 */
          border-radius: 10px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #6B7280; /* gray-500 */
        }
      `}</style>

      {/* Header (Consistent with Dashboard) */}
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center px-4 sm:px-8">
        {/* Left: Home Button */}
        <div className="flex-shrink-0">
          <a href="/" className="flex items-center bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base">
            <BackArrowIcon className="mr-1 sm:mr-2" />
            Home
          </a>
        </div>
        
        {/* Center: ID Pirate Logo */}
        <div className="flex-grow flex justify-center">
          <h1 className="font-pirate-special text-3xl sm:text-4xl font-bold text-white tracking-wider truncate px-2">
            ID Pirate (Admin)
          </h1>
        </div>
        
        {/* Right: User Dropdown */}
        <div className="flex-shrink-0 relative">
          {loggedInUser && (
            <div 
              className="relative group cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <span className="text-gray-300 flex items-center text-sm sm:text-base">
                <UserIcon className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="font-semibold">{loggedInUser.username}</span>
                <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </span>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="group-hover-show absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg py-1 z-50 origin-top-right animate-fade-in-scale">
                  <a href="/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">My Orders</a>
                  <a href="/settings" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Settings</a>
                  <a href="/reseller-dashboard" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Reseller Dashboard</a>
                  <a href="/risk-warn" className="block px-4 py-2 text-gray-300 hover:bg-gray-600">Risk Warning</a>
                  <div className="border-t border-gray-600 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 hover:text-red-300"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 sm:p-8">
        <h2 className="font-pirate-special text-4xl font-bold text-white text-center mb-8">
          Admin Dashboard
        </h2>

        {fetchError && (
          <div className="p-4 mb-6 rounded-lg text-center font-semibold text-white bg-red-600">
            Error: {fetchError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-700 mb-8">
          <button 
            className={`px-6 py-3 text-lg font-semibold border-b-2 ${activeTab === 'orders' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            onClick={() => { setActiveTab('orders'); fetchTabContent('orders', loggedInUser?.userId, localStorage.getItem('idPirateAuthToken') || ''); }}
          >
            Orders
          </button>
          <button 
            className={`px-6 py-3 text-lg font-semibold border-b-2 ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            onClick={() => { setActiveTab('users'); fetchTabContent('users', loggedInUser?.userId, localStorage.getItem('idPirateAuthToken') || ''); }}
          >
            Users
          </button>
          <button 
            className={`px-6 py-3 text-lg font-semibold border-b-2 ${activeTab === 'discounts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            onClick={() => { setActiveTab('discounts'); fetchTabContent('discounts', loggedInUser?.userId, localStorage.getItem('idPirateAuthToken') || ''); }}
          >
            Discount Codes
          </button>
        </div>

        {/* Tab Content */}
        {isLoadingData ? (
          <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <svg className="animate-spin mx-auto h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="mt-4 text-xl text-gray-300">Loading {activeTab} data...</p>
          </div>
        ) : (
          <div>
            {/* Orders Tab Content */}
            {activeTab === 'orders' && (
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="font-semibold text-2xl text-white mb-4 flex items-center"><PackageIcon className="mr-2" /> All Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No orders found.</p>
                ) : (
                  <div className="overflow-x-auto table-container">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User ID</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Items</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {orders.map(order => (
                          <tr key={order.orderId} className="hover:bg-gray-700 transition-colors duration-200">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{order.orderId.substring(0, 8)}...</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{order.userId.substring(0, 8)}...</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                   order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{order.numberOfIds}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-400">${order.price?.total.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a href={`/order/${order.orderId}`} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors shadow-sm">
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab Content */}
            {activeTab === 'users' && (
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="font-semibold text-2xl text-white mb-4 flex items-center"><UsersIcon className="mr-2" /> User Management</h3>
                {users.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No users found.</p>
                ) : (
                  <div className="overflow-x-auto table-container">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reseller</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referred By</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {users.map(user => (
                          <tr key={user.userId} className="hover:bg-gray-700 transition-colors duration-200">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{user.username}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              {user.isReseller ? <CheckCircleIcon className="text-green-400 mx-auto" /> : <XCircleIcon className="text-red-400 mx-auto" />}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{user.referredBy || 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                              <button onClick={() => handleEditUserRole(user.userId, user.role)} className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors shadow-sm">
                                <Edit3Icon className="mr-1" /> Role
                              </button>
                              <button onClick={() => handleToggleReseller(user.userId, user.isReseller)} className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors shadow-sm">
                                Reseller
                              </button>
                              <button onClick={() => handleResetUserPassword(user.userId)} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors shadow-sm">
                                <KeyIcon className="mr-1" /> Reset
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Discount Codes Tab Content */}
            {activeTab === 'discounts' && (
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="font-semibold text-2xl text-white mb-4 flex items-center"><TagIcon className="mr-2" /> Discount Codes</h3>
                <button onClick={handleCreateDiscountCode} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors mb-4 text-sm">
                  <PlusCircleIcon className="mr-2" /> Create New Code
                </button>
                {discountCodes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No discount codes found.</p>
                ) : (
                  <div className="overflow-x-auto table-container">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Expires</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Uses</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {discountCodes.map(code => (
                          <tr key={code.code} className="hover:bg-gray-700 transition-colors duration-200">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{code.code}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                              {code.valueType === 'percentage' ? `${(code.value * 100).toFixed(0)}%` : `$${code.value.toFixed(2)}`}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(code.expiryDate).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{code.currentUses}/{code.maxUses || 'Unlimited'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                              <button onClick={() => handleEditDiscountCode(code.code)} className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors shadow-sm">
                                <Edit3Icon className="mr-1" /> Edit
                              </button>
                              <button onClick={() => handleDeleteDiscountCode(code.code)} className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-lg text-xs transition-colors shadow-sm">
                                <TrashIcon className="mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
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
