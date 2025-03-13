
import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import Header from '../components/layout/Header';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
