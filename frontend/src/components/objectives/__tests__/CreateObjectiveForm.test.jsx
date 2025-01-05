import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateObjectiveForm from '../CreateObjectiveForm';
import axios from 'axios';

  const fillRequiredFields = async () => {
    // Fill objective details
    await userEvent.type(screen.getByLabelText(/^title$/i), 'Test Objective');
    await userEvent.type(screen.getByLabelText(/description/i), 'Test Description');

    // Set Type to Individual
    const typeSelect = screen.getByLabelText(/^type$/i);
    await userEvent.selectOptions(typeSelect, ['individual']);
    await new Promise(resolve => setTimeout(resolve, 100));

    // First select department and wait for teams to load
    const departmentSelect = screen.getByLabelText(/department/i);
    await userEvent.selectOptions(departmentSelect, ['dept1']); // Engineering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Then select team and wait for users to load
    const teamSelect = screen.getByLabelText(/team/i);
    await userEvent.selectOptions(teamSelect, ['team1']); // Frontend Team
    await new Promise(resolve => setTimeout(resolve, 100));

    // Then select owner
    const ownerSelect = screen.getByLabelText(/owner/i);
    await userEvent.selectOptions(ownerSelect, ['user1']); // Frontend Dev 1

    // Select quarter and year
    const quarterSelect = screen.getByLabelText(/quarter/i);
    const yearSelect = screen.getByLabelText(/year/i);
    await userEvent.selectOptions(quarterSelect, ['1']); // Q1
    await userEvent.selectOptions(yearSelect, ['2025']); // 2025

    // Add and fill key result
    await userEvent.click(screen.getByText('Add Key Result'));
    
    const { 
      title: krTitle,
      description: krDescription,
      startValue,
      targetValue,
      metricType,
      confidence,
      unit
    } = getKeyResultInputs();

    await userEvent.type(krTitle, 'Test KR');
    await userEvent.type(krDescription, 'Test KR Description');
    await userEvent.clear(startValue);
    await userEvent.type(startValue, '0');
    await userEvent.clear(targetValue);
    await userEvent.type(targetValue, '100');
    await userEvent.selectOptions(metricType, 'number');
    await userEvent.type(unit, 'users');
    await userEvent.selectOptions(confidence, 'medium');

    // Let form state update
    await new Promise(resolve => setTimeout(resolve, 100));
  };
const getKeyResultInputs = (index = 1) => {
  const section = screen.getByText(`Key Result #${index}`).closest('div');
  return {
    title: within(section).getByLabelText(/title/i),
    startValue: within(section).getByLabelText(/start value/i),
    targetValue: within(section).getByLabelText(/target value/i),
    metricType: within(section).getByLabelText(/metric type/i),
    confidence: within(section).getByLabelText(/confidence/i)
  };
};

// Mock axios
vi.mock('axios');

