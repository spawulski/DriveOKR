// frontend/src/components/Navigation/Sidebar.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building, Users, User } from 'lucide-react';

const Sidebar = ({ isOpen, setSelectedView }) => {
  const [expandedItems, setExpandedItems] = useState({
    departments: false,
    teams: {},
  });

  // Example organization structure - this would come from your API
  const orgStructure = {
    name: "Your Company",
    departments: [
      {
        name: "Engineering",
        teams: [
          {
            name: "Frontend",
            members: ["John Doe", "Jane Smith"]
          },
          {
            name: "Backend",
            members: ["Alice Johnson", "Bob Wilson"]
          }
        ]
      },
      {
        name: "Sales",
        teams: [
          {
            name: "Direct Sales",
            members: ["Mike Brown", "Sarah Davis"]
          }
        ]
      }
    ]
  };

  const toggleDepartments = () => {
    setExpandedItems(prev => ({
      ...prev,
      departments: !prev.departments
    }));
  };

  const toggleTeam = (deptIndex, teamIndex) => {
    setExpandedItems(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [`${deptIndex}-${teamIndex}`]: !prev.teams[`${deptIndex}-${teamIndex}`]
      }
    }));
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="h-full overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Organization</h2>
          
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
                  <div key={dept.name}>
                    <button
                      onClick={() => setSelectedView({ type: 'department', id: dept.name })}
                      className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                    >
                      <Users className="mr-3 h-4 w-4" />
                      {dept.name}
                    </button>

                    {/* Teams */}
                    <div className="ml-4">
                      {dept.teams.map((team, teamIndex) => (
                        <div key={team.name}>
                          <button
                            onClick={() => toggleTeam(deptIndex, teamIndex)}
                            className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                          >
                            {expandedItems.teams[`${deptIndex}-${teamIndex}`] ?
                              <ChevronDown className="mr-1 h-4 w-4" /> :
                              <ChevronRight className="mr-1 h-4 w-4" />
                            }
                            {team.name}
                          </button>

                          {/* Team Members */}
                          {expandedItems.teams[`${deptIndex}-${teamIndex}`] && (
                            <div className="ml-4">
                              {team.members.map(member => (
                                <button
                                  key={member}
                                  onClick={() => setSelectedView({ 
                                    type: 'individual',
                                    department: dept.name,
                                    team: team.name,
                                    member: member
                                  })}
                                  className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100"
                                >
                                  <User className="mr-3 h-4 w-4" />
                                  {member}
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