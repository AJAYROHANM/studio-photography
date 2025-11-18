import React, { useState, useEffect, useMemo } from 'react';
import { EventData, EventDetails, User } from '../types';
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

interface Reminder {
  type: 'Today' | 'Tomorrow';
  details: EventDetails;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, users, onLogout, onUpdateUser, onAddUser, onDeleteUser }) => {
  const [events, setEvents] = useState<EventData>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'details' | 'pending_payments' | 'profile' | 'user_management'>('dashboard');
  const [detailsType, setDetailsType] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isReminderBannerVisible, setIsReminderBannerVisible] = useState(true);

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
    try {
      const storedEvents = localStorage.getItem('calendarEvents');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        setEvents(parsedEvents);
        checkAndSetReminders(parsedEvents);
      }
      const reminderDismissed = sessionStorage.getItem('reminderDismissed');
      if (reminderDismissed === 'true') {
        setIsReminderBannerVisible(false);
      }
    } catch (error) {
      console.error("Failed to parse events from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

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

  const handleSaveEvent = (event: EventDetails) => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const newEvents = {
        ...events,
        [dateKey]: event,
      };
      setEvents(newEvents);
      checkAndSetReminders(newEvents);
      closeModal();
    }
  };

  const handleDeleteEvent = () => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
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
    const eventsArray = Object.values(events);
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
  }, [events]);

  const stats = [
    { key: 'total', title: 'Total Orders', value: statsData.totalOrders.toString(), icon: <CollectionIcon className="w-8 h-8 text-blue-500" /> },
    { key: 'completed', title: 'Completed Orders', value: statsData.completedOrders.toString(), icon: <CheckCircleIcon className="w-8 h-8 text-green-500" /> },
    { key: 'pending', title: 'Pending Orders', value: statsData.pendingOrders.toString(), icon: <ClockIcon className="w-8 h-8 text-yellow-500" /> },
    { key: 'received', title: 'Amount Received', value: `₹${statsData.amountReceived.toLocaleString('en-IN')}`, icon: <CurrencyDollarIcon className="w-8 h-8 text-indigo-500" /> },
    { key: 'pending_amount', title: 'Amount Pending', value: `₹${statsData.amountPending.toLocaleString('en-IN')}`, icon: <CreditCardIcon className="w-8 h-8 text-orange-500" /> },
  ];

  const getDetailsData = () => {
    const allEvents = Object.entries(events)
      .map(([date, details]) => ({ date, details }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const currentStat = stats.find(s => s.key === detailsType);
    const title = currentStat ? currentStat.title : 'Details';

    let filteredEvents = allEvents;

    switch (detailsType) {
      case 'completed':
      case 'received':
        filteredEvents = allEvents.filter(e => e.details.status === 'completed');
        break;
      case 'pending':
      case 'pending_amount':
        filteredEvents = allEvents.filter(e => e.details.status === 'pending');
        break;
      case 'total':
      default:
        break;
    }
    return { title, events: filteredEvents };
  };
  
  const detailsData = view === 'details' ? getDetailsData() : { title: '', events: [] };
  
  const pendingEventsData = useMemo(() => {
    return Object.entries(events)
      .map(([date, details]) => ({ date, details }))
      .filter(e => e.details.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const renderContent = () => {
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
        return <DetailsPage title={detailsData.title} events={detailsData.events} onBack={handleBackToDashboard} />;
      case 'pending_payments':
        return (
          <PendingPaymentsPage
            events={pendingEventsData}
            totalAmount={statsData.amountPending}
            onBack={handleBackToDashboard}
            onSettlePayment={handleSettlePayment}
          />
        );
      case 'dashboard':
      default:
        return (
          <>
            {isReminderBannerVisible && reminders.length > 0 && (
              <ReminderBanner reminders={reminders} onDismiss={handleDismissReminders} />
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
                  className="flex items-center px-3 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800 transition-colors text-sm"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  AI Summary
                </button>
              </div>
              <Calendar events={events} onDateSelect={handleDateSelect} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={onLogout} onNavigate={handleNavigate} />
      
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
        />
      )}

      <AiSummaryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        events={events}
      />
    </div>
  );
};

export default DashboardPage;