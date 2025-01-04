// frontend/src/components/objectives/KeyResultUpdateModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KeyResultUpdateModal = ({ isOpen, onClose, keyResult, objectiveId, updateOnly = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metricType: 'number',
    startValue: 0,
    currentValue: 0,
    targetValue: 0,
    unit: '',
    confidenceLevel: 'medium'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (keyResult) {
      setFormData({
        title: keyResult.title || '',
        description: keyResult.description || '',
        metricType: keyResult.metricType || 'number',
        startValue: keyResult.startValue || 0,
        currentValue: keyResult.currentValue || 0,
        targetValue: keyResult.targetValue || 0,
        unit: keyResult.unit || '',
        confidenceLevel: keyResult.confidenceLevel || 'medium'
      });
    } else {
      // Reset form for new key results
      setFormData({
        title: '',
        description: '',
        metricType: 'number',
        startValue: 0,
        currentValue: 0,
        targetValue: 0,
        unit: '',
        confidenceLevel: 'medium'
      });
    }
  }, [keyResult]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // If in update-only mode, only send progress-related fields
      const payload = updateOnly ? {
        currentValue: formData.currentValue,
        confidenceLevel: formData.confidenceLevel,
        progress: calculateProgress(formData),
        status: calculateStatus(formData)
      } : {
        ...formData,
        progress: calculateProgress(formData),
        status: calculateStatus(formData)
      };

      if (keyResult?._id) {
        await axios.put(
          `http://localhost:4000/api/key-results/${keyResult._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          'http://localhost:4000/api/key-results',
          { ...payload, objective: objectiveId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      onClose(true);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update key result');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for progress and status calculation
  const calculateProgress = (data) => {
    if (data.currentValue >= data.targetValue) return 100;
    if (data.currentValue <= data.startValue) return 0;
    const total = data.targetValue - data.startValue;
    const current = data.currentValue - data.startValue;
    return Math.round((current / total) * 100);
  };

  const calculateStatus = (data) => {
    const progress = calculateProgress(data);
    if (progress >= 100) return 'completed';
    if (data.confidenceLevel === 'high' && progress >= 60) return 'on_track';
    if (data.confidenceLevel === 'medium' || progress >= 40) return 'at_risk';
    return 'behind';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-8 max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {updateOnly ? 'Update Progress' : (keyResult?._id ? 'Edit Key Result' : 'Add Key Result')}
          </h2>
          <button onClick={() => onClose()} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!updateOnly && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows="3"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Metric Type
                    <select
                      value={formData.metricType}
                      onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                      <option value="currency">Currency</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g., users, $, %"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Value
                    <input
                      type="number"
                      required
                      value={formData.startValue}
                      onChange={(e) => setFormData({ ...formData, startValue: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target Value
                    <input
                      type="number"
                      required
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Value
                <input
                  type="number"
                  required
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confidence Level
                <select
                  value={formData.confidenceLevel}
                  onChange={(e) => setFormData({ ...formData, confidenceLevel: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeyResultUpdateModal;