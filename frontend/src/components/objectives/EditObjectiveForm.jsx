// frontend/src/components/objectives/EditObjectiveForm.jsx
// Simplified version focusing only on objective details
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditObjectiveForm = ({ isOpen, onClose, objectiveId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    department: '',
    team: '',
    owner: '',
    timeframe: {
      quarter: 1,
      year: 2024
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [keyResults, setKeyResults] = useState([]);
  const emptyKeyResult = {
    title: '',
    description: '',
    metricType: 'number',
    startValue: 0,
    targetValue: 0,
    currentValue: 0,
    unit: '',
    confidenceLevel: 'medium'
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!objectiveId) return;
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const [objResponse, deptsResponse, teamsResponse, usersResponse] = await Promise.all([
          axios.get(`http://localhost:4000/api/objectives/${objectiveId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/departments', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/teams', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:4000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
  
        const { objective, keyResults: krs } = objResponse.data;
        const owner = usersResponse.data.find(user => user._id === objective.owner._id);
        const ownerTeam = owner ? owner.team : null;
  
        setFormData({
          title: objective.title,
          description: objective.description || '',
          type: objective.type || '',
          department: objective.department || '',
          team: ownerTeam?._id || objective.team?._id || '',
          owner: objective.owner?._id || '',
          timeframe: objective.timeframe
        });
  
        setKeyResults(krs);
        setDepartments(deptsResponse.data);
        setTeams(teamsResponse.data);
        setUsers(usersResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
  
    if (isOpen && objectiveId) {
      fetchData();
    }
  }, [isOpen, objectiveId]);

    // Add the renderContextSelector function
  const renderContextSelector = () => {
    switch(formData.type) {
      case 'department':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      
      case 'team':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    department: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Team
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      
      case 'individual':
          console.log('Individual Selector State:', {
            formDataDepartment: formData.department,
            formDataTeam: formData.team,
            formDataOwner: formData.owner,
            availableTeams: teams,
            filteredTeams: teams.filter(team => team.department._id === formData.department)
          });
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      department: e.target.value,
                      team: '',  // Reset team when department changes
                      owner: ''  // Reset owner when department changes
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              
              {formData.department && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team
                    <select
                      value={formData.team}
                      onChange={(e) => {
                        console.log('Team selection changed:', e.target.value);
                        setFormData({ 
                          ...formData, 
                          team: e.target.value,
                          owner: ''
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Team</option>
                      {teams
                        .filter(team => {
                          console.log('Filtering team:', {
                            teamId: team._id,
                            teamDepartment: team.department._id,
                            formDataDepartment: formData.department,
                            matches: team.department._id === formData.department
                          });
                          return team.department._id === formData.department;
                        })
                        .map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              )}
        
              {formData.team && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Owner
                    <select
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select User</option>
                      {users
                        .filter(user => user.team?._id === formData.team)
                        .map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          );      
      default:
        return null;
    }
  };

  const handleAddKeyResult = () => {
    setKeyResults([...keyResults, { ...emptyKeyResult }]);
  };

  const handleKeyResultChange = (index, field, value) => {
    console.log('Updating key result:', { index, field, value }); // Debug log
    const updatedKeyResults = [...keyResults];
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: field === 'currentValue' ? Number(value) : value // Ensure currentValue is a number
    };
    setKeyResults(updatedKeyResults);
  };

  const handleDeleteKeyResult = async (keyResultId) => {
    if (!window.confirm('Are you sure you want to delete this key result?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/key-results/${keyResultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state to remove the deleted key result
      setKeyResults(keyResults.filter(kr => kr._id !== keyResultId));
    } catch (error) {
      console.error('Error deleting key result:', error);
      setError('Failed to delete key result');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      
      // Update objective
      const cleanedFormData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        owner: formData.owner,
        timeframe: formData.timeframe,
        ...(formData.department && { department: formData.department }),
        ...(formData.team && { team: formData.team })
      };
  
      await axios.put(
        `http://localhost:4000/api/objectives/${objectiveId}`,
        cleanedFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      // Handle key results
      const keyResultPromises = keyResults.map(kr => {
        // Calculate progress
        const progress = (() => {
          if (kr.currentValue >= kr.targetValue) return 100;
          if (kr.currentValue <= kr.startValue) return 0;
          const total = kr.targetValue - kr.startValue;
          const current = kr.currentValue - kr.startValue;
          return Math.round((current / total) * 100);
        })();
  
        // Calculate status
        const status = (() => {
          if (progress >= 100) return 'completed';
          if (kr.confidenceLevel === 'high' && progress >= 60) return 'on_track';
          if (kr.confidenceLevel === 'medium' || progress >= 40) return 'at_risk';
          return 'behind';
        })();
  
        const payload = {
          ...kr,
          progress,
          status
        };
  
        if (kr._id) {
          // Update existing key result
          return axios.put(
            `http://localhost:4000/api/key-results/${kr._id}`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } else {
          // Create new key result
          return axios.post(
            'http://localhost:4000/api/key-results',
            { ...payload, objective: objectiveId },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        }
      });
  
      await Promise.all(keyResultPromises);
      onClose(true);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update objective and key results');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-8 max-w-2xl bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Objective</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-8">{error}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Objective Section */}
          <div className="space-y-4 border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium">Objective Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows="3"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="department">Department</option>
                    <option value="organization">Organization</option>
                  </select>
                </label>
              </div>

              <div>
                {renderContextSelector()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quarter
                  <select
                    value={formData.timeframe.quarter}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeframe: { ...formData.timeframe, quarter: Number(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4].map((q) => (
                      <option key={q} value={q}>Q{q}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year
                  <select
                    value={formData.timeframe.year}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeframe: { ...formData.timeframe, year: Number(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Key Results</h3>
            {keyResults.map((kr, index) => (
              <div key={kr._id || index} className="p-4 border rounded-md space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-md font-medium">Key Result #{index + 1}</h4>
                  {kr._id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteKeyResult(kr._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Key Result Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                      <input
                        type="text"
                        required
                        value={kr.title}
                        onChange={(e) => handleKeyResultChange(index, 'title', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                      <textarea
                        value={kr.description}
                        onChange={(e) => handleKeyResultChange(index, 'description', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows="2"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Metric Type
                        <select
                          value={kr.metricType}
                          onChange={(e) => handleKeyResultChange(index, 'metricType', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="number">Number</option>
                          <option value="percentage">Percentage</option>
                          <option value="currency">Currency</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit
                        <input
                          type="text"
                          value={kr.unit}
                          onChange={(e) => handleKeyResultChange(index, 'unit', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., users, $, %"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Value
                        <input
                          type="number"
                          required
                          value={kr.startValue}
                          onChange={(e) => handleKeyResultChange(index, 'startValue', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Current Value
                        <input
                          type="number"
                          required
                          value={kr.currentValue}
                          onChange={(e) => handleKeyResultChange(index, 'currentValue', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Target Value
                        <input
                          type="number"
                          required
                          value={kr.targetValue}
                          onChange={(e) => handleKeyResultChange(index, 'targetValue', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confidence Level
                      <select
                        value={kr.confidenceLevel}
                        onChange={(e) => handleKeyResultChange(index, 'confidenceLevel', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleAddKeyResult}
                className="inline-flex items-center px-4 py-2 border border-indigo-500 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Key Result
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200"> {/* Changed justify-end to justify-between */}
            {/* Add delete button on the left */}
            <div>
              {currentUser?.isAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this objective? This will also delete all associated key results.')) {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.delete(`http://localhost:4000/api/objectives/${objectiveId}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        onClose(true);
                      } catch (err) {
                        console.error('Delete error:', err);
                        setError('Failed to delete objective');
                      }
                    }
                  }}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Objective
                </button>
              )}
            </div>

            {/* Cancel and Save buttons on the right */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  </div>
);
};

export default EditObjectiveForm;