// frontend/src/components/admin/UserManagementTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/Alert-Dialog';

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

// frontend/src/components/admin/UserManagementTab.jsx
const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const [usersResponse, teamsResponse] = await Promise.all([
      axios.get('http://localhost:4000/api/users', { headers }),
      axios.get('http://localhost:4000/api/teams', { headers })
    ]);

    console.log('Fetched users:', usersResponse.data); // Add logging
    console.log('Fetched teams:', teamsResponse.data); // Add logging

    setUsers(usersResponse.data);
    setTeams(teamsResponse.data);
  } catch (error) {
    setError('Failed to fetch data');
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(user => user._id !== userId));
      setDeleteDialogOpen(false);
    } catch (error) {
      setError('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const handleTeamChange = async (userId, teamId) => {
    try {
      console.log('Updating user:', userId, 'with team:', teamId); // Add logging
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:4000/api/users/${userId}`,
        { team: teamId || null },  // Send null if no team selected
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('Server response:', response.data); // Add logging
  
      // Update the users state with the updated user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? response.data : user
        )
      );
    } catch (error) {
      setError('Failed to update user team');
      console.error('Error updating user team:', error);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:4000/api/users/${userId}`,
        { isAdmin: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setUsers(users.map(user => 
        user._id === userId ? response.data : user
      ));
    } catch (error) {
      setError('Failed to update admin status');
      console.error('Error updating admin status:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user._id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Team Assignment */}
                    <select
                      value={user.team?._id || ''}
                      onChange={(e) => handleTeamChange(user._id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">No Team</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </select>

                    {/* Admin Toggle */}
                    <button
                      onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.isAdmin
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {user.isAdmin ? 'Admin' : 'Make Admin'}
                    </button>

                    {/* Delete User */}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteUser(selectedUser?._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementTab;