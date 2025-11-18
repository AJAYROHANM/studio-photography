import React from 'react';
import { EventDetails } from '../types';
import { BellIcon, XIcon } from './icons/Icons';

interface Reminder {
  type: 'Today' | 'Tomorrow';
  details: EventDetails;
}

interface ReminderBannerProps {
  reminders: Reminder[];
  onDismiss: () => void;
}

const ReminderBanner: React.FC<ReminderBannerProps> = ({ reminders, onDismiss }) => {
  return (
    <div className="relative bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg mb-6 shadow-md animate-fade-in" role="alert">
      <div className="flex">
        <div className="py-1">
          <BellIcon className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
        </div>
        <div>
          <p className="font-bold text-lg mb-2">Upcoming Event Reminders</p>
          <div className="space-y-2">
            {reminders.map((reminder, index) => (
              <div key={index} className="text-sm">
                <p>
                  <span className="font-semibold">{reminder.type}:</span> {reminder.details.text} at <span className="font-medium">{reminder.details.place}</span> for <span className="font-medium">{reminder.details.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.
                </p>
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
