import React from 'react';
import { EventDetails } from '../types';
import { 
  ChevronLeftIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  LocationMarkerIcon 
} from './icons/Icons';

interface EventWithDate {
  date: string;
  details: EventDetails;
}

interface DetailsPageProps {
  title: string;
  events: EventWithDate[];
  onBack: () => void;
}

interface EventCardProps {
    date: string;
    details: EventDetails;
}

const EventCard: React.FC<EventCardProps> = ({ date, details }) => {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const StatusIcon = details.status === 'completed' ? CheckCircleIcon : ClockIcon;
  const statusClasses = details.status === 'completed'
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  const statusIconColor = details.status === 'completed' ? 'text-green-500' : 'text-yellow-500';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-shadow hover:shadow-xl">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            {formattedDate}
          </p>
          <p className="font-semibold text-lg mt-1 text-gray-800 dark:text-gray-200">{details.text}</p>
        </div>
        <div className={`flex items-center text-sm px-3 py-1 rounded-full ${statusClasses} flex-shrink-0`}>
          <StatusIcon className={`w-4 h-4 mr-1.5 ${statusIconColor}`} />
          <span className="capitalize">{details.status}</span>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 dark:text-gray-300 gap-2 sm:gap-4">
        <div className="flex items-center">
          <LocationMarkerIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">{details.place}</span>
        </div>
        <div className="flex items-center font-medium">
          <CurrencyDollarIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>{details.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
        </div>
      </div>
    </div>
  );
};


const DetailsPage: React.FC<DetailsPageProps> = ({ title, events, onBack }) => {
  return (
    <div className="animate-fade-in">
      <header className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Back to dashboard"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">No Events Found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">There are no events in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(({ date, details }) => (
            <EventCard key={date} date={date} details={details} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DetailsPage;