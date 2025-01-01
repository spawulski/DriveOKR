// frontend/src/components/admin/DepartmentManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DepartmentManager = () => {
 const [departments, setDepartments] = useState([]);
 const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
   fetchDepartments();
   fetchUsers();
 }, []);

 const fetchDepartments = async () => {
   try {
     const token = localStorage.getItem('token');
     const response = await axios.get('http://localhost:4000/api/departments', {
       headers: { Authorization: `Bearer ${token}` }
     });
     setDepartments(response.data);
   } catch (err) {
     setError('Failed to fetch departments');
   }
 };

 const fetchUsers = async () => {
   try {
     const token = localStorage.getItem('token');
     const response = await axios.get('http://localhost:4000/api/users', {
       headers: { Authorization: `Bearer ${token}` }
     });
     setUsers(response.data);
   } catch (err) {
     setError('Failed to fetch users');
   } finally {
     setLoading(false);
   }
 };

 const handleCreateDepartment = async (e) => {
   e.preventDefault();
   try {
     const token = localStorage.getItem('token');
     await axios.post('http://localhost:4000/api/departments', newDepartment, {
       headers: { Authorization: `Bearer ${token}` }
     });
     setNewDepartment({ name: '', description: '' });
     fetchDepartments();
   } catch (err) {
     setError('Failed to create department');
   }
 };

 const handleUpdateManager = async (departmentId, userId) => {
   try {
     const token = localStorage.getItem('token');
     await axios.patch(
       `http://localhost:4000/api/departments/${departmentId}/manager`,
       { managerId: userId },
       { headers: { Authorization: `Bearer ${token}` }}
     );
     fetchDepartments();
   } catch (err) {
     setError('Failed to update manager');
   }
 };

 if (loading) return <div>Loading...</div>;

 return (
   <div className="space-y-6">
     {/* Create Department Form */}
     <div className="bg-white p-6 rounded-lg shadow">
       <h3 className="text-lg font-medium mb-4">Create New Department</h3>
       <form onSubmit={handleCreateDepartment} className="space-y-4">
         <div>
           <label className="block text-sm font-medium text-gray-700">
             Name
             <input
               type="text"
               value={newDepartment.name}
               onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
               required
             />
           </label>
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700">
             Description
             <textarea
               value={newDepartment.description}
               onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
             />
           </label>
         </div>
         <button
           type="submit"
           className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
         >
           Create Department
         </button>
       </form>
     </div>

     {/* Departments List */}
     <div className="bg-white shadow overflow-hidden sm:rounded-md">
       <ul className="divide-y divide-gray-200">
         {departments.map((department) => (
           <li key={department._id} className="px-6 py-4">
             <div className="flex items-center justify-between">
               <div>
                 <h4 className="text-lg font-medium">{department.name}</h4>
                 <p className="text-sm text-gray-500">{department.description}</p>
               </div>
               <div className="flex items-center space-x-4">
                 <select
                   value={department.manager?._id || ''}
                   onChange={(e) => handleUpdateManager(department._id, e.target.value)}
                   className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                 >
                   <option value="">Select Manager</option>
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

export default DepartmentManager;