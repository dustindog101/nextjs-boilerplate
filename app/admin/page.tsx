// --- START OF FILE app/admin-dashboard/page.tsx (Rebuilt) ---

"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { AdminLayout, AdminSection } from './AdminLayout';

// Import components for each section
// You would create these as separate, clean components in a real app
// For now, we'll define them inline for simplicity.
import { UsersSection } from './UsersSection'; // We will create this below
import { MetricsSection } from './MetricsSection'; // We will create this below

// Main Page Component
function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('metrics');

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics':
        return <MetricsSection />;
      case 'users':
        return <UsersSection />;
      // Add cases for other sections here
      case 'orders':
        return <div className="p-6"><h2 className="text-2xl font-bold text-white">Order Management</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>;
      case 'products':
        return <div className="p-6"><h2 className="text-2xl font-bold text-white">Product Management</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>;
      case 'resellers':
        return <div className="p-6"><h2 className="text-2xl font-bold text-white">Reseller Management</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>;
      case 'affiliates':
        return <div className="p-6"><h2 className="text-2xl font-bold text-white">Affiliate Management</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>;
      case 'discounts':
        return <div className="p-6"><h2 className="text-2xl font-bold text-white">Discount Management</h2><p className="text-gray-400 mt-2">Coming soon...</p></div>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboardPage);

// --- For organization, we are defining section components here. ---
// --- In a larger app, move these to their own files. ---

// --- Metrics Section Component ---
import { StatCard } from './StatCard';
import { ChartCard } from './ChartCard';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 5500 },
];
const ordersData = [
  { name: 'Mon', orders: 12 }, { name: 'Tue', orders: 19 },
  { name: 'Wed', orders: 8 }, { name: 'Thu', orders: 15 },
  { name: 'Fri', orders: 22 }, { name: 'Sat', orders: 30 },
  { name: 'Sun', orders: 25 },
];

const DollarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
const ShoppingCartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>;
const UsersPlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;


const MetricsSection = () => (
  <div className="p-4 sm:p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Revenue" value="$45,231" icon={<DollarIcon className="h-6 w-6"/>} change="+12.5%" changeType="increase" />
      <StatCard title="New Orders" value="2,350" icon={<ShoppingCartIcon className="h-6 w-6"/>} change="+5.2%" changeType="increase" />
      <StatCard title="New Users" value="1,210" icon={<UsersPlusIcon className="h-6 w-6"/>} change="-2.1%" changeType="decrease" />
      <StatCard title="Avg. Order Value" value="$19.25" icon={<ActivityIcon className="h-6 w-6"/>} change="+1.8%" changeType="increase" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Revenue Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="name" stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#4299e1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Orders This Week">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="name" stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} />
            <Legend />
            <Bar dataKey="orders" fill="#4299e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);

// --- Users Section Component ---
// This is the logic from your previous admin page, now as a component
import { listAllUsers, adminUpdateUser, User } from '../../lib/apiClient';
import { EditUserModal } from './UsersSection'; // We will imagine this is in its own file

const UsersSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const userList = await listAllUsers();
        setUsers(userList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const handleSaveUser = async (userId: string, updatedData: Partial<User>) => {
    try {
        await adminUpdateUser(userId, updatedData);
        setEditingUser(null);
        const userList = await listAllUsers(); // Refresh list
        setUsers(userList);
    } catch (err: any) {
        alert(`Failed to save user: ${err.message}`);
    }
  };

  if (isLoading) return <p className="text-center p-8">Loading users...</p>;
  if (error) return <p className="text-center text-red-400 p-8">Error: {error}</p>;

  return (
    <div className="p-6">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
      <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
        {/* The user table JSX would go here, identical to your previous version */}
        <table className="min-w-full divide-y divide-gray-700">
          {/* ... thead and tbody ... */}
        </table>
      </div>
    </div>
  );
};
// --- END OF FILE app/admin-dashboard/page.tsx (Rebuilt) ---