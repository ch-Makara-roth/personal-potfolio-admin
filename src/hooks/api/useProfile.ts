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
    queryFn: async (): Promise<ApiResponse<AuthUser>> => {
      const resp = await authApi.getProfile();
      const raw: any = resp?.data;
      const user: any = raw?.user ?? raw?.profile?.user ?? raw;
      const normalized: AuthUser = {
        id: user?.id,
        email: user?.email,
        username: user?.username,
        firstName: user?.firstName ?? user?.firstname,
        lastName: user?.lastName ?? user?.lastname,
        role: user?.role,
        isActive: user?.isActive ?? user?.active,
        avatar: user?.avatar ?? user?.avatarUrl ?? user?.imageUrl ?? null,
        bio: user?.bio ?? null,
        website: user?.website ?? null,
        location: user?.location ?? null,
        createdAt: user?.createdAt ?? user?.created_at,
        updatedAt: user?.updatedAt ?? user?.updated_at,
      } as AuthUser;
      return { ...resp, data: normalized };
    },
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
