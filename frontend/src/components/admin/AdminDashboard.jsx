// frontend/src/components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import DepartmentManager from './DepartmentManager';
import TeamManager from './TeamManager';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('departments')}
                className={`${
                  activeTab === 'departments'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium`}
              >
                Departments
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`${
                  activeTab === 'teams'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium`}
              >
                Teams
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'departments' ? <DepartmentManager /> : <TeamManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;