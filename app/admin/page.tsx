// --- START OF FILE app/admin/page.tsx (Layout and Styling Restored) ---
"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
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
      default:
        // FIX: Ensure background is set for default/unimplemented sections
        return <div className="p-6 bg-gray-900 h-full"> 
                 <h2 className="text-3xl font-bold text-white">{activeSection}</h2>
                 <p className="text-gray-400 mt-2">This section is under construction.</p>
               </div>;
    }
  };

  return (
    // FIX: Ensured the root div has the correct background and flex setup for sticky footer.
    <div className="bg-gray-900 text-gray-200 font-inter flex flex-col h-screen">
      {/* REMOVED: The UniversalHeader is now in layout.tsx, so no need to render it here */}
      
      <AdminLayout 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {renderContent()}
      </AdminLayout>
    </div>
  );
}

export default withAdminAuth(AdminDashboardPage);
// --- END OF FILE app/admin/page.tsx (Layout and Styling Restored) ---