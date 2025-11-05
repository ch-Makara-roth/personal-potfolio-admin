import React from 'react';
import { FileText, Circle, Check } from 'lucide-react';
import { StatsCard } from './StatsCard';

const meta = {
  title: 'UI/StatsCard',
  component: StatsCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Sample trend data
const upwardTrend = {
  data: [45, 52, 48, 61, 58, 67, 73, 69, 78, 82],
};

const downwardTrend = {
  data: [82, 78, 75, 69, 73, 67, 58, 61, 48, 45],
};

const flatTrend = {
  data: [50, 52, 49, 51, 50, 53, 49, 52, 50, 51],
};

export const Applications = () => (
  <div className="w-80">
    <StatsCard
      title="Applications"
      value={1234}
      icon={FileText}
      variant="applications"
      trend={upwardTrend}
      subtitle="This month"
    />
  </div>
);

export const Interviews = () => (
  <div className="w-80">
    <StatsCard
      title="Interviews"
      value={89}
      icon={Circle}
      variant="interviews"
      trend={flatTrend}
      subtitle="Scheduled"
    />
  </div>
);

export const Hired = () => (
  <div className="w-80">
    <StatsCard
      title="Hired"
      value={23}
      icon={Check}
      variant="hired"
      trend={downwardTrend}
      subtitle="This quarter"
    />
  </div>
);

export const WithoutTrend = () => (
  <div className="w-80">
    <StatsCard
      title="Total Candidates"
      value={5678}
      icon={FileText}
      variant="applications"
      subtitle="All time"
    />
  </div>
);

export const CustomFormatting = () => (
  <div className="w-80">
    <StatsCard
      title="Success Rate"
      value={87.5}
      icon={Check}
      variant="hired"
      formatValue={(value) => `${value}%`}
      subtitle="Conversion rate"
    />
  </div>
);

export const AllSizes = () => (
  <div className="space-y-4">
    <div className="w-64">
      <StatsCard
        title="Small"
        value={123}
        icon={FileText}
        variant="applications"
        size="sm"
      />
    </div>
    <div className="w-80">
      <StatsCard
        title="Medium (Default)"
        value={456}
        icon={Circle}
        variant="interviews"
        size="md"
      />
    </div>
    <div className="w-96">
      <StatsCard
        title="Large"
        value={789}
        icon={Check}
        variant="hired"
        size="lg"
      />
    </div>
  </div>
);

export const Dashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
    <StatsCard
      title="Applications"
      value={1234}
      icon={FileText}
      variant="applications"
      trend={upwardTrend}
      subtitle="This month"
      formatValue={(value) => value.toLocaleString()}
    />
    <StatsCard
      title="Interviews"
      value={89}
      icon={Circle}
      variant="interviews"
      trend={flatTrend}
      subtitle="Scheduled"
    />
    <StatsCard
      title="Hired"
      value={23}
      icon={Check}
      variant="hired"
      trend={downwardTrend}
      subtitle="This quarter"
    />
  </div>
);
