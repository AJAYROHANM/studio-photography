
import React, { useState, useEffect } from 'react';
import { EventDetails, EventDetailsWithUser, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { XIcon, PencilIcon, TrashIcon, ClockIcon, CheckCircleIcon } from './icons/Icons';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: EventDetailsWithUser[];
  onSave: (event: EventDetails, targetUserId: string, originalTimeSlot?: string) => void;
  onDelete: (event: EventDetailsWithUser) => void;
  currentUser: User;
  users: User[];
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, date, events, onSave, onDelete, currentUser, users }) => {
  // Form State
  const [text, setText] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [amount, setAmount] = useState('');
  const [place, setPlace] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Evening' | 'Full Day'>('Morning');
  
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  
  // Edit State
  const [editingEvent, setEditingEvent] = useState<EventDetailsWithUser | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<EventDetailsWithUser | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Derived State for business logic
  const existingSlots = events.map(e => e.timeSlot);
  const hasFullDay = existingSlots.includes('Full Day');
  const hasMorning = existingSlots.includes('Morning');
  const hasEvening = existingSlots.includes('Evening');
  
  // Logic: If Full Day is taken, no new adds (unless editing).
  // If Morning taken, can add Evening.
  // If Evening taken, can add Morning.
  const canAddNew = !hasFullDay && !(hasMorning && hasEvening);

  // Initialize form when opening or switching mode
  useEffect(() => {
    if (!isOpen) return;
    
    if (editingEvent) {
      // Populate form with existing event data
      setText(editingEvent.text);
      setSendSms(editingEvent.sendSms);
      setAmount(editingEvent.amount.toString());
      setPlace(editingEvent.place);
      setStatus(editingEvent.status);
      setCustomerName(editingEvent.customerName || '');
      setCustomerMobile(editingEvent.customerMobile || '');
      setTimeSlot(editingEvent.timeSlot);
      setAssignedUserId(editingEvent.userId);
      setIsAddingNew(true); // reusing the form view
    } else if (events.length === 0) {
      // No events, automatically show add form
      resetForm();
      setIsAddingNew(true);
    } else {
      // Show list view initially
      setIsAddingNew(false);
      resetForm();
    }
  }, [isOpen, editingEvent, events.length]);

  const resetForm = () => {
    setText('');
    setSendSms(false);
    setAmount('');
    setPlace('');
    setStatus('pending');
    setCustomerName('');
    setCustomerMobile('');
    setAssignedUserId(currentUser.id);
    
    // Default slot selection logic
    if (!hasMorning) setTimeSlot('Morning');
    else if (!hasEvening) setTimeSlot('Evening');
    else setTimeSlot('Full Day');
  };

  const handleSave = () => {
    if (text.trim() && place.trim() && amount) {
      onSave({ 
        text, 
        sendSms,
        place,
        amount: parseFloat(amount) || 0,
        status,
        customerName,
        customerMobile,
        timeSlot
      }, assignedUserId, editingEvent?.timeSlot); // Pass original slot if editing
      
      // Reset states after save
      setEditingEvent(null);
      setIsAddingNew(false);
    }
  };
  
  const handleConfirmDelete = () => {
    if (showConfirmDelete) {
        onDelete(showConfirmDelete);
        setShowConfirmDelete(null);
    }
  };
  
  const handleEditClick = (event: EventDetailsWithUser) => {
      setEditingEvent(event);
  };
  
  const handleToggleStatus = (event: EventDetailsWithUser) => {
      // To toggle status, we act as if we are saving it with new status
      onSave({
          ...event,
          status: event.status === 'pending' ? 'completed' : 'pending'
      }, event.userId, event.timeSlot);
  };

  const handleAddNewClick = () => {
      setEditingEvent(null);
      resetForm();
      setIsAddingNew(true);
  };

  const handleCancelForm = () => {
      setEditingEvent(null);
      setIsAddingNew(false);
      if (events.length === 0) {
          onClose();
      }
  };
  
  const isSaveDisabled = !text.trim() || !place.trim() || !amount;

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        <ConfirmationModal 
          isOpen={!!showConfirmDelete}
          title="Delete Event?"
          message="This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmDelete(null)}
          confirmText="Yes, Delete"
          cancelText="Cancel"
        />

        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
           <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {isAddingNew ? (editingEvent ? 'Edit Event' : 'New Event') : 'Events'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
           </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5" />
            </button>
        </header>

        <main className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* List View */}
          {!isAddingNew && (
              <div className="space-y-4">
                  {events.map((evt, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border 
                                        ${evt.timeSlot === 'Morning' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 
                                          evt.timeSlot === 'Evening' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 
                                          'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'}`}>
                                          {evt.timeSlot}
                                      </span>
                                      {evt.status === 'completed' ? (
                                          <span className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                                              <CheckCircleIcon className="w-3 h-3 mr-1" /> Completed
                                          </span>
                                      ) : (
                                          <span className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                                              <ClockIcon className="w-3 h-3 mr-1" /> Upcoming
                                          </span>
                                      )}
                                  </div>
                                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{evt.text}</h3>
                                  {isAdmin && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Assigned to: {evt.userName}</p>}
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                              <div>
                                  <span className="block text-xs text-gray-400 uppercase">Venue</span>
                                  {evt.place}
                              </div>
                              <div>
                                  <span className="block text-xs text-gray-400 uppercase">Amount</span>
                                  ₹{evt.amount.toLocaleString('en-IN')}
                              </div>
                              {evt.customerName && (
                                  <div>
                                      <span className="block text-xs text-gray-400 uppercase">Customer</span>
                                      {evt.customerName}
                                  </div>
                              )}
                              {evt.customerMobile && (
                                  <div>
                                      <span className="block text-xs text-gray-400 uppercase">Mobile</span>
                                      {evt.customerMobile}
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleToggleStatus(evt)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border
                                            ${evt.status === 'pending' 
                                                ? 'bg-white border-green-600 text-green-600 hover:bg-green-50 dark:bg-transparent dark:text-green-400 dark:border-green-500 dark:hover:bg-green-900/20' 
                                                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-400'}
                                        `}
                                    >
                                        {evt.status === 'pending' ? 'Mark as Completed' : 'Mark as Pending'}
                                    </button>
                                </div>

                                <div className="flex space-x-1">
                                    <button onClick={() => handleEditClick(evt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setShowConfirmDelete(evt)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Delete">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                          </div>
                      </div>
                  ))}
                  
                  {events.length === 0 && (
                      <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No events scheduled for this day.</p>
                      </div>
                  )}

                  {canAddNew && (
                      <button 
                        onClick={handleAddNewClick}
                        className="w-full py-3 mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors flex justify-center items-center font-medium"
                      >
                          + Add New Event
                      </button>
                  )}
                  {!canAddNew && events.length > 0 && (
                       <p className="text-center text-xs text-orange-500 mt-2">
                           All time slots (Morning & Evening) are booked.
                       </p>
                  )}
              </div>
          )}

          {/* Form View */}
          {isAddingNew && (
            <>
                {isAdmin && !editingEvent && (
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

                {/* Time Slot Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Slot</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Morning', 'Evening', 'Full Day'] as const).map((slot) => {
                            // Disable logic
                            let disabled = false;
                            if (editingEvent && editingEvent.timeSlot === slot) {
                                disabled = false; // Can keep own slot
                            } else {
                                if (hasFullDay) disabled = true;
                                if (slot === 'Full Day' && (hasMorning || hasEvening)) disabled = true;
                                if (slot === 'Morning' && hasMorning) disabled = true;
                                if (slot === 'Evening' && hasEvening) disabled = true;
                            }

                            return (
                                <button
                                    key={slot}
                                    onClick={() => !disabled && setTimeSlot(slot)}
                                    disabled={disabled}
                                    className={`py-2 px-1 text-sm border rounded-md transition-colors text-center
                                        ${timeSlot === slot 
                                            ? 'bg-brand-primary text-white border-brand-primary' 
                                            : disabled 
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                                        }
                                    `}
                                >
                                    {slot}
                                </button>
                            )
                        })}
                    </div>
                    {timeSlot === 'Full Day' && (
                        <p className="text-xs text-orange-500 mt-1">Full Day blocks any other events for this date.</p>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    placeholder="Customer Mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    />
                </div>

                <textarea
                    className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none"
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

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
                    <button
                        onClick={() => setStatus(prev => prev === 'pending' ? 'completed' : 'pending')}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}
                    >
                        Status: {status}
                    </button>
                </div>
            </>
          )}
        </main>

        <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-3 rounded-b-lg flex-shrink-0">
            {isAddingNew ? (
                <>
                    <button
                        onClick={handleCancelForm}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingEvent ? 'Update' : 'Save'}
                    </button>
                </>
            ) : (
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                    Close
                </button>
            )}
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
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 20px;
          }
        `}</style>
    </div>
  );
};

export default NoteModal;
