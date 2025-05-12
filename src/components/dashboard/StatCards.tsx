import React from 'react';
import Glass from '../ui-custom/Glass';

interface StatCard {
  label: string;
  value: string | number;
  color: string;
}

interface StatCardsProps {
  stats: StatCard[];
}

const StatCards = ({ stats }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Glass 
          key={index} 
          className="p-4 relative overflow-hidden"
          opacity="light"
        >
          <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`}></div>
          <div className="pl-3">
            <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</p>
            <p className="text-3xl font-semibold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        </Glass>
      ))}
    </div>
  );
};

export default StatCards;