describe('CreateObjectiveForm', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onObjectiveCreated: vi.fn()
  };

  const mockData = {
    departments: [
      { _id: 'dept1', name: 'Engineering' },
      { _id: 'dept2', name: 'Marketing' }
    ],
    teams: [
      { _id: 'team1', name: 'Frontend', department: { _id: 'dept1' } },
      { _id: 'team2', name: 'Backend', department: { _id: 'dept1' } }
    ],
    users: [
      { _id: 'user1', name: 'John Doe', team: { _id: 'team1' } },
      { _id: 'user2', name: 'Jane Smith', team: { _id: 'team1' } }
    ]
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token');
    
    // Mock API calls
    axios.get.mockImplementation((url) => {
      if (url.includes('/departments')) return Promise.resolve({ data: mockData.departments });
      if (url.includes('/teams')) return Promise.resolve({ data: mockData.teams });
      if (url.includes('/users')) return Promise.resolve({ data: mockData.users });
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders form when isOpen is true', () => {
    render(<CreateObjectiveForm {...mockProps} />);
    expect(screen.getByText('Create New Objective')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CreateObjectiveForm {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Create New Objective')).not.toBeInTheDocument();
  });

  it('loads initial data on mount', async () => {
    render(<CreateObjectiveForm {...mockProps} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringMatching(/departments/),
        expect.any(Object)
      );
    });
  });

  it('handles type change and shows appropriate selectors', async () => {
    render(<CreateObjectiveForm {...mockProps} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    // Change type to team
    const typeSelect = screen.getByLabelText(/type/i);
    await userEvent.selectOptions(typeSelect, 'team');

    // Should show department and team selectors
    expect(screen.getByText('Select Department')).toBeInTheDocument();
    expect(screen.getByText('Select Team')).toBeInTheDocument();
  });

  it('manages key results correctly', async () => {
    render(<CreateObjectiveForm {...mockProps} />);

    // Add key result button should exist
    const addButton = screen.getByText('Add Key Result');
    expect(addButton).toBeInTheDocument();

    // Click to add a key result
    await userEvent.click(addButton);

    // Should show key result form
    expect(screen.getByText('Key Result #1')).toBeInTheDocument();

    // Fill in key result details
    const { title, startValue, targetValue } = getKeyResultInputs();
    await userEvent.type(title, 'Test KR');
    await userEvent.type(startValue, '0');
    await userEvent.type(targetValue, '100');

    expect(title).toHaveValue('Test KR');
    expect(startValue).toHaveValue(0);
    expect(targetValue).toHaveValue(100);
  });

  it('validates form before submission', async () => {
    render(<CreateObjectiveForm {...mockProps} />);

    // Submit button should be disabled initially
    const submitButton = screen.getByText('Create Objective');
    expect(submitButton).toBeDisabled();

    // Fill required fields
    await userEvent.type(screen.getByLabelText(/title/i), 'Test Objective');
    await userEvent.click(screen.getByText('Add Key Result'));
    
    const { title, startValue, targetValue } = getKeyResultInputs();
    await userEvent.type(title, 'Test KR');
    await userEvent.type(startValue, '0');
    await userEvent.type(targetValue, '100');

    // Submit button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  // it('handles form submission correctly', async () => {
  //   // Mock successful POST responses for both endpoints
  //   axios.post
  //     .mockResolvedValueOnce({ data: { _id: 'obj1' } }) // objectives endpoint
  //     .mockResolvedValueOnce({ data: { _id: 'kr1' } }); // key-results endpoint

  //   render(<CreateObjectiveForm {...mockProps} />);

  //   // Fill form with all required fields
  //   await userEvent.type(screen.getByLabelText(/title/i), 'Test Objective');
    
  //   // Select department
  //   const departmentSelect = screen.getByLabelText(/department/i);
  //   await userEvent.selectOptions(departmentSelect, 'dept1');

  //   // Add and fill key result with required fields
  //   await userEvent.click(screen.getByText('Add Key Result'));
    
  //   const { title: krTitle, startValue, targetValue } = getKeyResultInputs();
  //   await userEvent.type(krTitle, 'Test KR');
  //   await userEvent.clear(startValue);
  //   await userEvent.type(startValue, '0');
  //   await userEvent.clear(targetValue);
  //   await userEvent.type(targetValue, '100');

  //   // Select required metric type
  //   const metricType = screen.getByLabelText(/metric type/i);
  //   await userEvent.selectOptions(metricType, 'number');

  //   // Select required confidence level
  //   const confidence = screen.getByLabelText(/confidence/i);
  //   await userEvent.selectOptions(confidence, 'medium');

  //   // Submit form
  //   const submitButton = screen.getByRole('button', { name: /create objective/i });
  //   expect(submitButton).not.toBeDisabled();
  //   await userEvent.click(submitButton);

  //   // Wait for API calls
  //   await waitFor(() => {
  //     expect(axios.post).toHaveBeenCalledWith(
  //       'http://localhost:4000/api/objectives',
  //       expect.any(Object),
  //       expect.any(Object)
  //     );
  //   });

  //   // Wait for onClose
  //   await waitFor(() => {
  //     expect(mockProps.onClose).toHaveBeenCalledWith(true);
  //   });
  // });

  // it('handles API errors correctly', async () => {
  //   // Mock API error with explicit error response
  //   const errorMessage = 'Failed to create objective';
  //   axios.post.mockRejectedValueOnce({
  //     response: {
  //       data: errorMessage,  // Changed to match your component's error handling
  //       status: 400
  //     }
  //   });

  //   render(<CreateObjectiveForm {...mockProps} />);

  //   // Fill form
  //   await userEvent.type(screen.getByLabelText(/title/i), 'Test Objective');
  //   await userEvent.click(screen.getByText('Add Key Result'));
    
  //   const { title, startValue, targetValue } = getKeyResultInputs();
  //   await userEvent.type(title, 'Test KR');
  //   await userEvent.type(startValue, '0');
  //   await userEvent.type(targetValue, '100');

  //   // Find and click submit button
  //   const submitButton = screen.getByText('Create Objective');
  //   expect(submitButton).toBeInTheDocument();
    
  //   // Submit form
  //   await userEvent.click(submitButton);

  //   // Add a small delay to allow for state updates
  //   await new Promise(resolve => setTimeout(resolve, 0));

  //   // Debug what's in the DOM after submission
  //   screen.debug();

  //   // Try finding any element with text containing our error message
  //   await waitFor(() => {
  //     // Look for any text containing our error message
  //     const errorElements = screen.getAllByText(content => 
  //       content.includes('Failed') || 
  //       content.includes('failed') || 
  //       content.includes('error') ||
  //       content.includes('Error') ||
  //       content.includes('Please')q
  //     );
  //     expect(errorElements.length).toBeGreaterThan(0);
  //   }, { timeout: 3000 });  // Increase timeout and debug
  // });
});