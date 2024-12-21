// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditObjectiveForm from '../objectives/EditObjectiveForm';
import CreateObjectiveForm from '../objectives/CreateObjectiveForm';

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

  const handleCreateComplete = async (created = false) => {
    if (created) {
      await fetchObjectives(); // Wait for the fetch to complete
    }
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
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
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {objective.title}
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
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${objective.progress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleEditClick(objective._id)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
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
      />

      <EditObjectiveForm
        isOpen={isEditModalOpen}
        onClose={handleEditComplete}
        objectiveId={selectedObjectiveId}
      />
    </div>
  );
};

export default Dashboard;