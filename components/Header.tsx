import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { CameraIcon, UserCircleIcon, UsersIcon, ChevronDownIcon } from './icons/Icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'profile' | 'user_management') => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center flex-shrink-0">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <CameraIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">PhotoManager</h1>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800"
        >
          <img src={currentUser.photo} alt="User" className="w-8 h-8 rounded-full object-cover" />
          <span className="hidden sm:inline font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
            <button
              onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <UserCircleIcon className="w-5 h-5 mr-3" />
              My Profile
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => { onNavigate('user_management'); setIsDropdownOpen(false); }}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <UsersIcon className="w-5 h-5 mr-3" />
                User Management
              </button>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
