
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

// Type guard to validate event details
const isValidEventDetails = (details: any): boolean => {
  return (
    details &&
    typeof details === 'object' &&
    typeof details.text === 'string' &&
    typeof details.amount === 'number' &&
    typeof details.place === 'string'
  );
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

  // --- Notification Logic Start ---
  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
       new Notification(title, {
         body,
         icon: '/icon-192.png', // Assuming this exists from manifest
       });
    }
  };

  // Check for upcoming events and send notifications
  useEffect(() => {
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

    // Use sessionStorage to track sent notifications for this session to avoid spam
    const notifiedEvents = JSON.parse(sessionStorage.getItem('notifiedEvents') || '[]');
    const newNotifiedEvents = [...notifiedEvents];
    let hasNewNotifications = false;

    keysToCheck.forEach(({ key, label }) => {
      const dayEvents = events[key] as EventDetailsWithUser[] || [];
      dayEvents.forEach(event => {
        if (event.status !== 'completed') {
          // Create a unique ID for the notification
          const uniqueId = `${key}-${event.timeSlot}-${event.text}`;
          
          if (!notifiedEvents.includes(uniqueId)) {
             const title = `Upcoming Event: ${event.text} (${label})`;
             const body = `Customer: ${event.customerName || 'N/A'}\nContact: ${event.customerMobile || 'N/A'}\nPlace: ${event.place}\nSession: ${event.timeSlot}`;
             
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

  }, [events]);
  // --- Notification Logic End ---

  const checkAndSetReminders = (allEvents: EventData) => {
    const newReminders: Reminder[] = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayDateKey = getLocalDateKey(today);
    const tomorrowDateKey = getLocalDateKey(tomorrow);

    const eventsForToday = allEvents[todayDateKey] || [];
    eventsForToday.forEach((event: any) => {
        if (event.status !== 'completed') {
            newReminders.push({ type: 'Today', details: event });
        }
    });
    
    const eventsForTomorrow = allEvents[tomorrowDateKey] || [];
    eventsForTomorrow.forEach((event: any) => {
        if (event.status !== 'completed') {
            newReminders.push({ type: 'Tomorrow', details: event });
        }
    });

    setReminders(newReminders);
  };
  
  // Effect to keep reminders in sync whenever events change
  useEffect(() => {
      checkAndSetReminders(events);
  }, [events]);

  useEffect(() => {
    const loadEvents = () => {
        let allEvents: EventData = {};
        
        const processEvents = (user: User) => {
            try {
                const storedUserEvents = localStorage.getItem(`calendarEvents_${user.id}`);
                if (storedUserEvents) {
                    const parsedData = JSON.parse(storedUserEvents);
                    if (parsedData && typeof parsedData === 'object') {
                        Object.entries(parsedData).forEach(([dateKey, data]) => {
                            // Handle legacy data (single object) vs new data (array)
                            const eventList = (Array.isArray(data) ? data : [data]) as any[];
                            
                            const validEvents = eventList
                                .filter(isValidEventDetails)
                                .map((details: any) => ({
                                    ...details,
                                    userId: user.id,
                                    userName: user.name,
                                    userPhoto: user.photo,
                                    // Migration: Default to Full Day if undefined
                                    timeSlot: details.timeSlot || 'Full Day'
                                }));

                            if (validEvents.length > 0) {
                                if (!allEvents[dateKey]) {
                                    allEvents[dateKey] = [];
                                }
                                allEvents[dateKey] = [...allEvents[dateKey], ...validEvents];
                            }
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to parse events for user ${user.id}`, error);
            }
        };

        if (currentUser.role === 'admin') {
            users.forEach(processEvents);
        } else {
            processEvents(currentUser);
        }
        
        setEvents(allEvents);
    };

    loadEvents();
    
    const reminderDismissed = sessionStorage.getItem('reminderDismissed');
    if (reminderDismissed === 'true') {
        setIsReminderBannerVisible(false);
    }
}, [currentUser, users]);

  const filteredEvents: EventData = useMemo(() => {
    const filtered: EventData = {};

    Object.entries(events).forEach(([date, eventList]) => {
        // Explicitly cast eventList to avoid 'unknown' type error
        const list = eventList as EventDetailsWithUser[];
        let matchingEvents = list;

        // Apply Status Filter
        if (filterStatus !== 'all') {
            matchingEvents = matchingEvents.filter(event => event.status === filterStatus);
        }

        if (matchingEvents.length > 0) {
            filtered[date] = matchingEvents;
        }
    });

    return filtered;
  }, [events, filterStatus]);

  const highlightedDatesForCalendar = useMemo(() => {
    return new Set(Object.keys(filteredEvents));
  }, [filteredEvents]);

  const handleNavigate = (newView: 'dashboard' | 'profile' | 'user_management') => {
    setView(newView);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleSaveEvent = (newEvent: EventDetails, targetUserId: string, originalTimeSlot?: string) => {
    if (selectedDate) {
      const dateKey = getLocalDateKey(selectedDate);
      
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) {
        console.error("Target user not found.");
        closeModal();
        return;
      }

      // Fetch current events for this user/date from local storage to ensure sync
      let userEventsMap: any = {};
      try {
          const stored = localStorage.getItem(`calendarEvents_${targetUserId}`);
          if (stored) userEventsMap = JSON.parse(stored);
      } catch(e) { console.error(e); }

      let currentDayEvents: EventDetails[] = Array.isArray(userEventsMap[dateKey]) 
          ? userEventsMap[dateKey] 
          : (userEventsMap[dateKey] ? [userEventsMap[dateKey]] : []); // Handle legacy

      // If editing, remove the original event first
      if (originalTimeSlot) {
          currentDayEvents = currentDayEvents.filter(e => e.timeSlot !== originalTimeSlot);
      }

      // Business Logic Validation
      const hasFullDay = currentDayEvents.some(e => e.timeSlot === 'Full Day');
      const hasMorning = currentDayEvents.some(e => e.timeSlot === 'Morning');
      const hasEvening = currentDayEvents.some(e => e.timeSlot === 'Evening');

      if (newEvent.timeSlot === 'Full Day' && currentDayEvents.length > 0) {
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

      // Add new event
      currentDayEvents.push(newEvent);

      // Save to LocalStorage
      userEventsMap[dateKey] = currentDayEvents;
      localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEventsMap));

      // Update State
      const newGlobalEvents = currentDayEvents.map(d => ({
          ...d,
          userId: targetUserId,
          userName: targetUser.name,
          userPhoto: targetUser.photo
      }));

      setEvents(prevEvents => {
          const nextEvents = { ...prevEvents };
          if (currentUser.role === 'admin') {
             const existing = prevEvents[dateKey] || [];
             const others = existing.filter(e => (e as any).userId !== targetUserId);
             nextEvents[dateKey] = [...others, ...newGlobalEvents] as any;
          } else {
             nextEvents[dateKey] = newGlobalEvents as any;
          }
          return nextEvents;
      });
      
      closeModal();
    }
  };

  const handleDeleteEvent = (eventToDelete: EventDetailsWithUser) => {
    if (selectedDate) {
      const dateKey = getLocalDateKey(selectedDate);
      const targetUserId = eventToDelete.userId;

      try {
          const stored = localStorage.getItem(`calendarEvents_${targetUserId}`);
          const userEventsMap = stored ? JSON.parse(stored) : {};
          let dayEvents = Array.isArray(userEventsMap[dateKey]) ? userEventsMap[dateKey] : [userEventsMap[dateKey]];
          
          // Filter out the specific event based on timeSlot
          dayEvents = dayEvents.filter((e: EventDetails) => e.timeSlot !== eventToDelete.timeSlot);

          if (dayEvents.length === 0) {
              delete userEventsMap[dateKey];
          } else {
              userEventsMap[dateKey] = dayEvents;
          }
          localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEventsMap));
      } catch (e) {
          console.error("Could not delete event", e);
      }

      // Update State
      const updatedEvents = { ...events };
      const dayList = (updatedEvents[dateKey] || []) as EventDetailsWithUser[];
      updatedEvents[dateKey] = dayList.filter(e => 
          !(e.userId === targetUserId && e.timeSlot === eventToDelete.timeSlot)
      );

      if (updatedEvents[dateKey].length === 0) delete updatedEvents[dateKey];

      setEvents(updatedEvents);
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
  
  const handleSettlePayment = (dateKey: string, eventIndex: number) => {
    // Find the specific event to settle
    const dayEvents = events[dateKey] as EventDetailsWithUser[];
    if (!dayEvents || !dayEvents[eventIndex]) return;
    
    const eventToSettle = dayEvents[eventIndex];
    const targetUserId = eventToSettle.userId;

    // Update localStorage
    try {
        const stored = localStorage.getItem(`calendarEvents_${targetUserId}`);
        const userEventsMap = stored ? JSON.parse(stored) : {};
        let localDayEvents = Array.isArray(userEventsMap[dateKey]) ? userEventsMap[dateKey] : [userEventsMap[dateKey]];
        
        // Find matching event in local storage to update
        localDayEvents = localDayEvents.map((e: EventDetails) => {
            if (e.timeSlot === eventToSettle.timeSlot) {
                return { ...e, status: 'completed' };
            }
            return e;
        });
        
        userEventsMap[dateKey] = localDayEvents;
        localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEventsMap));
    } catch (e) {
        console.error("Could not settle payment in localStorage", e);
    }
    
    // Update State
    setEvents(prevEvents => {
      const updatedEvents = { ...prevEvents };
      if (updatedEvents[dateKey]) {
         updatedEvents[dateKey] = (updatedEvents[dateKey] as any[]).map((e, idx) => 
             idx === eventIndex ? { ...e, status: 'completed' } : e
         );
      }
      return updatedEvents;
    });
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
    if (editingUser) {
        onUpdateUser(user);
    } else {
        onAddUser(user);
    }
  };

  const statsData = useMemo(() => {
    // Use filteredEvents to calculate stats based on current view filters
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

  const getDetailsData = () => {
    // Flatten events with date info
    const allEvents = Object.entries(filteredEvents)
      .flatMap(([date, list]) => (list as EventDetailsWithUser[]).map(details => ({ date, details })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const currentStat = stats.find(s => s.key === detailsType);
    const title = currentStat ? currentStat.title : 'Details';

    let filteredEventsList = allEvents;

    switch (detailsType) {
      case 'completed':
      case 'received':
        filteredEventsList = allEvents.filter(e => e.details.status === 'completed');
        break;
      case 'pending':
      case 'pending_amount':
        filteredEventsList = allEvents.filter(e => e.details.status === 'pending');
        break;
      case 'total':
      default:
        break;
    }
    return { title, events: filteredEventsList };
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
                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white dark:bg-gray-600 text-brand-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === 'completed' ? 'bg-gray-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            Completed
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 text-sm"
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
      <Header 
        currentUser={currentUser} 
        onLogout={onLogout} 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
        <div className="flex-grow">
            {renderContent()}
        </div>
        <footer className="mt-8 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
            © 2025 Ajay Rohan M. All Rights Reserved.
        </footer>
      </main>

      {isModalOpen && selectedDate && (
        <NoteModal
          isOpen={isModalOpen}
          onClose={closeModal}
          date={selectedDate}
          // Pass ALL events for this date to ensure collision detection works properly
          // even if they are hidden by the current filter.
          events={(events[getLocalDateKey(selectedDate)] || []) as EventDetailsWithUser[]}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          currentUser={currentUser}
          users={users}
        />
      )}

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUserFromModal}
        userToEdit={editingUser}
        isAdmin={currentUser.role === 'admin'}
      />

      <AiSummaryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        events={filteredEvents}
        isAdmin={currentUser.role === 'admin'}
      />
    </div>
  );
};

export default DashboardPage;
