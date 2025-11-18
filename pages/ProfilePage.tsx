import React, { useState } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, PencilIcon, UserCircleIcon, PhoneIcon } from '../components/icons/Icons';
import UserModal from '../components/UserModal';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, onBack }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="animate-fade-in">
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
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

      <UserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onUpdateUser}
        userToEdit={user}
        isAdmin={false}
      />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;