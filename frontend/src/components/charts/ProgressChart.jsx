// frontend/src/components/charts/ProgressChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ keyResult }) => {
  // Transform progress history into chart data
  // For now, let's create some sample data points based on current value
  const data = [
    { date: '2023-12-01', value: keyResult.startValue },
    { date: new Date().toISOString().split('T')[0], value: keyResult.currentValue }
  ];

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm">{`Date: ${new Date(label).toLocaleDateString()}`}</p>
          <p className="text-sm font-semibold text-indigo-600">
            {`Value: ${payload[0].value} ${keyResult.unit || ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <YAxis 
            domain={[keyResult.startValue, keyResult.targetValue]}
            tickFormatter={(value) => `${value}${keyResult.unit ? ' ' + keyResult.unit : ''}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={{ fill: '#4F46E5', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;