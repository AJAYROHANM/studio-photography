import React, { useState, useEffect } from 'react';
import { EventDetails, EventDetailsWithUser, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { XIcon } from './icons/Icons';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  event?: EventDetailsWithUser;
  onSave: (event: EventDetails, targetUserId: string) => void;
  onDelete: () => void;
  currentUser: User;
  users: User[];
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, date, event, onSave, onDelete, currentUser, users }) => {
  const [text, setText] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [amount, setAmount] = useState('');
  const [place, setPlace] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);

  useEffect(() => {
    if (event) {
      setText(event.text);
      setSendSms(event.sendSms);
      setAmount(event.amount.toString());
      setPlace(event.place);
      setStatus(event.status);
      setAssignedUserId(event.userId);
    } else {
      setText('');
      setSendSms(false);
      setAmount('');
      setPlace('');
      setStatus('pending');
      setAssignedUserId(currentUser.id);
    }
    setShowConfirmDelete(false);
  }, [event, isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (text.trim() && place.trim() && amount) {
      onSave({ 
        text, 
        sendSms,
        place,
        amount: parseFloat(amount) || 0,
        status,
      }, assignedUserId);
    }
  };
  
  const handleConfirmDelete = () => {
    onDelete();
    setShowConfirmDelete(false);
  };
  
  const isSaveDisabled = !text.trim() || !place.trim() || !amount;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isNewEvent = !event;
  const isAdminCreating = currentUser.role === 'admin' && isNewEvent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-up flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <ConfirmationModal 
          isOpen={showConfirmDelete}
          title="Delete Event?"
          message="This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(false)}
          confirmText="Yes, Delete"
          cancelText="Cancel"
        />

        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
           <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Event Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
           </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5" />
            </button>
        </header>

        <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {isAdminCreating && (
            <div className="mb-4">
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign to User:
              </label>
              <select
                id="user-select"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentUser.role === 'admin' && event && event.userName !== currentUser.name && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-gray-700/50 rounded-md text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600/50">
                  <p>
                      <span className="font-semibold">Note:</span> You are editing an event for user <span className="font-bold">{event.userName}</span>.
                  </p>
              </div>
          )}

          <textarea
            className="w-full h-28 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            placeholder="Event description..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="text"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="Place / Venue"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sms-notification"
                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
              />
              <label htmlFor="sms-notification" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Send SMS reminder
              </label>
            </div>
            <button
                onClick={() => setStatus(prev => prev === 'pending' ? 'completed' : 'pending')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}
              >
                Status: {status}
              </button>
          </div>
        </main>

        <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 rounded-b-lg">
            {event ? (
               <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
            ) : <div className="hidden sm:block"></div>}
          <div className="flex w-full sm:w-auto space-x-3">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {event ? 'Update' : 'Save'}
            </button>
          </div>
        </footer>
      </div>
       <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default NoteModal;