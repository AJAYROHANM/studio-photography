
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
    const hasEvents = Object.keys(events).length > 0;
    
    if (!hasEvents) {
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
      
      // --- Client-Side Pre-processing to reduce payload size ---
      // Calculating stats locally prevents sending huge JSON blobs over the network
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let totalPendingAmount = 0;
      let totalPendingCount = 0;
      let totalUpcomingCount = 0;
      let completedCount = 0;

      const allEventsList: { date: Date; details: EventDetailsWithUser }[] = [];

      Object.entries(events).forEach(([dateStr, list]) => {
        const date = new Date(dateStr);
        (list as EventDetailsWithUser[]).forEach(event => {
           allEventsList.push({ date, details: event });
           
           // Calculate stats
           if (event.status === 'pending') {
               totalPendingAmount += event.amount;
               totalPendingCount++;
           } else if (event.status === 'completed') {
               completedCount++;
           }

           if (date >= today) {
               totalUpcomingCount++;
           }
        });
      });

      // Get only the next 15 upcoming events for context
      // This ensures the prompt size remains small
      const nextEvents = allEventsList
        .filter(e => e.date >= today)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 15)
        .map(e => ({
            date: e.date.toISOString().split('T')[0],
            text: e.details.text.length > 50 ? e.details.text.substring(0, 50) + '...' : e.details.text,
            amount: e.details.amount,
            status: e.details.status,
            timeSlot: e.details.timeSlot,
            customer: e.details.customerName ? 'Yes' : 'No' // Anonymize/Simplify to save tokens
        }));

      // Construct a minimal data object for the AI
      const summaryData = {
          stats: {
              totalEvents: allEventsList.length,
              completedEvents: completedCount,
              pendingEvents: totalPendingCount,
              totalPendingAmount: totalPendingAmount,
              upcomingEventsCount: totalUpcomingCount
          },
          upcomingScheduleSample: nextEvents
      };

      const prompt = `
        Act as a personal assistant for a photography business. 
        Analyze the following JSON data which contains business statistics and a schedule of upcoming shoots.
        
        Data:
        ${JSON.stringify(summaryData)}

        Please provide a brief, encouraging summary (max 4-5 sentences) that covers:
        1. The financial outlook (specifically the pending amount).
        2. Workload overview (upcoming events).
        3. Any immediate upcoming shoots from the schedule sample.
        
        Use the Indian Rupee symbol (₹) for money.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setSummary(response.text || 'No summary available.');
    } catch (e: any) {
      console.error('Error generating summary:', e);
      // Enhanced error handling
      if (e.toString().includes('400') || e.toString().includes('413') || e.toString().includes('Code 6')) {
          setError('Data too large to process via AI. Please check your manual statistics.');
          setSummary("Stats Summary (Offline Mode):\n" + 
            "The AI service is currently unavailable due to network limits. Please refer to the Dashboard cards for your total pending amounts and upcoming event counts.");
      } else {
          setError('Unable to connect to AI service. Please check your internet connection.');
      }
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
            <div className="text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md mb-4">
              <p className="font-semibold">Connection Issue</p>
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
