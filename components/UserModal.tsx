import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  userToEdit?: User | null;
  isAdmin: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userToEdit, isAdmin }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFormData({ ...userToEdit, password: '' }); // Don't show password
      setIsNewUser(false);
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        phone: '',
        photo: '',
        role: 'user',
      });
      setIsNewUser(true);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const finalData: User = {
        id: isNewUser ? `user-${Date.now()}` : userToEdit!.id,
        username: formData.username || '',
        name: formData.name || '',
        phone: formData.phone || '',
        photo: formData.photo || `https://i.pravatar.cc/150?u=${formData.username}`,
        role: formData.role || 'user',
        password: formData.password || (isNewUser ? 'password' : undefined) // Default password for new users
    };
    onSave(finalData);
    onClose();
  };
  
  const isSaveDisabled = !formData.username || !formData.name || (isNewUser && !formData.password);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {isNewUser ? 'Add New User' : 'Edit User'}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" placeholder="Full Name" value={formData.name || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            <input type="text" name="username" placeholder="Username" value={formData.username || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          </div>
          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          <input type="text" name="photo" placeholder="Photo URL" value={formData.photo || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          <input type="password" name="password" placeholder={isNewUser ? "Password" : "New Password (optional)"} value={formData.password || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          {isAdmin && (
            <select name="role" value={formData.role || 'user'} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={isSaveDisabled} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
        </div>
      </div>
      <style>{`
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default UserModal;
