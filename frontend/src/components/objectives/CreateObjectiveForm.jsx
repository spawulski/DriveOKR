// frontend/src/components/objectives/CreateObjectiveForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const CreateObjectiveForm = ({ isOpen, onClose, onObjectiveCreated }) => {
  const getCurrentQuarter = () => {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'individual',
    department: '',
    timeframe: {
      quarter: getCurrentQuarter(),
      year: new Date().getFullYear()
    }
  });

  const [keyResults, setKeyResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddKeyResult = () => {
    setKeyResults([...keyResults, {
      title: '',
      description: '',
      metricType: 'number',
      startValue: 0,
      targetValue: 0,
      currentValue: 0,
      unit: '',
      confidenceLevel: 'medium'
    }]);
  };

  const handleRemoveKeyResult = (index) => {
    setKeyResults(keyResults.filter((_, i) => i !== index));
  };

  const handleKeyResultChange = (index, field, value) => {
    const updatedKeyResults = [...keyResults];
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: value
    };
    setKeyResults(updatedKeyResults);
  };

  const handleClose = (created = false) => {
    // Reset all form state
    setFormData({
      title: '',
      description: '',
      type: 'individual',
      department: '',
      timeframe: {
        quarter: getCurrentQuarter(),
        year: new Date().getFullYear()
      }
    });
    
    setKeyResults([{
      title: '',
      description: '',
      metricType: 'number',
      startValue: 0,
      targetValue: 0,
      currentValue: 0,
      unit: '',
      confidenceLevel: 'medium'
    }]);
    
    setError(null);
    setLoading(false);
    
    // Call the parent's onClose handler with created flag
    onClose(created);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      
      // Create objective
      const objectiveResponse = await axios.post(
        'http://localhost:4000/api/objectives',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      // Create key results
      const keyResultPromises = keyResults.map(kr =>
        axios.post(
          'http://localhost:4000/api/key-results',
          {
            ...kr,
            objective: objectiveResponse.data._id,
            currentValue: kr.startValue
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      );
  
      await Promise.all(keyResultPromises);
      handleClose(true); // Pass true to indicate successful creation
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create objective');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title && // Validate objective fields
      keyResults.length > 0 && // Ensure at least one key result
      keyResults.every(kr => (
        kr.title && // Required
        kr.metricType && // Required
        kr.startValue !== undefined && // Required
        kr.targetValue !== undefined && // Required
        kr.confidenceLevel // Required but has default
      ))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-8 max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Objective</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Objective Section */}
          <div className="space-y-4 border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium">Objective Details</h3>
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
                  Type
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="department">Department</option>
                    <option value="organization">Organization</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quarter
                  <select
                    value={formData.timeframe.quarter}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeframe: { ...formData.timeframe, quarter: Number(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4].map((q) => (
                      <option key={q} value={q}>Q{q}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year
                  <select
                    value={formData.timeframe.year}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeframe: { ...formData.timeframe, year: Number(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Key Results Section */}
          <div className="space-y-4">
            {keyResults.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Click "Add Key Result" to start adding key results to your objective
              </div>
            ) : (
              keyResults.map((kr, index) => (
                <div key={index} className="p-4 border rounded-md relative">
                  <h4 className="text-md font-medium mb-4">Key Result #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyResult(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                        <input
                          type="text"
                          required
                          value={kr.title}
                          onChange={(e) => handleKeyResultChange(index, 'title', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                        <textarea
                          value={kr.description}
                          onChange={(e) => handleKeyResultChange(index, 'description', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          rows="2"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Metric Type
                          <select
                            value={kr.metricType}
                            onChange={(e) => handleKeyResultChange(index, 'metricType', e.target.value)}
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
                            value={kr.unit}
                            onChange={(e) => handleKeyResultChange(index, 'unit', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g., users, $, %"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Start Value
                          <input
                            type="number"
                            required
                            value={kr.startValue}
                            onChange={(e) => handleKeyResultChange(index, 'startValue', Number(e.target.value))}
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
                            value={kr.targetValue}
                            onChange={(e) => handleKeyResultChange(index, 'targetValue', Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Confidence
                          <select
                            value={kr.confidenceLevel}
                            onChange={(e) => handleKeyResultChange(index, 'confidenceLevel', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Key Result Button */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleAddKeyResult}
              className="inline-flex items-center px-4 py-2 border border-indigo-500 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Key Result
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Objective'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateObjectiveForm;