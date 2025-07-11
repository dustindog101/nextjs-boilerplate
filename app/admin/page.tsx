// --- START OF FILE app/admin-dashboard/page.tsx (Final Version) ---

"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { AdminLayout, AdminSection } from './AdminLayout';

// Import the new, modular section components
import { MetricsSection } from './components/MetricsSection';
import { UsersSection } from './components/UsersSection';

function AdminDashboardPage() {
  // The active section state is now managed by the layout
  const [activeSection, setActiveSection] = useState<AdminSection>('metrics');

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics':
        return <MetricsSection />;
      case 'users':
        return <UsersSection />;
      case 'orders':
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">Order Management</h2><p className="text-gray-400 mt-2">Full order details and management coming soon.</p></div>;
      case 'products':
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">Product Management</h2><p className="text-gray-400 mt-2">Functionality to edit available state IDs, prices, and features coming soon.</p></div>;
      case 'resellers':
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">Reseller Management</h2><p className="text-gray-400 mt-2">Tools for managing reseller accounts and commissions coming soon.</p></div>;
      case 'affiliates':
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">Affiliate Management</h2><p className="text-gray-400 mt-2">Tools for managing affiliate links and tracking coming soon.</p></div>;
      case 'discounts':
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">Discount Management</h2><p className="text-gray-400 mt-2">Functionality to create and manage site-wide discount codes coming soon.</p></div>;
      default:
        // Fallback to metrics or a dedicated dashboard home
        return <MetricsSection />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboardPage);

// --- END OF FILE app/admin-dashboard/page.tsx (Final Version) ---