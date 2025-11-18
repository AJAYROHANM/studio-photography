import React, { useState } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';
import UserModal from '../components/UserModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface UserManagementPageProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onBack: () => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, onBack }) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const handleAddClick = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };
  
  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button 
              onClick={onBack} 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2 sm:mr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Back to dashboard"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">User Management</h2>
        </div>
        <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors text-sm"
          >
            Add User
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">Role</th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">Contact</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <img className="w-10 h-10 rounded-full mr-4 object-cover" src={user.photo} alt={user.name} />
                      <div>
                        <div>{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{user.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleEditClick(user)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteClick(user)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={userToEdit ? onUpdateUser : onAddUser}
        userToEdit={userToEdit}
        isAdmin={true}
      />
      
      <ConfirmationModal
        isOpen={!!userToDelete}
        title="Delete User?"
        message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
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

export default UserManagementPage;
