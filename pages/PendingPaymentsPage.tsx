import React, { useState } from 'react';
import { EventDetails } from '../types';
import { 
  ChevronLeftIcon,
  CheckCircleIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  LocationMarkerIcon 
} from '../components/icons/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

interface EventWithDate {
  date: string;
  details: EventDetails;
}

interface EventCardProps {
    date: string;
    details: EventDetails;
    onSettle: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ date, details, onSettle }) => {
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
       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onSettle}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-sm"
          >
            Settle Payment
          </button>
        </div>
    </div>
  );
};

interface PendingPaymentsPageProps {
  events: EventWithDate[];
  totalAmount: number;
  onBack: () => void;
  onSettlePayment: (dateKey: string) => void;
}

const PendingPaymentsPage: React.FC<PendingPaymentsPageProps> = ({ events, totalAmount, onBack, onSettlePayment }) => {
  const [settleCandidate, setSettleCandidate] = useState<EventWithDate | null>(null);

  const handleSettleClick = (event: EventWithDate) => {
    setSettleCandidate(event);
  };

  const handleConfirmSettle = () => {
    if (settleCandidate) {
      onSettlePayment(settleCandidate.date);
      setSettleCandidate(null);
    }
  };
  
  const handleCancelSettle = () => {
    setSettleCandidate(null);
  };

  return (
    <div className="animate-fade-in relative">
        <ConfirmationModal
            isOpen={!!settleCandidate}
            title="Confirm Settlement"
            message={
                settleCandidate ? `Settle payment of ${settleCandidate.details.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} for the event "${settleCandidate.details.text}"?` : ''
            }
            onConfirm={handleConfirmSettle}
            onCancel={handleCancelSettle}
            confirmText="Yes, Settle"
            cancelText="Cancel"
            confirmButtonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        />

      <header className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Back to dashboard"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Pending Payments</h2>
      </header>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount Pending</p>
        <p className="text-4xl font-bold text-brand-primary">
            {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">All Clear!</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">There are no pending payments.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Pending Orders ({events.length})</h3>
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard 
                key={event.date} 
                date={event.date} 
                details={event.details} 
                onSettle={() => handleSettleClick(event)}
              />
            ))}
          </div>
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

export default PendingPaymentsPage;
