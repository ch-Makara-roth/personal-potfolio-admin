import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import type {
  AuthUser,
  ApiResponse,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '@/types/api';

// Query keys for auth-related queries
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Get current user profile
export const useProfile = () => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async (): Promise<ApiResponse<AuthUser>> => authApi.getProfile(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Update user profile mutation
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: ProfileUpdateRequest
    ): Promise<ApiResponse<AuthUser>> => authApi.updateProfile(body),
    onSuccess: async () => {
      // Invalidate and refetch profile on success
      await qc.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (
      body: ChangePasswordRequest
    ): Promise<ApiResponse<ChangePasswordResponse>> =>
      authApi.changePassword(body),
  });
};
