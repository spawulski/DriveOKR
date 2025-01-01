// frontend/src/components/admin/TeamManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamManager = () => {
 const [teams, setTeams] = useState([]);
 const [departments, setDepartments] = useState([]);
 const [users, setUsers] = useState([]);
 const [newTeam, setNewTeam] = useState({
   name: '',
   department: '',
   teamLead: '',
   members: []
 });
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
   fetchTeams();
   fetchDepartments();
   fetchUsers();
 }, []);

 const fetchTeams = async () => {
   const token = localStorage.getItem('token');
   const response = await axios.get('http://localhost:4000/api/teams', {
     headers: { Authorization: `Bearer ${token}` }
   });
   setTeams(response.data);
   setLoading(false);
 };

 const fetchDepartments = async () => {
   const token = localStorage.getItem('token');
   const response = await axios.get('http://localhost:4000/api/departments', {
     headers: { Authorization: `Bearer ${token}` }
   });
   setDepartments(response.data);
 };

 const fetchUsers = async () => {
   const token = localStorage.getItem('token');
   const response = await axios.get('http://localhost:4000/api/users', {
     headers: { Authorization: `Bearer ${token}` }
   });
   setUsers(response.data);
 };

 const handleCreateTeam = async (e) => {
   e.preventDefault();
   try {
     const token = localStorage.getItem('token');
     await axios.post('http://localhost:4000/api/teams', newTeam, {
       headers: { Authorization: `Bearer ${token}` }
     });
     setNewTeam({ name: '', department: '', teamLead: '', members: [] });
     fetchTeams();
   } catch (err) {
     setError('Failed to create team');
   }
 };

 const handleUpdateTeamLead = async (teamId, userId) => {
   try {
     const token = localStorage.getItem('token');
     await axios.patch(
       `http://localhost:4000/api/teams/${teamId}/lead`,
       { leadId: userId },
       { headers: { Authorization: `Bearer ${token}` }}
     );
     fetchTeams();
   } catch (err) {
     setError('Failed to update team lead');
   }
 };

 const handleUpdateMembers = async (teamId, members) => {
   try {
     const token = localStorage.getItem('token');
     await axios.patch(
       `http://localhost:4000/api/teams/${teamId}/members`,
       { members },
       { headers: { Authorization: `Bearer ${token}` }}
     );
     fetchTeams();
   } catch (err) {
     setError('Failed to update team members');
   }
 };

 if (loading) return <div>Loading...</div>;

 return (
   <div className="space-y-6">
     {/* Create Team Form */}
     <div className="bg-white p-6 rounded-lg shadow">
       <h3 className="text-lg font-medium mb-4">Create New Team</h3>
       <form onSubmit={handleCreateTeam} className="space-y-4">
         <div>
           <label className="block text-sm font-medium text-gray-700">
             Name
             <input
               type="text"
               value={newTeam.name}
               onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
               required
             />
           </label>
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700">
             Department
             <select
               value={newTeam.department}
               onChange={(e) => setNewTeam({...newTeam, department: e.target.value})}
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
         <button
           type="submit"
           className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
         >
           Create Team
         </button>
       </form>
     </div>

     {/* Teams List */}
     <div className="bg-white shadow overflow-hidden sm:rounded-md">
       <ul className="divide-y divide-gray-200">
         {teams.map((team) => (
           <li key={team._id} className="px-6 py-4">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <h4 className="text-lg font-medium">{team.name}</h4>
                   <p className="text-sm text-gray-500">
                     Department: {departments.find(d => d._id === team.department)?.name}
                   </p>
                 </div>
                 <select
                   value={team.teamLead?._id || ''}
                   onChange={(e) => handleUpdateTeamLead(team._id, e.target.value)}
                   className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 >
                   <option value="">Select Team Lead</option>
                   {users.map((user) => (
                     <option key={user._id} value={user._id}>
                       {user.name}
                     </option>
                   ))}
                 </select>
               </div>
               <div>
                 <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members</h5>
                 <select
                   multiple
                   value={team.members?.map(m => m._id) || []}
                   onChange={(e) => handleUpdateMembers(team._id, 
                     Array.from(e.target.selectedOptions, option => option.value)
                   )}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 >
                   {users.map((user) => (
                     <option key={user._id} value={user._id}>
                       {user.name}
                     </option>
                   ))}
                 </select>
               </div>
             </div>
           </li>
         ))}
       </ul>
     </div>

     {error && (
       <div className="text-red-600 mt-2">
         {error}
       </div>
     )}
   </div>
 );
};

export default TeamManager;