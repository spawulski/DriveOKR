// frontend/src/components/Navigation/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Building, Users, User } from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ isOpen, setSelectedView }) => {
  const [expandedItems, setExpandedItems] = useState({
    departments: false,
    teams: {},
  });
  const [orgStructure, setOrgStructure] = useState({
    name: "Loading...",
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrgStructure = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch departments, teams, and users in parallel
        const [departmentsRes, teamsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:4000/api/departments', { headers }),
          axios.get('http://localhost:4000/api/teams', { headers }),
          axios.get('http://localhost:4000/api/users', { headers })
        ]);

        // Build organization structure
        const structure = {
          name: "Organization", // Or fetch from config/settings
          departments: departmentsRes.data.map(dept => ({
            _id: dept._id,
            name: dept.name,
            manager: usersRes.data.find(user => user._id === dept.manager?._id),
            teams: teamsRes.data
              .filter(team => team.department._id === dept._id)
              .map(team => ({
                _id: team._id,
                name: team.name,
                teamLead: usersRes.data.find(user => user._id === team.teamLead?._id),
                members: team.members.map(memberId => 
                  usersRes.data.find(user => user._id === memberId._id)
                ).filter(Boolean)
              }))
          }))
        };

        setOrgStructure(structure);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching organization structure:', error);
        setError('Failed to load organization structure');
        setLoading(false);
      }
    };

    fetchOrgStructure();
  }, []);

  const toggleDepartments = () => {
    setExpandedItems(prev => ({
      ...prev,
      departments: !prev.departments
    }));
  };

  const toggleTeam = (deptIndex, teamIndex) => {
    console.log('Toggling team:', deptIndex, teamIndex); // Add logging
    setExpandedItems(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [`${deptIndex}-${teamIndex}`]: !prev.teams[`${deptIndex}-${teamIndex}`]
      }
    }));
  };

  if (loading) {
    return (
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto p-4">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="h-full overflow-y-auto">
        <div className="p-4">
          <h2 className="pt-12 text-lg font-semibold mb-4 ">DriveOKR</h2>
          
          {/* Organization Level */}
          <div className="mb-2">
            <button
              onClick={() => setSelectedView({ type: 'organization' })}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
            >
              <Building className="mr-3 h-5 w-5" />
              {orgStructure.name}
            </button>
          </div>

          {/* Departments */}
          <div className="ml-2">
            <button
              onClick={toggleDepartments}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
            >
              {expandedItems.departments ? 
                <ChevronDown className="mr-1 h-4 w-4" /> : 
                <ChevronRight className="mr-1 h-4 w-4" />
              }
              Departments
            </button>

            {expandedItems.departments && (
              <div className="ml-4">
                {orgStructure.departments.map((dept, deptIndex) => (
                  <div key={dept._id}>
                    <button
                      onClick={() => setSelectedView({ 
                        type: 'department', 
                        id: dept._id,
                        name: dept.name,
                        manager: dept.manager?.name // Add manager name
                      })}
                      className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                    >
                      <Users className="mr-3 h-4 w-4" />
                      {dept.name}
                    </button>

                    {/* Teams */}
                    <div className="ml-4">
                    {dept.teams.map((team, teamIndex) => (
                        <div key={team._id}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Add this to prevent event bubbling
                              toggleTeam(deptIndex, teamIndex);
                              setSelectedView({ 
                                type: 'team', 
                                id: team._id,
                                name: team.name,
                                lead: team.teamLead?.name // Add team lead name
                              });
                            }}
                            className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                          >
                            {expandedItems.teams[`${deptIndex}-${teamIndex}`] ?
                              <ChevronDown className="mr-1 h-4 w-4" /> :
                              <ChevronRight className="mr-1 h-4 w-4" />
                            }
                            {team.name}
                            {/* {team.teamLead && (
                              <span className="ml-2 text-xs text-gray-400">
                                ({team.teamLead.name})
                              </span>
                            )} */}
                          </button>

                          {/* Team Members */}
                          {expandedItems.teams[`${deptIndex}-${teamIndex}`] && (
                            <div className="ml-4">
                              {team.members.map(member => (
                                <button
                                  key={member._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedView({ 
                                      type: 'individual',
                                      member: member._id,
                                      name: member.name,
                                      department: dept._id,
                                      team: team._id
                                    });
                                  }}
                                  className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                                >
                                  <User className="mr-3 h-4 w-4" />
                                  {member.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;