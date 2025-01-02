import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Building2, Target, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import DepartmentManager from './DepartmentManager';
import TeamManager from './TeamManager';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalTeams: 0,
    totalObjectives: 0,
    completionRate: 0,
    atRiskObjectives: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all required data in parallel
      const [
        users, 
        departments, 
        teams, 
        objectives
      ] = await Promise.all([
        axios.get('http://localhost:4000/api/users', { headers }),
        axios.get('http://localhost:4000/api/departments', { headers }),
        axios.get('http://localhost:4000/api/teams', { headers }),
        axios.get('http://localhost:4000/api/objectives', { headers })
      ]);

      // Calculate metrics
      const completedObjectives = objectives.data.filter(obj => obj.status === 'completed');
      const atRiskObjectives = objectives.data.filter(obj => obj.status === 'at_risk');

      setMetrics({
        totalUsers: users.data.length,
        totalDepartments: departments.data.length,
        totalTeams: teams.data.length,
        totalObjectives: objectives.data.length,
        completionRate: Math.round((completedObjectives.length / objectives.data.length) * 100) || 0,
        atRiskObjectives: atRiskObjectives.length
      });
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage your organization's OKR platform</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDepartments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            <Target className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalObjectives}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk Objectives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.atRiskObjectives}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManager />
        </TabsContent>

        <TabsContent value="teams">
          <TeamManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    // Fetch analytics data here
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Objective Completion Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completion" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:4000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {users.map(user => (
              <div key={user._id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                      {user.role}
                    </span>
                    {user.isAdmin && (
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;