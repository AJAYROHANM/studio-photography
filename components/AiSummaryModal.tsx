import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { EventData } from '../types';
import { SparklesIcon, XIcon } from './icons/Icons';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventData;
}

const AiSummaryModal: React.FC<AiSummaryModalProps> = ({ isOpen, onClose, events }) => {
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

      const prompt = `
        You are a helpful assistant for a photographer using a dashboard to manage their photo shoot orders.
        Based on the following event data (in JSON format), provide a concise and friendly summary.
        The data shows events keyed by date (YYYY-MM-DD). Each event has a description ('text'), a venue ('place'), a payment amount ('amount'), and a payment status ('pending' or 'completed').

        Your summary should highlight:
        - The total number of upcoming events.
        - The total amount in pending payments.
        - The busiest day or period based on the schedule.
        - Conclude with a friendly, encouraging remark.

        Format the key points as a bulleted list.

        Event data:
        ${JSON.stringify(events, null, 2)}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setSummary(response.text);
    } catch (e) {
      console.error('Error generating summary:', e);
      setError('Sorry, I was unable to generate a summary at this time. Please check your API key and try again.');
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
        
        <div className="min-h-[150px] max-h-[60vh] overflow-y-auto pr-2">
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
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
        `}</style>
    </div>
  );
};

export default AiSummaryModal;
