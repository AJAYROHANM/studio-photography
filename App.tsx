
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { User } from './types';
import { getUsers, saveUser, deleteUserFromDb } from './services/db';
import { auth } from './lib/firebase';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize users from DB
  useEffect(() => {
    let isMounted = true;
    let authTimeout: ReturnType<typeof setTimeout>;

    const initData = async (firebaseUser: any) => {
        try {
            // Fetch users from Firebase. Firestore persistence handles offline scenarios.
            let fetchedUsers = await getUsers();
            
            // Seed Default Admin if List is empty (First run ever)
            if (fetchedUsers.length === 0) {
                console.log("No users found. Seeding default admin.");
                const adminUser: User = {
                    id: `user-${Date.now()}`,
                    username: 'admin',
                    password: 'Rohan@1721',
                    role: 'admin',
                    name: 'Admin User',
                    phone: '123-456-7890',
                    photo: `https://i.pravatar.cc/150?u=admin`,
                };
                await saveUser(adminUser);
                fetchedUsers = [adminUser];
            } else {
                 // Enforce the new admin password "Rohan@1721" for the default admin account in state
                 const adminIndex = fetchedUsers.findIndex(u => u.username === 'admin');
                 if (adminIndex !== -1) {
                     fetchedUsers[adminIndex].password = 'Rohan@1721';
                 }
            }

            if (isMounted) {
                setUsers(fetchedUsers);

                // Check for a logged in user session (app level session)
                const currentUserId = localStorage.getItem('currentUserId');
                if (currentUserId) {
                    const user = fetchedUsers.find(u => u.id === currentUserId);
                    if (user) {
                        const { password, ...userWithoutPassword } = user;
                        setCurrentUser(userWithoutPassword);
                    }
                }
            }
        } catch (e) {
            console.error("App initialization error:", e);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    // If Auth is available, wait for it.
    if (auth) {
        // Timeout to prevent infinite loading if Auth hangs
        authTimeout = setTimeout(() => {
             if (isLoading && isMounted) {
                 console.warn("Auth timed out, attempting load.");
                 initData(null);
             }
        }, 2500);

        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            clearTimeout(authTimeout);
            initData(user);
        });
        return () => {
            unsubscribe();
            clearTimeout(authTimeout);
            isMounted = false;
        };
    } else {
        // Fallback if Firebase auth completely failed to load
        initData(null);
        return () => { isMounted = false; };
    }
  }, []);

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

  const handleUpdateUser = async (updatedUser: User) => {
    // Optimistic Update
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
        const { password, ...userWithoutPassword } = updatedUser;
        setCurrentUser(userWithoutPassword);
    }
    await saveUser(updatedUser);
  };

  const handleAddUser = async (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
    await saveUser(newUser);
  };
  
  const handleDeleteUser = async (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    await deleteUserFromDb(userId);
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
