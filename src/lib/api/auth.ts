import { apiRequest } from './client';
import type {
  AuthLoginResponseData,
  ApiResponse,
  AuthLoginRequest,
  AuthTokens,
  AuthUser,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '@/types/api';

export const authApi = {
  login: async (
    body: AuthLoginRequest
  ): Promise<ApiResponse<AuthLoginResponseData>> => {
    return apiRequest<AuthLoginResponseData>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Refresh tokens (server reads refresh token from cookie or Authorization header)
  refresh: async (refreshToken?: string): Promise<ApiResponse<AuthTokens>> => {
    const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    return apiRequest<AuthTokens>(`/${apiVersion}/auth/refresh`, {
      method: 'POST',
      headers: refreshToken
        ? { Authorization: `Bearer ${refreshToken}` }
        : undefined,
    });
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<AuthUser>> => {
    return apiRequest<AuthUser>('/v1/auth/profile');
  },

  // Update user profile
  updateProfile: async (
    body: ProfileUpdateRequest
  ): Promise<ApiResponse<AuthUser>> => {
    return apiRequest<AuthUser>('/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Change password
  changePassword: async (
    body: ChangePasswordRequest
  ): Promise<ApiResponse<ChangePasswordResponse>> => {
    return apiRequest<ChangePasswordResponse>('/v1/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
