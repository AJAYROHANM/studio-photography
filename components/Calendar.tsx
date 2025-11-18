import React, { useState } from 'react';
import { EventData } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarProps {
  events: EventData;
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onDateSelect }) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day, index) => (
          <div key={index} className="font-medium text-gray-500 dark:text-gray-400 text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">{daysOfWeekLong[index]}</span>
            <span className="sm:hidden">{day}</span>
          </div>
        ))}
        {calendarDays.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const hasEvent = !!events[dateKey];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isTodaysDate = isToday(date);

          return (
            <div
              key={index}
              className={`p-1 cursor-pointer border border-transparent rounded-lg transition-colors ${isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'} hover:bg-blue-100 dark:hover:bg-blue-900`}
              onClick={() => onDateSelect(date)}
            >
              <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full ${isTodaysDate ? 'bg-brand-primary text-white' : ''} ${!isTodaysDate && hasEvent ? 'bg-yellow-200 dark:bg-yellow-700' : ''}`}>
                <span>{date.getDate()}</span>
                {hasEvent && !isTodaysDate && (
                  <span className="absolute bottom-0 right-0 block w-2 h-2 bg-yellow-500 rounded-full"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;