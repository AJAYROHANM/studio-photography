
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
import { CollectionIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, CreditCardIcon, SparklesIcon } from '../components/icons/Icons';

interface DashboardPageProps {
  currentUser: User;
  users: User[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

// Type guard to validate event details from localStorage, preventing crashes from corrupted data.
const isValidEventDetails = (details: any): details is EventDetails => {
  return (
    details &&
    typeof details === 'object' &&
    !Array.isArray(details) &&
    typeof details.text === 'string' &&
    typeof details.sendSms === 'boolean' &&
    typeof details.amount === 'number' &&
    typeof details.place === 'string' &&
    (details.status === 'pending' || details.status === 'completed')
  );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, users, onLogout, onUpdateUser, onAddUser, onDeleteUser }) => {
  const [events, setEvents] = useState<EventData>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'details' | 'pending_payments' | 'profile' | 'user_management'>('dashboard');
  const [detailsType, setDetailsType] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderBannerVisible, setIsReminderBannerVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery.toLowerCase());
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [searchQuery]);

  const checkAndSetReminders = (allEvents: EventData) => {
    const newReminders: Reminder[] = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayDateKey = today.toISOString().split('T')[0];
    const tomorrowDateKey = tomorrow.toISOString().split('T')[0];

    const eventForToday = allEvents[todayDateKey];
    if (eventForToday && eventForToday.sendSms) {
      newReminders.push({ type: 'Today', details: eventForToday });
    }
    
    const eventForTomorrow = allEvents[tomorrowDateKey];
    if (eventForTomorrow && eventForTomorrow.sendSms) {
      newReminders.push({ type: 'Tomorrow', details: eventForTomorrow });
    }
    setReminders(newReminders);
  };

  useEffect(() => {
    const loadEvents = () => {
        let allEvents: EventData = {};
        
        if (currentUser.role === 'admin') {
            users.forEach(user => {
                try {
                    const storedUserEvents = localStorage.getItem(`calendarEvents_${user.id}`);
                    if (storedUserEvents) {
                        const parsedUserEvents = JSON.parse(storedUserEvents);
                        if (parsedUserEvents && typeof parsedUserEvents === 'object') {
                            Object.entries(parsedUserEvents).forEach(([dateKey, details]) => {
                                if (isValidEventDetails(details)) {
                                    allEvents[dateKey] = {
                                        ...details,
                                        userId: user.id,
                                        userName: user.name,
                                        userPhoto: user.photo,
                                    };
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to parse events for user ${user.id}`, error);
                }
            });
        } else {
            // Normal user
            try {
                const storedEvents = localStorage.getItem(`calendarEvents_${currentUser.id}`);
                if (storedEvents) {
                    const parsedEvents = JSON.parse(storedEvents);
                    if (parsedEvents && typeof parsedEvents === 'object') {
                        Object.entries(parsedEvents).forEach(([dateKey, details]) => {
                            if (isValidEventDetails(details)) {
                                allEvents[dateKey] = {
                                    ...details,
                                    userId: currentUser.id,
                                    userName: currentUser.name,
                                    userPhoto: currentUser.photo,
                                };
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to parse events from localStorage", error);
            }
        }
        setEvents(allEvents);
        checkAndSetReminders(allEvents);
    };

    loadEvents();
    
    const reminderDismissed = sessionStorage.getItem('reminderDismissed');
    if (reminderDismissed === 'true') {
        setIsReminderBannerVisible(false);
    }
}, [currentUser, users]);

  // FIX: Explicitly type `filteredEvents` as `EventData` to fix type inference issues.
  const filteredEvents: EventData = useMemo(() => {
    if (!debouncedSearchQuery) {
        return events;
    }
    const isAdmin = currentUser.role === 'admin';
    return Object.fromEntries(
      // FIX: Explicitly type the destructured 'event' parameter to fix type inference issue.
      Object.entries(events).filter(([, event]: [string, EventDetailsWithUser]) =>
        event.text.toLowerCase().includes(debouncedSearchQuery) ||
        event.place.toLowerCase().includes(debouncedSearchQuery) ||
        (isAdmin && event.userName.toLowerCase().includes(debouncedSearchQuery))
      )
    );
  }, [events, debouncedSearchQuery, currentUser.role]);

  const highlightedDatesForCalendar = useMemo(() => {
    if (!debouncedSearchQuery) {
        return new Set<string>();
    }
    return new Set(Object.keys(filteredEvents));
  }, [filteredEvents, debouncedSearchQuery]);

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

  const handleSaveEvent = (event: EventDetails, targetUserId: string) => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      
      const targetUser = users.find(u => u.id === targetUserId);

      if (!targetUser) {
        console.error("Target user not found for saving event.");
        closeModal();
        return;
      }

      // Update localStorage
      try {
          const storedUserEvents = localStorage.getItem(`calendarEvents_${targetUserId}`);
          const userEvents = storedUserEvents ? JSON.parse(storedUserEvents) : {};
          userEvents[dateKey] = event; // event is EventDetails, without user info
          localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEvents));
      } catch (e) {
          console.error("Could not save event to localStorage", e);
          closeModal();
          return;
      }

      // Update state
      const newEvents = { ...events };
      newEvents[dateKey] = {
          ...event,
          userId: targetUserId,
          userName: targetUser.name,
          userPhoto: targetUser.photo,
      };

      setEvents(newEvents);
      checkAndSetReminders(newEvents);
      closeModal();
    }
  };

  const handleDeleteEvent = () => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const eventToDelete = events[dateKey];
      if (!eventToDelete) {
          closeModal();
          return;
      }
      const targetUserId = eventToDelete.userId;

      // Update localStorage
      try {
          const storedUserEvents = localStorage.getItem(`calendarEvents_${targetUserId}`);
          const userEvents = storedUserEvents ? JSON.parse(storedUserEvents) : {};
          delete userEvents[dateKey];
          localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEvents));
      } catch (e) {
          console.error("Could not delete event from localStorage", e);
      }

      // Update state
      const newEvents = { ...events };
      delete newEvents[dateKey];
      setEvents(newEvents);
      checkAndSetReminders(newEvents);
      closeModal();
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
  
  const handleSettlePayment = (dateKey: string) => {
     const eventToSettle = events[dateKey];
    if (!eventToSettle) return;
    const targetUserId = eventToSettle.userId;

    // Update localStorage
    try {
        const storedUserEvents = localStorage.getItem(`calendarEvents_${targetUserId}`);
        const userEvents = storedUserEvents ? JSON.parse(storedUserEvents) : {};
        if (userEvents[dateKey]) {
            userEvents[dateKey] = { ...userEvents[dateKey], status: 'completed' };
            localStorage.setItem(`calendarEvents_${targetUserId}`, JSON.stringify(userEvents));
        }
    } catch (e) {
        console.error("Could not settle payment in localStorage", e);
    }
    
    setEvents(prevEvents => {
      const updatedEvents = { ...prevEvents };
      if (updatedEvents[dateKey]) {
        updatedEvents[dateKey] = { ...updatedEvents[dateKey], status: 'completed' };
      }
      return updatedEvents;
    });
  };

  const handleDismissReminders = () => {
    setIsReminderBannerVisible(false);
    sessionStorage.setItem('reminderDismissed', 'true');
  };

  const statsData = useMemo(() => {
    const eventsArray = Object.values(filteredEvents);
    const totalOrders = eventsArray.length;
    const completedOrders = eventsArray.filter(e => e.status === 'completed').length;
    const pendingOrders = totalOrders - completedOrders;
    const amountReceived = eventsArray
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const amountPending = eventsArray
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
    const allEvents = Object.entries(filteredEvents)
      .map(([date, details]) => ({ date, details }))
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
      .map(([date, details]) => ({ date, details }))
      .filter(e => e.details.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEvents]);

  const renderContent = () => {
    const isAdmin = currentUser.role === 'admin';
    switch (view) {
      case 'profile':
        return <ProfilePage user={currentUser} onUpdateUser={onUpdateUser} onBack={() => setView('dashboard')} />;
      case 'user_management':
        return (
            <UserManagementPage 
                users={users} 
                onAddUser={onAddUser} 
                onUpdateUser={onUpdateUser} 
                onDeleteUser={onDeleteUser}
                onBack={() => setView('dashboard')} 
            />
        );
      case 'details':
        return <DetailsPage title={detailsData.title} events={detailsData.events} onBack={handleBackToDashboard} isAdmin={isAdmin} />;
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
            {isReminderBannerVisible && reminders.length > 0 && !debouncedSearchQuery && (
              <ReminderBanner reminders={reminders} onDismiss={handleDismissReminders} isAdmin={isAdmin} />
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
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Event Calendar</h2>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  AI Summary
                </button>
              </div>
              <Calendar events={events} onDateSelect={handleDateSelect} highlightedDates={highlightedDatesForCalendar} />
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {renderContent()}
      </main>

      {isModalOpen && selectedDate && (
        <NoteModal
          isOpen={isModalOpen}
          onClose={closeModal}
          date={selectedDate}
          event={events[selectedDate.toISOString().split('T')[0]]}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          currentUser={currentUser}
          users={users}
        />
      )}

      <AiSummaryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        events={filteredEvents}
        isAdmin={currentUser.role === 'admin'}
        searchQuery={debouncedSearchQuery}
      />
    </div>
  );
};

export default DashboardPage;
