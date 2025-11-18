import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { CameraIcon, UserCircleIcon, UsersIcon, ChevronDownIcon, SearchIcon, XIcon } from './icons/Icons';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'profile' | 'user_management') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, searchQuery, onSearchChange }) => {
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
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <CameraIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 hidden sm:block">PhotoManager</h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md py-2 pl-10 pr-10 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                aria-label="Search events"
            />
            {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button onClick={() => onSearchChange('')} className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none" aria-label="Clear search">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
      
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-gray-800 transition-colors"
          >
            <img src={currentUser.photo} alt="User" className="w-9 h-9 rounded-full object-cover" />
            <span className="hidden lg:inline font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform hidden lg:inline ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform origin-top-right animate-fade-in-up">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{currentUser.username}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserCircleIcon className="w-5 h-5 mr-3 text-gray-500" />
                  My Profile
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => { onNavigate('user_management'); setIsDropdownOpen(false); }}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <UsersIcon className="w-5 h-5 mr-3 text-gray-500" />
                    User Management
                  </button>
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.1s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Header;