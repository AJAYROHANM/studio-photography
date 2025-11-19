
import React from 'react';
import { Reminder, EventDetailsWithUser } from '../types';
import { BellIcon, XIcon, UserCircleIcon, LocationMarkerIcon, ClockIcon, PhoneIcon } from './icons/Icons';

interface ReminderBannerProps {
  reminders: Reminder[];
  onDismiss: () => void;
  isAdmin: boolean;
}

const ReminderBanner: React.FC<ReminderBannerProps> = ({ reminders, onDismiss, isAdmin }) => {
  return (
    <div className="relative bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg mb-6 shadow-md animate-fade-in" role="alert">
      <div className="flex items-start">
        <div className="py-1">
          <BellIcon className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
        </div>
        <div className="w-full">
          <p className="font-bold text-lg mb-3">Upcoming Event Reminders</p>
          <div className="space-y-3">
            {reminders.map((reminder, index) => (
              <div key={index} className="bg-white/70 dark:bg-black/30 p-3 rounded-md shadow-sm hover:shadow-md transition-shadow border border-blue-200 dark:border-blue-800/30">
                 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${reminder.type === 'Today' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100'}`}>
                                {reminder.type === 'Today' ? 'Today' : 'Tomorrow'}
                            </span>
                             <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {reminder.details.timeSlot}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-md">{reminder.details.text}</h4>
                    </div>
                    {isAdmin && (
                         <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded self-start sm:self-center whitespace-nowrap">
                             By: {reminder.details.userName}
                        </div>
                    )}
                 </div>
                 
                 <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {reminder.details.customerName && (
                        <div className="flex items-center">
                            <UserCircleIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                            <span className="font-medium">{reminder.details.customerName}</span>
                        </div>
                    )}
                    {reminder.details.customerMobile && (
                        <div className="flex items-center">
                            <PhoneIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                            <span>{reminder.details.customerMobile}</span>
                        </div>
                    )}
                    <div className="flex items-center">
                        <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{reminder.details.place}</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button 
        onClick={onDismiss} 
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Dismiss reminders"
      >
        <XIcon className="w-4 h-4" />
      </button>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReminderBanner;
