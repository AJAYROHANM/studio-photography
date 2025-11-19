
import React, { useState, useEffect, useMemo } from 'react';
import { EventData, EventDetails, User, EventDetailsWithUser, Reminder } from '../types';
import DashboardCard from '../components/DashboardCard';
import Calendar from '../components/Calendar';
import NoteModal from '../components/NoteModal';
import DetailsPage from '../components/DetailsPage';
import PendingPaymentsPage from './PendingPaymentsPage';
import ReminderBanner from '../components/ReminderBanner';
import Header from '../components/Header';
import ProfilePage from './ProfilePage';
import UserManagementPage from './UserManagementPage';
import AiSummaryModal from '../components/AiSummaryModal';
import UserModal from '../components/UserModal';
import { CollectionIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, CreditCardIcon, SparklesIcon } from '../components/icons/Icons';
import { getAllEvents, saveEventToDb, deleteEventFromDb } from '../services/db';

interface DashboardPageProps {
  currentUser: User;
  users: User[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, users, onLogout, onUpdateUser, onAddUser, onDeleteUser }) => {
  const [events, setEvents] = useState<EventData>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [view, setView] = useState<'dashboard' | 'details' | 'pending_payments' | 'profile' | 'user_management'>('dashboard');
  const [detailsType, setDetailsType] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderBannerVisible, setIsReminderBannerVisible] = useState(true);

  // --- Notification Logic ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.error("Notification permission error:", err));
    }
  }, []);

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
       try {
         new Notification(title, { body, icon: '/icon-192.png' });
       } catch (e) {
         console.error("Failed to send notification", e);
       }
    }
  };

  useEffect(() => {
    const checkAndSendNotifications = () => {
        if (Object.keys(events).length === 0) return;

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayKey = getLocalDateKey(today);
        const tomorrowKey = getLocalDateKey(tomorrow);

        const keysToCheck = [
          { key: todayKey, label: 'Today' },
          { key: tomorrowKey, label: 'Tomorrow' }
        ];

        let notifiedEvents: string[] = [];
        try {
             const stored = sessionStorage.getItem('notifiedEvents');
             notifiedEvents = stored ? JSON.parse(stored) : [];
             if (!Array.isArray(notifiedEvents)) notifiedEvents = [];
        } catch (e) { notifiedEvents = []; }

        const newNotifiedEvents = [...notifiedEvents];
        let hasNewNotifications = false;

        keysToCheck.forEach(({ key, label }) => {
          const dayEvents = events[key] as EventDetailsWithUser[] || [];
          dayEvents.forEach(event => {
            if (event.status !== 'completed') {
              const uniqueId = `${key}-${event.timeSlot}-${event.text}`;
              if (!notifiedEvents.includes(uniqueId)) {
                 const title = `Upcoming Event: ${event.text} (${label})`;
                 const body = `Customer: ${event.customerName || 'N/A'}\nPlace: ${event.place}\nSession: ${event.timeSlot}`;
                 sendNotification(title, body);
                 newNotifiedEvents.push(uniqueId);
                 hasNewNotifications = true;
              }
            }
          });
        });

        if (hasNewNotifications) {
          sessionStorage.setItem('notifiedEvents', JSON.stringify(newNotifiedEvents));
        }
    };
    
    checkAndSendNotifications();
    const intervalId = setInterval(checkAndSendNotifications, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [events]);

  // --- Load Data from DB ---
  useEffect(() => {
    const loadEvents = async () => {
        try {
             // We pass 'users' so the service can join user data properly
             const allEvents = await getAllEvents(users);
             
             // Filter for non-admin users if needed
             if (currentUser.role !== 'admin') {
                 const filteredData: EventData = {};
                 Object.entries(allEvents).forEach(([date, list]) => {
                     const userEvents = list.filter(e => e.userId === currentUser.id);
                     if (userEvents.length > 0) filteredData[date] = userEvents;
                 });
                 setEvents(filteredData);
             } else {
                 setEvents(allEvents);
             }
        } catch (e) {
            console.error("Failed to load events", e);
        }
    };

    if (users.length > 0) {
        loadEvents();
    }
    
    const reminderDismissed = sessionStorage.getItem('reminderDismissed');
    if (reminderDismissed === 'true') setIsReminderBannerVisible(false);
}, [currentUser, users]); // Reload if users change to ensure names are up to date

  // --- Reminders Update ---
  useEffect(() => {
    const newReminders: Reminder[] = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const todayDateKey = getLocalDateKey(today);
    const tomorrowDateKey = getLocalDateKey(tomorrow);

    (events[todayDateKey] || []).forEach((event: any) => {
        if (event.status !== 'completed') newReminders.push({ type: 'Today', details: event });
    });
    
    (events[tomorrowDateKey] || []).forEach((event: any) => {
        if (event.status !== 'completed') newReminders.push({ type: 'Tomorrow', details: event });
    });
    setReminders(newReminders);
  }, [events]);


  const filteredEvents: EventData = useMemo(() => {
    const filtered: EventData = {};
    Object.entries(events).forEach(([date, eventList]) => {
        let matchingEvents = eventList as EventDetailsWithUser[];
        if (filterStatus !== 'all') {
            matchingEvents = matchingEvents.filter(event => event.status === filterStatus);
        }
        if (matchingEvents.length > 0) filtered[date] = matchingEvents;
    });
    return filtered;
  }, [events, filterStatus]);

  const highlightedDatesForCalendar = useMemo(() => new Set(Object.keys(filteredEvents)), [filteredEvents]);

  const handleNavigate = (newView: 'dashboard' | 'profile' | 'user_management') => setView(newView);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleSaveEvent = async (newEvent: EventDetails, targetUserId: string, originalTimeSlot?: string) => {
    if (selectedDate) {
      const dateKey = getLocalDateKey(selectedDate);
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return;

      const currentDayEvents = events[dateKey] || [];
      // Filter out the event being edited if needed for validation checks
      const otherEvents = newEvent.id 
        ? currentDayEvents.filter(e => e.id !== newEvent.id) 
        : currentDayEvents;

      // Business Logic
      const hasFullDay = otherEvents.some(e => e.timeSlot === 'Full Day');
      const hasMorning = otherEvents.some(e => e.timeSlot === 'Morning');
      const hasEvening = otherEvents.some(e => e.timeSlot === 'Evening');

      if (newEvent.timeSlot === 'Full Day' && otherEvents.length > 0) {
          alert("Cannot add Full Day event: Other events already exist for this date.");
          return;
      }
      if (hasFullDay) {
           alert("Cannot add event: A Full Day event already exists for this date.");
           return;
      }
      if (newEvent.timeSlot === 'Morning' && hasMorning) {
          alert("Morning slot is already taken.");
          return;
      }
      if (newEvent.timeSlot === 'Evening' && hasEvening) {
          alert("Evening slot is already taken.");
          return;
      }

      try {
          // Save to DB
          const savedId = await saveEventToDb(newEvent, dateKey, targetUserId);
          
          // Update Local State
          const eventWithUser: EventDetailsWithUser = {
              ...newEvent,
              id: savedId,
              date: dateKey,
              userId: targetUserId,
              userName: targetUser.name,
              userPhoto: targetUser.photo
          };

          setEvents(prev => {
              const next = { ...prev };
              const existing = next[dateKey] || [];
              // Remove old version if editing
              const clean = newEvent.id ? existing.filter(e => e.id !== newEvent.id) : existing;
              next[dateKey] = [...clean, eventWithUser];
              return next;
          });
          closeModal();
      } catch (e) {
          console.error("Failed to save event", e);
          alert("Failed to save event to database.");
      }
    }
  };

  const handleDeleteEvent = async (eventToDelete: EventDetailsWithUser) => {
    if (selectedDate && eventToDelete.id) {
      try {
          await deleteEventFromDb(eventToDelete.id);
          
          const dateKey = getLocalDateKey(selectedDate);
          setEvents(prev => {
              const next = { ...prev };
              const existing = next[dateKey] || [];
              next[dateKey] = existing.filter(e => e.id !== eventToDelete.id);
              if (next[dateKey].length === 0) delete next[dateKey];
              return next;
          });
      } catch (e) {
          console.error("Delete failed", e);
          alert("Failed to delete event from database.");
      }
    }
  };

  const handleSettlePayment = async (dateKey: string, eventIndex: number) => {
    const dayEvents = events[dateKey] as EventDetailsWithUser[];
    if (!dayEvents || !dayEvents[eventIndex]) return;
    
    const eventToSettle = dayEvents[eventIndex];
    const updatedEvent = { ...eventToSettle, status: 'completed' } as EventDetailsWithUser;

    try {
        await saveEventToDb(updatedEvent, dateKey, eventToSettle.userId);
        
        setEvents(prev => {
            const next = { ...prev };
            if (next[dateKey]) {
                next[dateKey] = next[dateKey].map(e => e.id === eventToSettle.id ? updatedEvent : e);
            }
            return next;
        });
    } catch (e) {
        alert("Failed to update payment status.");
    }
  };

  const handleCardClick = (type: string) => {
    if (type === 'pending' || type === 'pending_amount') {
        setView('pending_payments');
        setDetailsType(type);
    } else {
        setDetailsType(type);
        setView('details');
    }
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setDetailsType(null);
  };
  
  const handleDismissReminders = () => {
    setIsReminderBannerVisible(false);
    sessionStorage.setItem('reminderDismissed', 'true');
  };

  const handleOpenUserModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUserFromModal = (user: User) => {
    if (editingUser) onUpdateUser(user);
    else onAddUser(user);
  };

  // --- Stats Calculation ---
  const statsData = useMemo(() => {
    const viewEventsFlat = Object.values(filteredEvents).flat() as EventDetailsWithUser[];
    const totalOrders = viewEventsFlat.length;
    const completedOrders = viewEventsFlat.filter(e => e.status === 'completed').length;
    const pendingOrders = totalOrders - completedOrders;
    const amountReceived = viewEventsFlat
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const amountPending = viewEventsFlat
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return { totalOrders, completedOrders, pendingOrders, amountReceived, amountPending };
  }, [filteredEvents]);

  const stats = [
    { key: 'total', title: 'Total Orders', value: statsData.totalOrders.toString(), icon: <CollectionIcon className="w-8 h-8 text-blue-500" /> },
    { key: 'completed', title: 'Completed Orders', value: statsData.completedOrders.toString(), icon: <CheckCircleIcon className="w-8 h-8 text-green-500" /> },
    { key: 'pending', title: 'Pending Orders', value: statsData.pendingOrders.toString(), icon: <ClockIcon className="w-8 h-8 text-yellow-500" /> },
    { key: 'received', title: 'Amount Received', value: `₹${statsData.amountReceived.toLocaleString('en-IN')}`, icon: <CurrencyDollarIcon className="w-8 h-8 text-indigo-500" /> },
    { key: 'pending_amount', title: 'Amount Pending', value: `₹${statsData.amountPending.toLocaleString('en-IN')}`, icon: <CreditCardIcon className="w-8 h-8 text-orange-500" /> },
  ];

  // --- Details Data Preparation ---
  const getDetailsData = () => {
    const allEvents = Object.entries(filteredEvents)
      .flatMap(([date, list]) => (list as EventDetailsWithUser[]).map(details => ({ date, details })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let filteredEventsList = allEvents;
    if (detailsType === 'completed' || detailsType === 'received') {
        filteredEventsList = allEvents.filter(e => e.details.status === 'completed');
    } else if (detailsType === 'pending' || detailsType === 'pending_amount') {
        filteredEventsList = allEvents.filter(e => e.details.status === 'pending');
    }
    
    const currentStat = stats.find(s => s.key === detailsType);
    return { title: currentStat ? currentStat.title : 'Details', events: filteredEventsList };
  };
  
  const detailsData = view === 'details' ? getDetailsData() : { title: '', events: [] };
  
  const pendingEventsData = useMemo(() => {
    return Object.entries(filteredEvents)
      .flatMap(([date, list]) => (list as EventDetailsWithUser[]).map((details, index) => ({ date, details, index })))
      .filter(e => e.details.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEvents]);

  const renderContent = () => {
    const isAdmin = currentUser.role === 'admin';
    switch (view) {
      case 'profile':
        return (
          <ProfilePage 
            user={currentUser} 
            onEditProfile={handleOpenUserModal}
            onBack={() => setView('dashboard')} 
          />
        );
      case 'user_management':
        return (
            <UserManagementPage 
                users={users} 
                onAddUserClick={() => handleOpenUserModal(null)}
                onEditUser={handleOpenUserModal}
                onDeleteUser={onDeleteUser}
                onBack={() => setView('dashboard')} 
            />
        );
      case 'details':
        return (
          <DetailsPage 
            title={detailsData.title} 
            events={detailsData.events} 
            onBack={handleBackToDashboard} 
            isAdmin={isAdmin}
          />
        );
      case 'pending_payments':
        return (
          <PendingPaymentsPage
            events={pendingEventsData}
            totalAmount={statsData.amountPending}
            onBack={handleBackToDashboard}
            onSettlePayment={handleSettlePayment}
            isAdmin={isAdmin}
          />
        );
      case 'dashboard':
      default:
        return (
          <>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard Overview</h1>
            {isReminderBannerVisible && reminders.length > 0 && (
              <ReminderBanner 
                reminders={reminders} 
                onDismiss={handleDismissReminders} 
                isAdmin={isAdmin}
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {stats.map(stat => (
                <DashboardCard 
                  key={stat.key} 
                  title={stat.title} 
                  value={stat.value} 
                  icon={stat.icon} 
                  onClick={() => handleCardClick(stat.key)}
                />
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Event Calendar</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white dark:bg-gray-600 text-brand-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>All</button>
                        <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Upcoming</button>
                        <button onClick={() => setFilterStatus('completed')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'completed' ? 'bg-gray-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Completed</button>
                    </div>
                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        AI Summary
                    </button>
                </div>
              </div>
              <Calendar 
                events={filteredEvents} 
                onDateSelect={handleDateSelect} 
                highlightedDates={highlightedDatesForCalendar} 
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={onLogout} onNavigate={handleNavigate} />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
        <div className="flex-grow">{renderContent()}</div>
        <footer className="mt-8 py-4 text-center text-xs text-gray-500 dark:text-gray-400">© 2025 Ajay Rohan M. All Rights Reserved.</footer>
      </main>

      {isModalOpen && selectedDate && (
        <NoteModal
          isOpen={isModalOpen}
          onClose={closeModal}
          date={selectedDate}
          events={(events[getLocalDateKey(selectedDate)] || []) as EventDetailsWithUser[]}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          currentUser={currentUser}
          users={users}
        />
      )}

      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUserFromModal} userToEdit={editingUser} isAdmin={currentUser.role === 'admin'} />
      <AiSummaryModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} events={filteredEvents} isAdmin={currentUser.role === 'admin'} />
    </div>
  );
};

export default DashboardPage;
