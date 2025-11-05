import type {
  ApiResponse,
  DashboardStats,
  UserPlan,
  UserSubscription,
  UpgradeRequest,
  UpgradeResponse,
  UpgradeAnalytics,
} from '@/types/api';
import { ApiClientError } from './client';

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockDashboardStats: DashboardStats = {
  applications: {
    count: 1234,
    trend: [45, 52, 48, 61, 58, 67, 73, 69, 78, 82],
    subtitle: 'This month',
  },
  interviews: {
    count: 89,
    trend: [30, 32, 29, 31, 30, 33, 29, 32, 30, 31],
    subtitle: 'Scheduled',
  },
  hired: {
    count: 23,
    trend: [15, 18, 16, 19, 17, 20, 18, 21, 19, 23],
    subtitle: 'This quarter',
  },
};

export const getMockStats = async (): Promise<ApiResponse<DashboardStats>> => {
  await delay(800);
  if (Math.random() < 0.1) {
    throw new ApiClientError('SERVER_ERROR', 'Failed to fetch statistics');
  }
  return {
    data: mockDashboardStats,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const mockCalendarEvents: import('@/types/api').CalendarEvent[] = [
  {
    id: '1',
    date: '2024-11-16',
    type: 'interview',
    title: 'Frontend Developer Interview',
  },
  { id: '2', date: '2024-11-20', type: 'deadline', title: 'Project Deadline' },
  { id: '3', date: '2024-11-25', type: 'meeting', title: 'Team Meeting' },
];

export const getMockCalendarEvents = async (
  year: number,
  month: number
): Promise<ApiResponse<import('@/types/api').CalendarEvent[]>> => {
  await delay(600);
  if (Math.random() < 0.05) {
    throw new ApiClientError('SERVER_ERROR', 'Failed to fetch calendar events');
  }
  return {
    data: mockCalendarEvents,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const mockInterviews: import('@/types/api').Interview[] = [
  {
    id: '1',
    candidate: {
      name: 'Sarah Johnson',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      role: 'Frontend Developer',
    },
    timeSlot: { start: '2024-11-16T10:00:00Z', end: '2024-11-16T12:45:00Z' },
    status: 'scheduled',
  },
  {
    id: '2',
    candidate: {
      name: 'Michael Chen',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'Backend Developer',
    },
    timeSlot: { start: '2024-11-17T14:00:00Z', end: '2024-11-17T15:30:00Z' },
    status: 'scheduled',
  },
  {
    id: '3',
    candidate: { name: 'Emily Rodriguez', role: 'UX Designer' },
    timeSlot: { start: '2024-11-18T09:00:00Z', end: '2024-11-18T10:30:00Z' },
    status: 'scheduled',
  },
];

export const getMockInterviews = async (
  limit?: number
): Promise<ApiResponse<import('@/types/api').Interview[]>> => {
  await delay(700);
  if (Math.random() < 0.05) {
    throw new ApiClientError('SERVER_ERROR', 'Failed to fetch interviews');
  }
  const data = limit ? mockInterviews.slice(0, limit) : mockInterviews;
  return { data, status: 'success', timestamp: new Date().toISOString() };
};

export const mockHiringSourcesData: import('@/types/api').HiringSourcesData = {
  sources: [
    { id: '1', source: 'Direct', value: 85, category: 'design' },
    { id: '2', source: 'Dribbble', value: 65, category: 'design' },
    { id: '3', source: 'LinkedIn', value: 45, category: 'engineering' },
    { id: '4', source: 'GitHub', value: 72, category: 'engineering' },
    { id: '5', source: 'Twitter', value: 38, category: 'marketing' },
    { id: '6', source: 'Referrals', value: 92, category: 'marketing' },
  ],
  categories: {
    design: { label: 'Design', color: '#1E40AF' },
    engineering: { label: 'Engineering', color: '#EA580C' },
    marketing: { label: 'Marketing', color: '#0891B2' },
  },
  lastUpdated: new Date().toISOString(),
};

export const getMockHiringSources = async (): Promise<
  ApiResponse<import('@/types/api').HiringSourcesData>
> => {
  await delay(900);
  if (Math.random() < 0.05) {
    throw new ApiClientError(
      'SERVER_ERROR',
      'Failed to fetch hiring sources data'
    );
  }
  return {
    data: mockHiringSourcesData,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const mockJobs: import('@/types/api').Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    applicationCount: 92,
    datePosted: '2024-04-21T00:00:00Z',
    status: 'active',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description:
      'We are looking for a Senior Frontend Developer to join our team...',
    requirements: ['React', 'TypeScript', 'Next.js', '5+ years experience'],
    createdAt: '2024-04-21T00:00:00Z',
    updatedAt: '2024-04-21T00:00:00Z',
  },
  {
    id: '2',
    title: 'UX/UI Designer',
    applicationCount: 67,
    datePosted: '2024-04-18T00:00:00Z',
    status: 'active',
    department: 'Design',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: 'Join our design team to create amazing user experiences...',
    requirements: [
      'Figma',
      'Adobe Creative Suite',
      'User Research',
      '3+ years experience',
    ],
    createdAt: '2024-04-18T00:00:00Z',
    updatedAt: '2024-04-18T00:00:00Z',
  },
  {
    id: '3',
    title: 'Backend Engineer',
    applicationCount: 45,
    datePosted: '2024-04-15T00:00:00Z',
    status: 'paused',
    department: 'Engineering',
    location: 'New York, NY',
    type: 'full-time',
    description: 'We need a Backend Engineer to build scalable systems...',
    requirements: ['Node.js', 'PostgreSQL', 'AWS', '4+ years experience'],
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2024-04-15T00:00:00Z',
  },
  {
    id: '4',
    title: 'Product Manager',
    applicationCount: 38,
    datePosted: '2024-04-12T00:00:00Z',
    status: 'active',
    department: 'Product',
    location: 'Austin, TX',
    type: 'full-time',
    description:
      'Lead product strategy and development for our core platform...',
    requirements: [
      'Product Strategy',
      'Agile',
      'Analytics',
      '5+ years experience',
    ],
    createdAt: '2024-04-12T00:00:00Z',
    updatedAt: '2024-04-12T00:00:00Z',
  },
  {
    id: '5',
    title: 'Marketing Specialist',
    applicationCount: 29,
    datePosted: '2024-04-10T00:00:00Z',
    status: 'closed',
    department: 'Marketing',
    location: 'Remote',
    type: 'contract',
    description: 'Drive marketing campaigns and brand awareness...',
    requirements: [
      'Digital Marketing',
      'SEO/SEM',
      'Content Creation',
      '2+ years experience',
    ],
    createdAt: '2024-04-10T00:00:00Z',
    updatedAt: '2024-04-10T00:00:00Z',
  },
];

export const getMockJobs = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  status?: string[];
  search?: string;
}): Promise<import('@/types/api').JobsListResponse> => {
  await delay(600);
  if (Math.random() < 0.05) {
    throw new ApiClientError('SERVER_ERROR', 'Failed to fetch jobs');
  }
  let filteredJobs = [...mockJobs];
  if (params?.status?.length) {
    filteredJobs = filteredJobs.filter((job) =>
      params.status!.includes(job.status)
    );
  }
  if (params?.search) {
    const searchTerm = params.search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.department?.toLowerCase().includes(searchTerm)
    );
  }
  if (params?.sort) {
    filteredJobs.sort((a, b) => {
      let aValue: any = a[params.sort as keyof import('@/types/api').Job];
      let bValue: any = b[params.sort as keyof import('@/types/api').Job];
      if (params.sort === 'datePosted') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (params.direction === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  }
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
  return {
    data: paginatedJobs,
    status: 'success',
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total: filteredJobs.length,
      hasNext: endIndex < filteredJobs.length,
      hasPrev: page > 1,
    },
  } as any;
};

export const getMockJob = async (
  id: string
): Promise<ApiResponse<import('@/types/api').Job>> => {
  await delay(400);
  const job = mockJobs.find((j) => j.id === id);
  if (!job) {
    throw new ApiClientError('NOT_FOUND', 'Job not found');
  }
  return { data: job, status: 'success', timestamp: new Date().toISOString() };
};

export const updateMockJobStatus = async (
  id: string,
  status: import('@/types/api').Job['status']
): Promise<ApiResponse<import('@/types/api').Job>> => {
  await delay(300);
  const jobIndex = mockJobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    throw new ApiClientError('NOT_FOUND', 'Job not found');
  }
  mockJobs[jobIndex] = {
    ...mockJobs[jobIndex],
    status,
    updatedAt: new Date().toISOString(),
  } as any;
  return {
    data: mockJobs[jobIndex],
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const deleteMockJob = async (id: string): Promise<ApiResponse<void>> => {
  await delay(400);
  const jobIndex = mockJobs.findIndex((j) => j.id === id);
  if (jobIndex === -1) {
    throw new ApiClientError('NOT_FOUND', 'Job not found');
  }
  mockJobs.splice(jobIndex, 1);
  return {
    status: 'success',
    data: undefined as any,
    timestamp: new Date().toISOString(),
  };
};

export const duplicateMockJob = async (
  id: string
): Promise<ApiResponse<import('@/types/api').Job>> => {
  await delay(500);
  const originalJob = mockJobs.find((j) => j.id === id);
  if (!originalJob) {
    throw new ApiClientError('NOT_FOUND', 'Job not found');
  }
  const newJob: import('@/types/api').Job = {
    ...originalJob,
    id: Date.now().toString(),
    title: `${originalJob.title} (Copy)`,
    applicationCount: 0,
    datePosted: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;
  mockJobs.unshift(newJob);
  return {
    data: newJob,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

// --- Upgrade mocks ---

const mockPlans: UserPlan[] = [
  {
    id: 'free',
    name: 'Free',
    type: 'free',
    features: ['basic-dashboard'],
    limits: {
      jobPostings: 1,
      candidates: 50,
      analytics: false,
      customBranding: false,
      prioritySupport: false,
    },
    price: undefined,
  },
  {
    id: 'pro',
    name: 'Pro',
    type: 'pro',
    features: ['advanced-analytics', 'priority-support'],
    limits: {
      jobPostings: 50,
      candidates: 5000,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
    },
    price: { monthly: 29, yearly: 290 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'enterprise',
    features: ['sla', 'dedicated-account-manager'],
    limits: {
      jobPostings: 1000,
      candidates: 100000,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
    },
    price: { monthly: 99, yearly: 990 },
  },
];

const mockSubscription: UserSubscription = {
  id: 'sub_001',
  userId: 'user_001',
  planId: 'free',
  status: 'active',
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const getMockCurrentPlan = async (): Promise<
  ApiResponse<{
    plan: UserPlan;
    subscription: UserSubscription;
  }>
> => {
  await delay(400);
  return {
    data: { plan: mockPlans[0], subscription: mockSubscription },
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const getMockAvailablePlans = async (): Promise<
  ApiResponse<UserPlan[]>
> => {
  await delay(400);
  return {
    data: mockPlans,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const mockInitiateUpgrade = async (
  upgradeData: UpgradeRequest
): Promise<ApiResponse<UpgradeResponse>> => {
  await delay(600);
  const plan =
    mockPlans.find((p) => p.id === upgradeData.planId) || mockPlans[1];
  const subscription: UserSubscription = {
    ...mockSubscription,
    planId: plan.id,
    updatedAt: new Date().toISOString(),
  };
  return {
    data: {
      subscription,
      plan,
      paymentIntent: {
        id: `pi_${Date.now()}`,
        clientSecret: `secret_${Math.random().toString(36).slice(2)}`,
        status: 'succeeded',
      },
    },
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};

export const mockTrackUpgradeEvent = async (
  analytics: UpgradeAnalytics
): Promise<ApiResponse<void>> => {
  await delay(200);
  // In a real app we would send analytics to server; here we just resolve
  console.debug('Mock track upgrade event', analytics);
  return {
    data: undefined as any,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
};
