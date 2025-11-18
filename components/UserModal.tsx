import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CameraIcon, PencilIcon } from './icons/Icons';

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
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, photo: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const finalData: User = {
        id: isNewUser ? `user-${Date.now()}` : userToEdit!.id,
        username: formData.username?.trim() || '',
        name: formData.name?.trim() || '',
        phone: formData.phone?.trim() || '',
        photo: formData.photo || `https://i.pravatar.cc/150?u=${formData.username?.trim()}`,
        role: formData.role || 'user',
        password: formData.password || (isNewUser ? 'password' : undefined)
    };
    onSave(finalData);
    onClose();
  };
  
  const isSaveDisabled = !formData.name?.trim() || !formData.username?.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          {isNewUser ? 'Add New User' : 'Edit User'}
        </h2>
        <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
                <label htmlFor="photo-upload" className="cursor-pointer group relative">
                    {formData.photo ? (
                        <img src={formData.photo} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-600 group-hover:ring-brand-primary transition-all" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-gray-300 dark:ring-gray-600 group-hover:ring-brand-primary transition-all">
                            <CameraIcon className="w-10 h-10 text-gray-500" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-colors">
                        <PencilIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </label>
                <input
                    id="photo-upload"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handlePhotoChange}
                    className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Click image to change</p>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" placeholder="Full Name" value={formData.name || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
            <input type="text" name="username" placeholder="Username" value={formData.username || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          </div>
          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
          <input type="password" name="password" placeholder={isNewUser ? "Password (defaults if empty)" : "New Password (optional)"} value={formData.password || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
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