// --- START OF FILE app/admin/page.tsx (Final Version) ---
"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { UniversalHeader } from '../components/UniversalHeader';
import { AdminLayout, AdminSection } from './AdminLayout';
import { Menu } from 'lucide-react';

// Import the modular section components
import { MetricsSection } from './components/MetricsSection';
import { UsersSection } from './components/UsersSection';

function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('metrics');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics':
        return <MetricsSection />;
      case 'users':
        return <UsersSection />;
      // Add cases for other sections here as they are built
      default:
        return <div className="p-6"><h2 className="text-3xl font-bold text-white">{activeSection}</h2><p className="text-gray-400 mt-2">This section is under construction.</p></div>;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-inter flex flex-col">
      {/* The UniversalHeader is now part of the page, making it truly site-wide */}
      <UniversalHeader />

      {/* The AdminLayout now fills the remaining vertical space */}
      <AdminLayout 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {/* The main content for the selected section is passed as a child */}
        {renderContent()}
      </AdminLayout>
    </div>
  );
}

// This page is protected by our admin-only HOC
export default withAdminAuth(AdminDashboardPage);
// --- END OF FILE app/admin/page.tsx (Final Version) ---