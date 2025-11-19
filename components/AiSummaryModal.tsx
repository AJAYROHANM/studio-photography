
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { EventData, EventDetailsWithUser } from '../types';
import { SparklesIcon, XIcon } from './icons/Icons';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventData;
  isAdmin: boolean;
}

const AiSummaryModal: React.FC<AiSummaryModalProps> = ({ isOpen, onClose, events, isAdmin }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateSummary();
    }
  }, [isOpen]);

  const generateSummary = async () => {
    if (Object.keys(events).length === 0) {
      setSummary("You don't have any events scheduled. Add some events to your calendar to get a summary!");
      setIsLoading(false);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      // Flatten events structure and sanitize data for the prompt
      // CRITICAL: We create a new object with only the necessary string/number fields.
      // We explicitly DO NOT pass the `userPhoto` field or the full event object to avoid sending base64 images.
      const allEvents = Object.entries(events).flatMap(([date, list]) => {
        const eventDate = new Date(date);
        // Filter: Include all pending events regardless of date (for accurate pending totals),
        // and any event (pending or completed) from the last 30 days onwards.
        // This filters out old completed history to keep payload size manageable.
        const isRecentOrFuture = eventDate >= thirtyDaysAgo;

        return (list as EventDetailsWithUser[])
          .filter(event => event.status === 'pending' || isRecentOrFuture)
          .map(event => ({ 
            date,
            description: event.text,
            amount: event.amount,
            venue: event.place,
            status: event.status,
            timeSlot: event.timeSlot,
            customerName: event.customerName,
            // If admin, include the user name, but never the photo
            userName: isAdmin ? event.userName : undefined 
          }));
      });

      // Limit to 200 events to prevent hitting XHR body size limits or token limits
      // If user has massive amounts of data, we prioritize the most relevant ones (flatmap usually preserves order if dates were sorted, but keys might not be).
      // Let's sort by date just in case to keep most relevant.
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Take the last 200 items (assuming they are chronological, this keeps recent/future)
      // Or actually, since we want pending + upcoming, let's just slice.
      const limitedEvents = allEvents.length > 200 ? allEvents.slice(allEvents.length - 200) : allEvents;

      const prompt = `
        You are a helpful assistant for a photographer using a dashboard to manage their photo shoot orders.
        Based on the following event data (in JSON format), provide a concise and friendly summary.

        Your summary should highlight:
        - The total number of upcoming events.
        - The total amount in pending payments.
        - The busiest day or period.
        - Any urgent upcoming tasks.
        - Conclude with a friendly, encouraging remark.

        IMPORTANT:
        - Format all monetary values using the Indian Rupee symbol (₹). Do not use the dollar sign ($).
        - Format the key points as a bulleted list.

        Event data:
        ${JSON.stringify(limitedEvents, null, 2)}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setSummary(response.text || '');
    } catch (e) {
      console.error('Error generating summary:', e);
      setError('Sorry, I was unable to generate a summary at this time. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label="Close">
          <XIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center mb-4">
          <SparklesIcon className="w-6 h-6 text-brand-primary mr-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI-Powered Summary</h2>
        </div>
        
        <div className="min-h-[150px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Generating your summary...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">
              <p className="font-semibold">An Error Occurred</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {summary && !isLoading && (
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm leading-relaxed">
              {summary}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
           <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
        </div>

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

export default AiSummaryModal;
