// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditObjectiveForm from '../objectives/EditObjectiveForm';
import Header from '../Navigation/Header';
import CreateObjectiveForm from '../objectives/CreateObjectiveForm';
import ProgressChart from '../charts/ProgressChart';
import Sidebar from '../Navigation/Sidebar';
import Collapse from '../common/Collapse';

const Dashboard = () => {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const currentMonth = new Date().getMonth();
    return Math.floor(currentMonth / 3) + 1;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedView, setSelectedView] = useState({ type: 'organization' });
  const [expandedCards, setExpandedCards] = useState({});

  const fetchObjectives = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:4000/api/objectives?quarter=${selectedQuarter}&year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setObjectives(response.data);
    } catch (err) {
      setError('Failed to fetch objectives');
      console.error('Error fetching objectives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
  
    fetchCurrentUser();
  }, [selectedQuarter, selectedYear]);

  const handleEditClick = (objectiveId) => {
    setSelectedObjectiveId(objectiveId);
    setIsEditModalOpen(true);
  };

  const handleEditComplete = async (updated = false) => {
    if (updated) {
      await fetchObjectives(); // Wait for the fetch to complete
    }
    setIsEditModalOpen(false);
    setSelectedObjectiveId(null);
  };

  const handleDeleteClick = async (objectiveId) => {
    if (!window.confirm('Are you sure you want to delete this OKR?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/objectives/${objectiveId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchObjectives(); // Refresh the list
    } catch (error) {
      console.error('Error deleting OKR:', error);
    }
  };

  const handleCreateComplete = async (created = false) => {
    if (created) {
      await fetchObjectives(); // Wait for the fetch to complete
    }
    setIsCreateModalOpen(false);
  };

  const toggleCard = (objectiveId) => {
    setExpandedCards(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
    {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

    {/* Sidebar */}
    <Sidebar 
      isOpen={isSidebarOpen}
      setSelectedView={setSelectedView}
    />

    {/* Main Content */}
    <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
      <div className="p-8">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">OKR Dashboard</h1>
              <div className="flex space-x-4">
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4].map((quarter) => (
                    <option key={quarter} value={quarter}>Q{quarter}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Objective
                </button>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
              {objectives.map((objective) => (
                <li key={objective._id} className="px-6 py-4 hover:bg-gray-50">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleCard(objective._id)}
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        {objective.title}
                        <svg 
                          className={`ml-2 h-5 w-5 transform transition-transform ${expandedCards[objective._id] ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {objective.description}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          objective.type === 'individual' ? 'bg-blue-100 text-blue-800' :
                          objective.type === 'department' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {objective.type}
                        </span>
                        <span className="ml-2">
                          Progress: {objective.progress}%
                        </span>
                      </div>

                      {/* Key Results Section */}
                      {objective.keyResults && objective.keyResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {objective.keyResults.map((kr) => {
                            
                            // Calculate progress here as backup
                            const progress = kr.progress || (() => {
                              if (kr.currentValue >= kr.targetValue) return 100;
                              if (kr.currentValue <= kr.startValue) return 0;
                              const total = kr.targetValue - kr.startValue;
                              const current = kr.currentValue - kr.startValue;
                              return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
                            })()
                            
                            console.log('Rendering key result:', {
                              title: kr.title,
                              status: kr.status,
                              progress: kr.progress,
                              confidenceLevel: kr.confidenceLevel,
                              currentValue: kr.currentValue,
                              targetValue: kr.targetValue,
                              startValue: kr.startValue
                            });

                            return (
                              <div key={kr._id} className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{kr.title}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        kr.confidenceLevel === 'high' ? 'bg-green-100 text-green-800' :
                                        kr.confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {kr.confidenceLevel}
                                      </span>
                                      <span className="text-gray-500 min-w-[8rem] text-right">
                                        {kr.currentValue} / {kr.targetValue} {kr.unit}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          progress >= 75 ? 'bg-green-500' :
                                          progress >= 50 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                                      {progress}%
                                    </span>
                                  </div>
                                  <span className="text-xs">Status:</span>
                                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    kr.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    kr.status === 'on_track' ? 'bg-blue-100 text-blue-800' :
                                    kr.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                                    kr.status === 'behind' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {kr.status === 'completed' ? 'Completed' :
                                    kr.status === 'on_track' ? 'On Track' :
                                    kr.status === 'at_risk' ? 'At Risk' :
                                    kr.status === 'behind' ? 'Behind' :
                                    'Unknown'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>                
                    <div className="p-4 flex flex-col items-center space-y-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Stop the click from reaching the parent
                          handleEditClick(objective._id);
                        }}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      {currentUser?.isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Stop the click from reaching the parent
                            handleDeleteClick(objective._id);
                          }}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    </div>
                    {/* Expanded content */}
                    {expandedCards[objective._id] && (
                      <Collapse isOpen={expandedCards[objective._id]}>
                        <div className="mt-4 space-y-4 pl-4">
                          {objective.keyResults.map((kr) => (
                            <div key={kr._id} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2">{kr.title}</h4>
                              <div className="text-sm text-gray-500 mb-4">
                                Current: {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </div>
                              <ProgressChart keyResult={kr} />
                            </div>
                          ))}
                        </div>
                      </Collapse>
                    )}
                  </div>
                </li>
              ))}
              </ul>
            </div>

            {error && (
              <div className="mt-4 text-red-600">
                {error}
              </div>
            )}
          </div>

          <CreateObjectiveForm
            isOpen={isCreateModalOpen}
            onClose={handleCreateComplete}
            // onClose={(created) => {
            //   if (created) {
            //     fetchObjectives();
            //   }
            //   setIsCreateModalOpen(false);
            // }}
          />

          <EditObjectiveForm
            isOpen={isEditModalOpen}
            onClose={handleEditComplete}
            objectiveId={selectedObjectiveId}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;