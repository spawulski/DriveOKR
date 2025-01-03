// frontend/src/components/charts/ProgressChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ProgressChart = ({ keyResult }) => {
  // Transform progress history into chart data
  const data = keyResult.progressHistory
    ? keyResult.progressHistory.map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        value: entry.value
      }))
    : [];

  // Add start point if it doesn't exist in history
  if (!data.some(d => d.value === keyResult.startValue)) {
    data.unshift({
      date: 'Start',
      value: keyResult.startValue
    });
  }

  // Add current point if it's different from the last history entry
  if (data.length === 0 || data[data.length - 1].value !== keyResult.currentValue) {
    data.push({
      date: 'Current',
      value: keyResult.currentValue
    });
  }

  // Sort data by date
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm">{`Date: ${label}`}</p>
          <p className="text-sm font-semibold text-indigo-600">
            {`Value: ${payload[0].value} ${keyResult.unit || ''}`}
          </p>
          <p className="text-xs text-gray-500">
            {`Target: ${keyResult.targetValue} ${keyResult.unit || ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[
              Math.min(keyResult.startValue, keyResult.targetValue) - 1,
              Math.max(keyResult.startValue, keyResult.targetValue) + 1
            ]}
            tickFormatter={(value) => `${value}${keyResult.unit ? ' ' + keyResult.unit : ''}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target value reference line */}
          <ReferenceLine 
            y={keyResult.targetValue} 
            stroke="#4F46E5" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Target',
              position: 'right',
              fill: '#4F46E5',
              fontSize: 12
            }}
          />

          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={{ 
              fill: '#4F46E5',
              r: 4,
              strokeWidth: 2
            }}
            activeDot={{
              r: 6,
              stroke: '#4F46E5',
              strokeWidth: 2
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;