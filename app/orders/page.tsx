// --- START OF FILE app/orders/page.tsx ---

"use client";
import React, { useState, useEffect } from 'react';
import { withAuth } from '../components/withAuth';
import { fetchUserOrders } from '../../lib/apiClient';
import { UniversalHeader } from '../components/UniversalHeader';

// --- Type Definitions ---
interface OrderDetails {
  orderId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  price: { total: number };
  numberOfIds: number;
}

// --- SVG Icons ---
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="m7.5 4.27 9 5.16"></path><path d="m7.5 19.73 9-5.16"></path><path d="M3.27 6.3a2 2 0 0 0 0 3.4L9.5 12l-6.23 2.3a2 2 0 0 0 0 3.4L12 22l8.73-3.27a2 2 0 0 0 0-3.4L14.5 12l6.23-2.3a2 2 0 0 0 0-3.4L12 2Z"></path><path d="m12 2v20"></path></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const HashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>;
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchUserOrders();
        // Sort orders by date, most recent first
        const sortedOrders = data.orders.sort((a: OrderDetails, b: OrderDetails) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      } catch (error: any) {
        setFetchError(error.message || "Failed to fetch orders.");
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400';
      case 'shipped': return 'text-blue-400';
      case 'processing': return 'text-yellow-400';
      case 'pending':
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return (status.charAt(0).toUpperCase() + status.slice(1)).replace(/([A-Z])/g, ' $1').trim();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
          <svg className="animate-spin mx-auto h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="mt-4 text-xl text-gray-300">Loading your order history...</p>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="text-center p-8 bg-red-800/20 rounded-lg border border-red-700">
          <p className="text-xl text-red-400 font-semibold mb-2">Error Fetching Orders</p>
          <p className="text-gray-300">{fetchError}</p>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-2xl text-gray-300 font-semibold">No orders found.</p>
          <p className="text-gray-500 mt-2">Ready to start your collection?</p>
          <a href="/order" className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-lg">
            <PackageIcon /> Start New Order
          </a>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.orderId} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col justify-between hover:border-blue-500 transition-colors">
            <div>
              <h3 className="font-bold text-xl text-white mb-3 flex items-center">
                <HashIcon /> Order #{order.orderId.substring(0, 8)}...
              </h3>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center"><CalendarIcon />Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold">Status:</span> <span className={`font-bold ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span></p>
                <p><span className="font-semibold">Items:</span> {order.numberOfIds}</p>
                <p className="flex items-center"><DollarSignIcon />Total: ${order.price?.total ? order.price.total.toFixed(2) : 'N/A'}</p>
              </div>
            </div>
            <a href={`/track?orderId=${order.orderId}`} className="mt-4 w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-md">
              View Details & Track
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Inter:wght@400;500;700&display=swap');
        .font-pirate-special { font-family: 'Uncial Antiqua', cursive; }
      `}</style>
      
      <UniversalHeader />
      
      <main className="container mx-auto p-4 sm:p-8">
        <h2 className="font-pirate-special text-4xl sm:text-5xl font-bold text-white text-center mb-8">
          My Orders
        </h2>
        {renderContent()}
      </main>
      
      <footer className="py-8 text-gray-500 text-sm text-center mt-8">
        © {new Date().getFullYear()} ID Pirate. All rights reserved.
      </footer>
    </div>
  );
}

export default withAuth(MyOrdersPage);

// --- END OF FILE app/orders/page.tsx ---