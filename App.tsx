import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { User } from './types';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize users and check for logged in session
  useEffect(() => {
    let storedUsers: User[] = [];
    try {
      const usersJson = localStorage.getItem('appUsers');
      storedUsers = usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      console.error("Failed to parse users from localStorage", e);
      storedUsers = [];
    }

    if (storedUsers.length === 0) {
      // Create a default admin user if no users exist
      const adminUser: User = {
        id: `user-${Date.now()}`,
        username: 'admin',
        password: 'password',
        role: 'admin',
        name: 'Admin User',
        phone: '123-456-7890',
        photo: `https://i.pravatar.cc/150?u=admin`,
      };
      storedUsers.push(adminUser);
    }
    setUsers(storedUsers);

    // Check for a logged in user session
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const user = storedUsers.find(u => u.id === currentUserId);
      if (user) {
        // Omitting password from the state for security
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Persist users to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('appUsers', JSON.stringify(users));
    }
  }, [users, isLoading]);

  const handleLogin = (username: string, passwordAttempt: string): boolean => {
    const user = users.find(u => u.username === username && u.password === passwordAttempt);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('currentUserId', user.id);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  };

  const handleUpdateUser = (updatedUser: User) => {
    let userWithPassword = { ...updatedUser };
    const existingUser = users.find(u => u.id === updatedUser.id);

    if (updatedUser.password) {
        // new password provided
    } else if (existingUser) {
        // keep old password if not changed
        userWithPassword.password = existingUser.password;
    }

    let updatedUsersList: User[] = [];
    setUsers(prevUsers => {
      updatedUsersList = prevUsers.map(u => u.id === userWithPassword.id ? userWithPassword : u);
      return updatedUsersList;
    });

    if (currentUser && currentUser.id === userWithPassword.id) {
        const { password, ...userWithoutPassword } = userWithPassword;
        setCurrentUser(userWithoutPassword);
    }
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {currentUser ? (
        <DashboardPage
          currentUser={currentUser}
          users={users.map(({password, ...rest}) => rest)}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
