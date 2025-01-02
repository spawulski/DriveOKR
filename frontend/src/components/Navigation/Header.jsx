// frontend/src/components/Navigation/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  console.log('Header - Current user:', user);  // Add this
  console.log('Is admin?', user?.isAdmin);      // Add this

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                OKR Platform
              </Link>
            </div>
            {/* In Header.jsx, update the navigation section */}
            <nav className="ml-6 flex space-x-8">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700"
              >
                OKRs
              </Link>
              
              {user?.isAdmin && (
                <Link 
                  to="/admin" 
                  className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700"
                >
                  Admin Dashboard
                </Link>
              )}
              
              {(user?.role === 'manager' || user?.role === 'team_lead') && (
                <Link 
                  to="/manager" 
                  className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700"
                >
                  Team Management
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">{user?.name}</span>
            <button 
              onClick={() => {/* Add logout handler */}} 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;