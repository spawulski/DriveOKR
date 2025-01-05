import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProgressChart from '../ProgressChart';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: ({ label }) => <div data-testid="reference-line">{label?.value}</div>,
  ReferenceArea: () => <div data-testid="reference-area" />
}));

describe('ProgressChart', () => {
  const mockKeyResult = {
    createdAt: '2024-01-01T00:00:00.000Z',
    startValue: 0,
    currentValue: 75,
    targetValue: 100,
    unit: '%',
    progressHistory: [
      { date: '2024-01-15T00:00:00.000Z', value: 25 },
      { date: '2024-01-30T00:00:00.000Z', value: 50 }
    ],
    confidenceHistory: [
      { 
        timestamp: '2024-01-01T00:00:00.000Z', 
        level: 'high',
        note: 'Initial confidence'
      },
      {
        timestamp: '2024-01-20T00:00:00.000Z',
        level: 'medium',
        note: 'Facing some challenges'
      }
    ]
  };

  it('renders all chart components', () => {
    render(<ProgressChart keyResult={mockKeyResult} />);
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('renders target reference line', () => {
    render(<ProgressChart keyResult={mockKeyResult} />);
    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  it('renders confidence areas when history is provided', () => {
    render(<ProgressChart keyResult={mockKeyResult} />);
    const areas = screen.getAllByTestId('reference-area');
    expect(areas).toHaveLength(mockKeyResult.confidenceHistory.length);
  });

  it('handles missing progress history', () => {
    const keyResultWithoutProgress = {
      ...mockKeyResult,
      progressHistory: []
    };
    render(<ProgressChart keyResult={keyResultWithoutProgress} />);
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
  });

  it('handles missing confidence history', () => {
    const keyResultWithoutConfidence = {
      ...mockKeyResult,
      confidenceHistory: []
    };
    render(<ProgressChart keyResult={keyResultWithoutConfidence} />);
    const areas = screen.queryAllByTestId('reference-area');
    expect(areas).toHaveLength(0);
  });
});