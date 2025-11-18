import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, passwordAttempt: string) => boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '' || password.trim() === '') {
      setError('Please enter both username and password.');
      return;
    }
    
    const success = onLogin(username, password);
    if (!success) {
      setError('Invalid username or password.');
    } else {
      setError('');
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2&random=1')" }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 space-y-8 bg-white/10 backdrop-blur-md rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-white">
            PhotoManager
          </h2>
          <p className="mt-2 text-gray-300">Log in to your dashboard</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-500 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary focus:z-10 sm:text-sm rounded-t-md"
                placeholder="Username (default: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-500 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary focus:z-10 sm:text-sm rounded-b-md"
                placeholder="Password (default: password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition duration-300"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
