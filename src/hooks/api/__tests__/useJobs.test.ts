import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useJobs,
  useJob,
  useUpdateJobStatus,
  useDeleteJob,
  useDuplicateJob,
  useJobActions,
  jobsKeys,
} from '../useJobs';
import * as api from '@/lib/api';
import type { Job, JobsListResponse } from '@/types/api';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getMockJobs: jest.fn(),
  getMockJob: jest.fn(),
  updateMockJobStatus: jest.fn(),
  deleteMockJob: jest.fn(),
  duplicateMockJob: jest.fn(),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    applicationCount: 92,
    datePosted: '2024-04-21T00:00:00Z',
    status: 'active',
    department: 'Engineering',
    location: 'Remote',
    type: 'full-time',
    description: 'Frontend developer position',
    requirements: ['React', 'TypeScript'],
    createdAt: '2024-04-21T00:00:00Z',
    updatedAt: '2024-04-21T00:00:00Z',
  },
  {
    id: '2',
    title: 'UX/UI Designer',
    applicationCount: 67,
    datePosted: '2024-04-18T00:00:00Z',
    status: 'paused',
    department: 'Design',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: 'UX/UI designer position',
    requirements: ['Figma', 'Adobe Creative Suite'],
    createdAt: '2024-04-18T00:00:00Z',
    updatedAt: '2024-04-18T00:00:00Z',
  },
];

const mockJobsResponse: JobsListResponse = {
  data: mockJobs,
  status: 'success',
  timestamp: '2024-04-21T00:00:00Z',
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    hasNext: false,
    hasPrev: false,
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };

  return Wrapper;
};

describe('useJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches jobs successfully', async () => {
    (api.getMockJobs as jest.Mock).mockResolvedValue(mockJobsResponse);

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockJobsResponse);
    expect(api.getMockJobs).toHaveBeenCalledWith(undefined);
  });

  it('passes parameters to API call', async () => {
    (api.getMockJobs as jest.Mock).mockResolvedValue(mockJobsResponse);

    const params = {
      page: 2,
      limit: 5,
      sort: 'title' as const,
      direction: 'asc' as const,
      status: ['active' as const],
      search: 'developer',
    };

    renderHook(() => useJobs(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.getMockJobs).toHaveBeenCalledWith(params);
    });
  });

  it('handles API errors', async () => {
    const error = new Error('Failed to fetch jobs');
    (api.getMockJobs as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('generates correct query keys', () => {
    const params = { page: 1, limit: 10 };
    const key = jobsKeys.list(params);

    expect(key).toEqual(['jobs', 'list', params]);
  });
});

describe('useJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches single job successfully', async () => {
    const mockJobResponse = {
      data: mockJobs[0],
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.getMockJob as jest.Mock).mockResolvedValue(mockJobResponse);

    const { result } = renderHook(() => useJob('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockJobResponse);
    expect(api.getMockJob).toHaveBeenCalledWith('1');
  });

  it('does not fetch when id is empty', () => {
    renderHook(() => useJob(''), {
      wrapper: createWrapper(),
    });

    expect(api.getMockJob).not.toHaveBeenCalled();
  });
});

describe('useUpdateJobStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates job status successfully', async () => {
    const updatedJob = { ...mockJobs[0], status: 'paused' as const };
    const mockResponse = {
      data: updatedJob,
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.updateMockJobStatus as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateJobStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', status: 'paused' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.updateMockJobStatus).toHaveBeenCalledWith('1', 'paused');
  });

  it('handles update errors', async () => {
    const error = new Error('Failed to update job status');
    (api.updateMockJobStatus as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateJobStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', status: 'paused' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDeleteJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes job successfully', async () => {
    const mockResponse = {
      status: 'success' as const,
      data: undefined as any,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.deleteMockJob as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.deleteMockJob).toHaveBeenCalledWith('1');
  });

  it('handles delete errors', async () => {
    const error = new Error('Failed to delete job');
    (api.deleteMockJob as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDuplicateJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('duplicates job successfully', async () => {
    const duplicatedJob = {
      ...mockJobs[0],
      id: '3',
      title: 'Senior Frontend Developer (Copy)',
    };
    const mockResponse = {
      data: duplicatedJob,
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.duplicateMockJob as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDuplicateJob(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.duplicateMockJob).toHaveBeenCalledWith('1');
  });
});

describe('useJobActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  it('handles edit action', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'edit');

    expect(consoleSpy).toHaveBeenCalledWith('Edit job:', '1');
    consoleSpy.mockRestore();
  });

  it('handles pause action', async () => {
    const mockResponse = {
      data: { ...mockJobs[0], status: 'paused' as const },
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.updateMockJobStatus as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'pause');

    expect(api.updateMockJobStatus).toHaveBeenCalledWith('1', 'paused');
  });

  it('handles resume action', async () => {
    const mockResponse = {
      data: { ...mockJobs[0], status: 'active' as const },
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.updateMockJobStatus as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'resume');

    expect(api.updateMockJobStatus).toHaveBeenCalledWith('1', 'active');
  });

  it('handles close action', async () => {
    const mockResponse = {
      data: { ...mockJobs[0], status: 'closed' as const },
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.updateMockJobStatus as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'close');

    expect(api.updateMockJobStatus).toHaveBeenCalledWith('1', 'closed');
  });

  it('handles delete action with confirmation', async () => {
    const mockResponse = {
      status: 'success' as const,
      data: undefined as any,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.deleteMockJob as jest.Mock).mockResolvedValue(mockResponse);
    (window.confirm as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'delete');

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this job? This action cannot be undone.'
    );
    expect(api.deleteMockJob).toHaveBeenCalledWith('1');
  });

  it('cancels delete action when not confirmed', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'delete');

    expect(window.confirm).toHaveBeenCalled();
    expect(api.deleteMockJob).not.toHaveBeenCalled();
  });

  it('handles duplicate action', async () => {
    const duplicatedJob = {
      ...mockJobs[0],
      id: '3',
      title: 'Senior Frontend Developer (Copy)',
    };
    const mockResponse = {
      data: duplicatedJob,
      status: 'success' as const,
      timestamp: '2024-04-21T00:00:00Z',
    };

    (api.duplicateMockJob as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'duplicate');

    expect(api.duplicateMockJob).toHaveBeenCalledWith('1');
  });

  it('handles unknown actions gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'unknown');

    expect(consoleSpy).toHaveBeenCalledWith('Unknown job action:', 'unknown');
    consoleSpy.mockRestore();
  });

  it('handles action errors', async () => {
    const error = new Error('Action failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    (api.updateMockJobStatus as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    await result.current.handleJobAction('1', 'pause');

    expect(consoleSpy).toHaveBeenCalledWith('Job action failed:', error);
    consoleSpy.mockRestore();
  });

  it('returns correct loading state', () => {
    const { result } = renderHook(() => useJobActions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});
