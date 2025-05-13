import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import Header from '../components/layout/Header';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
