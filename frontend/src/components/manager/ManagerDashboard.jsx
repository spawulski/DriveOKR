// frontend/src/components/manager/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamOKRs, setTeamOKRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch team data if user is a team lead
      if (user.role === 'team_lead') {
        const teamResponse = await axios.get(`http://localhost:4000/api/teams/lead/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeam(teamResponse.data);
        setTeamMembers(teamResponse.data.members);
      }
      // Fetch department data if user is a manager
      else if (user.role === 'manager') {
        const deptResponse = await axios.get(`http://localhost:4000/api/departments/manager/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeamMembers(deptResponse.data.members);
      }

      // Fetch OKRs
      const okrsResponse = await axios.get(`http://localhost:4000/api/objectives/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamOKRs(okrsResponse.data);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {user.role === 'team_lead' ? `${team?.name} Dashboard` : 'Department Dashboard'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your {user.role === 'team_lead' ? 'team' : 'department'} OKRs and track progress
        </p>
      </div>

      {/* Team Members Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {user.role === 'team_lead' ? 'Team Members' : 'Department Members'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member._id} className="border rounded-lg p-4">
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team OKRs Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Team OKRs</h2>
            <button
              onClick={() => {/* Add handler for creating team OKR */}}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Team OKR
            </button>
          </div>
          
          <div className="space-y-4">
            {teamOKRs.map((okr) => (
              <div key={okr._id} className="border rounded-lg p-4">
                <h3 className="font-medium">{okr.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{okr.description}</p>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-indigo-600 rounded-full"
                          style={{ width: `${okr.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {okr.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;