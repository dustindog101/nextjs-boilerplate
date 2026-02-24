// --- START OF FILE app/admin/page.tsx (Layout and Styling Restored) ---
"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { AdminLayout, AdminSection } from './AdminLayout';
import { Menu } from 'lucide-react';


// Import the modular section components
import { MetricsSection } from './components/MetricsSection';
import { UsersSection } from './components/UsersSection';
import { OrdersSection } from './components/OrdersSection';
import { ProductsSection } from './components/ProductsSection';
import { ResellersSection } from './components/ResellersSection';
import { AffiliatesSection } from './components/AffiliatesSection';
import { DiscountsSection } from './components/DiscountsSection';

function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('metrics');
  const [isSidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics': return <MetricsSection />;
      case 'users': return <UsersSection />;
      case 'orders': return <OrdersSection />;
      case 'products': return <ProductsSection />;
      case 'resellers': return <ResellersSection />;
      case 'affiliates': return <AffiliatesSection />;
      case 'discounts': return <DiscountsSection />;
      default: return <MetricsSection />;
    }
  };

  return (
    // FIX: Ensured the root div has the correct background and flex setup for sticky footer.
    <div className="text-zinc-200 font-inter flex flex-col h-screen">
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