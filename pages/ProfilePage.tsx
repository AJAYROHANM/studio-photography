
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, PencilIcon, UserCircleIcon, PhoneIcon, DownloadIcon, UploadIcon, CheckCircleIcon, XIcon } from '../components/icons/Icons';
import { getFullBackup, restoreBackup } from '../services/db';

interface ProfilePageProps {
  user: User;
  onEditProfile: (user: User) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onEditProfile, onBack }) => {
  // Restore State
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStatus, setRestoreStatus] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleBackup = async () => {
    try {
      // Fetch full data from Firestore
      const data = await getFullBackup();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eventify_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      localStorage.setItem('lastBackupDate', new Date().toISOString().split('T')[0]);
      
    } catch (e) {
      console.error("Backup failed", e);
      alert("Failed to fetch data from database for backup.");
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreProgress(0);
    setRestoreStatus('Initializing...');
    setRestoreError(null);
    setRestoreSuccess(false);

    try {
      setRestoreStatus('Reading backup file...');
      setRestoreProgress(10);
      await wait(500);

      const content = await readFileAsText(file);
      setRestoreProgress(30);

      setRestoreStatus('Verifying data structure...');
      await wait(500);
      
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        throw new Error("Invalid JSON file. Please upload a valid backup.");
      }
      setRestoreProgress(50);

      setRestoreStatus('Restoring to database (this may take a moment)...');
      
      // Perform Cloud Restore
      await restoreBackup(data);
      
      setRestoreProgress(100);
      setRestoreStatus('Restore Completed Successfully!');
      setRestoreSuccess(true);

      // Use window.location.href to force a complete reload from the server/root
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 1500);

    } catch (error: any) {
      console.error('Error restoring data:', error);
      setRestoreError(error.message || "An unexpected error occurred.");
      setIsRestoring(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const closeRestoreModal = () => {
    if (!isRestoring || restoreError) {
      setIsRestoring(false);
      setRestoreError(null);
      setRestoreSuccess(false);
      setRestoreProgress(0);
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* Restore Progress Modal */}
      {(isRestoring || restoreError || restoreSuccess) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 text-center animate-scale-in">
            
            {restoreError ? (
               <div className="flex flex-col items-center">
                 <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <XIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Restore Failed</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">{restoreError}</p>
                 <button 
                   onClick={closeRestoreModal}
                   className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                 >
                   Close
                 </button>
               </div>
            ) : restoreSuccess ? (
              <div className="flex flex-col items-center">
                 <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircleIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Success!</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-2">Data restored successfully.</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Reloading application...</p>
                 <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                    <div className="bg-green-600 h-2.5 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
                 </div>
                 {/* Fail-safe manual reload button */}
                 <button 
                   onClick={() => window.location.href = window.location.origin}
                   className="mt-2 px-4 py-2 bg-brand-primary text-white text-sm rounded-md hover:bg-brand-secondary transition-colors"
                 >
                   Reload Now
                 </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Restoring Data</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-2 relative overflow-hidden">
                   <div 
                      className="bg-brand-primary h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center text-[10px] text-white font-bold" 
                      style={{ width: `${restoreProgress}%` }}
                   >
                      {restoreProgress > 10 && `${restoreProgress}%`}
                   </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-2 animate-pulse">{restoreStatus}</p>
                <p className="text-xs text-gray-400 mt-4">Please do not close this window.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Back to dashboard"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">My Profile</h2>
      </header>
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-8">
          <img
            src={user.photo}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover ring-4 ring-brand-primary/50"
          />
          <div className="text-center sm:text-left mt-4 sm:mt-0">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <UserCircleIcon className="w-6 h-6 mr-4 text-gray-400 dark:text-gray-500" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <PhoneIcon className="w-6 h-6 mr-4 text-gray-400 dark:text-gray-500" />
            <span>{user.phone}</span>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onEditProfile(user)}
            className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>

        {/* Data Management Section for Admins */}
        {user.role === 'admin' && (
          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
             <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Data Management (Admin)</h4>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
               Download a backup of all system data (users and events) from Firestore or restore from a previous backup file.
             </p>
             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleBackup}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                   <DownloadIcon className="w-5 h-5 mr-2" /> 
                   Backup from Database
                </button>
                <label 
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-secondary cursor-pointer transition-colors shadow-sm active:scale-95"
                >
                   <UploadIcon className="w-5 h-5 mr-2" /> 
                   Restore to Database
                   <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".json" 
                      onChange={handleRestore}
                    />
                </label>
             </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
