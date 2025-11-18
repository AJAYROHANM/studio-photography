import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-md hover:shadow-xl flex items-center space-x-3 sm:space-x-4 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-left w-full border border-gray-200 dark:border-gray-700"
    >
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-2 sm:p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </button>
  );
};

export default DashboardCard;