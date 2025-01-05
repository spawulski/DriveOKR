import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

const ProgressChart = ({ keyResult }) => {
  // Transform progress history into chart data with confidence levels
  const { chartData, confidenceAreas, yMin, yMax } = useMemo(() => {
    // Initialize data array with start value
    const data = [{
      date: keyResult.createdAt,
      value: keyResult.startValue,
      timestamp: new Date(keyResult.createdAt).getTime(),
      index: 0
    }];

    // Add progress history
    if (keyResult.progressHistory && keyResult.progressHistory.length > 0) {
      keyResult.progressHistory.forEach((entry, idx) => {
        data.push({
          date: entry.date,
          value: entry.value,
          timestamp: new Date(entry.date).getTime(),
          index: idx + 1
        });
      });
    }

    // Add current value if different from last entry
    const lastEntry = data[data.length - 1];
    if (lastEntry.value !== keyResult.currentValue) {
      data.push({
        date: new Date(),
        value: keyResult.currentValue,
        timestamp: Date.now(),
        index: data.length
      });
    }

    // Sort data by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);

    // Update indices after sorting
    data.forEach((entry, idx) => {
      entry.index = idx;
    });

    // Process confidence history
    const areas = [];
    if (keyResult.confidenceHistory && keyResult.confidenceHistory.length > 0) {
      const sortedConfidence = [...keyResult.confidenceHistory]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      sortedConfidence.forEach((conf, idx) => {
        const startIndex = Math.max(0, data.findIndex(d => 
          d.timestamp >= new Date(conf.timestamp).getTime()
        ));

        const nextConf = sortedConfidence[idx + 1];
        const endIndex = nextConf 
          ? Math.max(0, data.findIndex(d => d.timestamp >= new Date(nextConf.timestamp).getTime()))
          : data.length - 1;

        areas.push({
          startIndex,
          endIndex,
          level: conf.level,
          note: conf.note
        });
      });
    }

    // Calculate y-axis bounds
    const yMin = Math.min(keyResult.startValue, keyResult.targetValue) - 1;
    const yMax = Math.max(keyResult.startValue, keyResult.targetValue) + 1;

    return { 
      chartData: data, 
      confidenceAreas: areas,
      yMin,
      yMax
    };
  }, [keyResult]);

  // Get confidence level color with opacity
  const getConfidenceColor = (level) => {
    const colors = {
      high: '#22c55e',   // Green
      medium: '#eab308', // Yellow
      low: '#ef4444'     // Red
    };
    return colors[level] || '#gray';
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentPoint = payload[0].payload;
      const currentConfidence = confidenceAreas.find(
        area => currentPoint.index >= area.startIndex && currentPoint.index <= area.endIndex
      );

      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm">{`Date: ${new Date(currentPoint.date).toLocaleDateString()}`}</p>
          <p className="text-sm font-semibold text-indigo-600">
            {`Value: ${payload[0].value} ${keyResult.unit || ''}`}
          </p>
          {currentConfidence && (
            <div className="mt-1 border-t border-gray-100 pt-1">
              <p className="text-xs capitalize">
                Confidence: <span className="font-medium" 
                  style={{ color: getConfidenceColor(currentConfidence.level) }}>
                  {currentConfidence.level}
                </span>
              </p>
              {currentConfidence.note && (
                <p className="text-xs text-gray-500 mt-1">{currentConfidence.note}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
          {/* <XAxis 
            dataKey={(data) => new Date(data.date).toLocaleDateString()}
            tick={{ fontSize: 12 }}
          /> */}
          <XAxis
            dataKey="index" // Use index for categorical X-axis
            type="category"
            tickFormatter={(index) => {
              const entry = chartData[index];
              return entry ? new Date(entry.date).toLocaleDateString() : '';
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[yMin, yMax]}
            tickFormatter={(value) => `${value}${keyResult.unit ? ' ' + keyResult.unit : ''}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Confidence level areas */}
          {confidenceAreas.map((area, index) => {
            const startData = chartData[area.startIndex];
            const endData = chartData[area.endIndex];
            if (!startData || !endData) return null;

            return (
              <ReferenceArea
                key={index}
                x1={startData.index} // Use index for x1
                x2={endData.index}   // Use index for x2
                y1={yMin}
                y2={yMax}
                fill={getConfidenceColor(area.level)}
                fillOpacity={0.2}
              />
            );
          })}
          {/* {confidenceAreas.map((area, index) => {
            const startData = chartData[area.startIndex];
            const endData = chartData[area.endIndex];
            
            return (
              <ReferenceArea
                key={index}
                x1={new Date(startData.date).toLocaleDateString()}
                x2={new Date(endData.date).toLocaleDateString()}
                y1={yMin}
                y2={yMax}
                fill={getConfidenceColor(area.level)}
                fillOpacity={0.1}
              />
            );
          })} */}

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