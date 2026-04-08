"use client";
import React, { useState } from 'react';
import { withAdminAuth } from '../components/withAdminAuth';
import { AdminLayout, AdminSection } from './AdminLayout';
import { AdminTopBar } from './AdminTopBar';
import { AdminDataProvider } from './AdminDataContext';

// Import the modular section components
import { MetricsSection } from './components/MetricsSection';
import { UsersSection } from './components/UsersSection';
import { OrdersSection } from './components/OrdersSection';
import { ProductsSection } from './components/ProductsSection';
import { ResellersSection } from './components/ResellersSection';
import { AffiliatesSection } from './components/AffiliatesSection';
import { DiscountsSection } from './components/DiscountsSection';
import { NewsSection } from './components/NewsSection';
import { SettingsSection } from './components/SettingsSection';

function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('metrics');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics': return <MetricsSection />;
      case 'users': return <UsersSection />;
      case 'orders': return <OrdersSection />;
      case 'products': return <ProductsSection />;
      case 'resellers': return <ResellersSection />;
      case 'affiliates': return <AffiliatesSection />;
      case 'discounts': return <DiscountsSection />;
      case 'news': return <NewsSection />;
      case 'settings': return <SettingsSection />;
      default: return <MetricsSection />;
    }
  };

  return (
    <div className="font-inter flex flex-col h-screen admin-dark">
      <AdminDataProvider>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <AdminTopBar
          activeSection={activeSection}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setSidebarOpen(o => !o)}
        />
        <AdminLayout
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
        >
          {renderContent()}
        </AdminLayout>
        </div>
      </AdminDataProvider>
    </div>
  );
}

export default withAdminAuth(AdminDashboardPage);