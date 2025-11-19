
import React, { useState } from 'react';
import { DownloadIcon, XIcon, ClockIcon, CheckCircleIcon } from './icons/Icons';
import { getFullBackup } from '../services/db';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackupReminderModal: React.FC<BackupReminderModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('backupEmail') || '');
  const [step, setStep] = useState<'prompt' | 'downloaded'>('prompt');

  if (!isOpen) return null;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    localStorage.setItem('backupEmail', e.target.value);
  };

  const handleDownloadBackup = async () => {
    try {
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

      // Mark backup as done for today
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastBackupDate', todayStr);
      
      setStep('downloaded');
    } catch (e) {
      console.error("Backup failed", e);
      alert("Failed to generate backup file from database.");
    }
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent(`Daily Backup: ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent("Please find the attached backup file for today.");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-brand-primary p-4 rounded-t-lg flex items-center justify-between">
             <div className="flex items-center text-white">
                <ClockIcon className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-bold">Daily Backup Reminder</h3>
             </div>
             <button onClick={onClose} className="text-white/80 hover:text-white">
                <XIcon className="w-5 h-5" />
             </button>
        </div>

        <div className="p-6">
            {step === 'prompt' ? (
                <>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        It is past 12:00 PM and you haven't backed up your data today. 
                        Regular backups prevent data loss.
                    </p>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                            Target Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="Enter your email..."
                            value={email}
                            onChange={handleEmailChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleDownloadBackup}
                        className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg transition-colors shadow-md"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download Backup File (DB)
                    </button>
                    
                    <p className="text-xs text-center text-gray-400 mt-3">
                        Note: Automatic emailing is not supported. You must manually attach the downloaded file.
                    </p>
                </>
            ) : (
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">File Downloaded!</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                        The backup file has been saved to your device. Click below to open your email client.
                    </p>
                    
                    {email && (
                        <button 
                            onClick={handleOpenEmail}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md mb-3"
                        >
                            Open Email Draft
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                        Close
                    </button>
                </div>
            )}
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

export default BackupReminderModal;
