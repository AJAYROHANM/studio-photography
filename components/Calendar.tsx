
import React, { useState } from 'react';
import { EventData, EventDetailsWithUser } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarProps {
  events: EventData;
  onDateSelect: (date: Date) => void;
  highlightedDates?: Set<string>;
}

const Calendar: React.FC<CalendarProps> = ({ events, onDateSelect, highlightedDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const daysOfWeekLong = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header Row */}
        {daysOfWeekLong.map((day, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-2 text-center font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{daysOfWeek[index]}</span>
          </div>
        ))}
        
        {/* Days Grid */}
        {calendarDays.map((date, index) => {
          const dateKey = getLocalDateKey(date);
          const eventList = (events[dateKey] || []) as EventDetailsWithUser[];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isTodaysDate = isToday(date);
          const isHighlighted = highlightedDates?.has(dateKey);

          return (
            <div
              key={index}
              className={`min-h-[80px] md:min-h-[100px] p-1 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex flex-col group ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
              onClick={() => onDateSelect(date)}
            >
              <div className="flex justify-between items-start">
                  <span 
                    className={`text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center 
                    ${isTodaysDate ? 'bg-brand-primary text-white' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}
                    ${!isTodaysDate && isHighlighted ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                    `}
                  >
                    {date.getDate()}
                  </span>
              </div>

              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                 {eventList.map((event, idx) => {
                     const isCompleted = event.status === 'completed';
                     
                     return (
                         <div 
                            key={idx}
                            className={`
                                text-[10px] md:text-xs p-1 rounded border truncate leading-tight
                                ${isCompleted 
                                    ? 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400' 
                                    : 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-200'
                                }
                            `}
                         >
                             <div className="flex items-center gap-1">
                                 <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCompleted ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
                                 <span className="font-bold opacity-90">
                                     {event.timeSlot === 'Morning' ? 'Morn' : event.timeSlot === 'Evening' ? 'Eve' : 'Full'}
                                 </span>
                             </div>
                             <span className="block truncate opacity-85">{event.text}</span>
                         </div>
                     );
                 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
