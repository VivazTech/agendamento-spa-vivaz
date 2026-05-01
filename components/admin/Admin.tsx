import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AppointmentsView from './AppointmentsView';
import ServicesView from './ServicesView';
import ProfessionalsView from './ProfessionalsView';
import ScheduleView from './ScheduleView';
import ReportsView from './ReportsView';
import AdminsView from './AdminsView';
import CategoriesView from './CategoriesView';
import BannersView from './BannersView';
import BusinessHoursView from './BusinessHoursView';
import SettingsView from './SettingsView';

export type AdminView = 'appointments' | 'services' | 'professionals' | 'schedule' | 'reports' | 'admins' | 'categories' | 'banners' | 'business-hours' | 'settings';

const Admin: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('schedule');

  const renderContent = () => {
    switch (activeView) {
      case 'appointments':
        return <AppointmentsView />;
      case 'services':
        return <ServicesView />;
      case 'professionals':
        return <ProfessionalsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'reports':
        return <ReportsView />;
      case 'admins':
        return <AdminsView />;
      case 'categories':
        return <CategoriesView />;
      case 'banners':
        return <BannersView />;
      case 'business-hours':
        return <BusinessHoursView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ScheduleView />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full min-w-0">
      <div className="md:w-64 md:min-w-64 flex-shrink-0">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
      </div>
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default Admin;
