'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Avatar,
} from '@/components/ui';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadImage,
} from '@/hooks/api';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';

export default function AdminProfileSettingsPage() {
  const {
    data: profileResp,
    isLoading: profileLoading,
    isError: profileError,
  } = useProfile();
  const profile = profileResp?.data;

  const profileUser = useMemo(() => {
    return (profile as { user?: any } | undefined)?.user ?? profile ?? {};
  }, [profile]);

  // Local form state for profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const { mutateAsync: updateProfile, isPending: updatePending } =
    useUpdateProfile();
  const { mutateAsync: uploadImage, isPending: uploadPending } =
    useUploadImage();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const ALLOWED_IMAGE_TYPES = useMemo(
    () => [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/jpg',
    ],
    []
  );
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const sanitizeUrl = (s: string) =>
    String(s || '')
      .replace(/[`]/g, '')
      .trim();

  useEffect(() => {
    if (profileUser) {
      setFirstName(profileUser.firstName || '');
      setLastName(profileUser.lastName || '');
      setBio(profileUser.bio || '');
      setWebsite(profileUser.website || '');
      setLocation(profileUser.location || '');
      setAvatar(sanitizeUrl(profileUser.avatar || ''));
    }
  }, [profileUser]);
  const websiteValid = useMemo(
    () => (website ? !!new URL(website).host : true),
    [website]
  );
  const bioValid = useMemo(() => bio.length <= 500, [bio]);
  const locationValid = useMemo(() => location.length <= 100, [location]);
  const formValid = websiteValid && bioValid && locationValid;

  const onSaveProfile = async (avatarOverride?: string) => {
    setProfileMessage(null);
    setProfileErrorMsg(null);
    if (!formValid) {
      setProfileErrorMsg('Please fix validation errors before saving.');
      return;
    }
    const updatedProfile = {
      firstName,
      lastName,
      bio,
      website,
      location,
      avatar: avatarOverride ?? avatar,
    };
    try {
      await updateProfile(updatedProfile);
      setProfileMessage('Profile updated successfully');
    } catch (e: any) {
      setProfileErrorMsg(e?.message || 'Failed to update profile');
    }
  };

  const saveAvatarOnly = async (avatarUrl: string) => {
    setProfileMessage(null);
    setProfileErrorMsg(null);
    try {
      await updateProfile({ avatar: avatarUrl });
      setProfileMessage('Profile updated successfully');
    } catch (e: any) {
      setProfileErrorMsg(e?.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!profileUser?.id) return;
    setUploadError(null);
    if (!file) {
      setUploadError('Select an image first');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError('Max size 2MB');
      return;
    }
    setStatusText('Uploading image…');
    setUploading(true);
    try {
      const uploadRes = await uploadImage({
        file,
        uploader: 'user-profile',
      });
      const image = uploadRes?.data?.image ?? uploadRes?.data;
      const secureUrl = sanitizeUrl(image?.secureUrl || image?.url || '');
      if (!secureUrl) {
        setUploadError('Upload failed');
        return;
      }
      setStatusText('Saving profile…');
      await saveAvatarOnly(secureUrl);
      setAvatar(secureUrl);
      setDialogOpen(false);
      setStatusText('');
    } catch (e: any) {
      setUploadError(formatUploadError(e));
    } finally {
      setUploading(false);
    }
  };

  const formatUploadError = (e: any) => {
    const code = e?.code || '';
    const details = e?.details || {};
    if (
      code === 'UPLOAD_ERROR' &&
      details?.multerCode === 'LIMIT_UNEXPECTED_FILE'
    ) {
      return 'Unexpected file field';
    }
    if (code === 'AUTH_REQUIRED') return 'Authentication required';
    if (code === 'PAYLOAD_TOO_LARGE') return 'File too large';
    if (code === 'VALIDATION_ERROR') return 'Invalid file';
    return e?.message || 'Upload error';
  };

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const { mutateAsync: changePassword, isPending: changePending } =
    useChangePassword();

  const onChangePassword = async () => {
    setPasswordMessage(null);
    setPasswordErrorMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirm password do not match.');
      return;
    }
    try {
      const resp = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordMessage(
        resp?.data?.message || 'Password changed successfully'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordErrorMsg(e?.message || 'Failed to change password');
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <AuthGuard />
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </AppLayout>
    );
  }

  if (profileError) {
    return (
      <AppLayout>
        <AuthGuard />
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <div className="text-red-600">Failed to load profile</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Profile Settings</h1>

        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  className="avatar-base h-20 w-20 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDialogOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setDialogOpen(true);
                  }}
                  src={sanitizeUrl(avatar || profileUser?.avatar || '')}
                  fallback={
                    profile?.firstName ||
                    profile?.username ||
                    profile?.email ||
                    'User'
                  }
                />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    value={profile?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Username</label>
                  <input
                    value={profile?.username || ''}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-gray-600">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself (max 500 chars)"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  <div
                    className={`text-xs ${bioValid ? 'text-gray-500' : 'text-red-600'}`}
                  >
                    {bio.length}/500
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  {!websiteValid && (
                    <div className="text-xs text-red-600">
                      Please enter a valid URL.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  {!locationValid && (
                    <div className="text-xs text-red-600">
                      Max 100 characters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 flex items-center justify-between">
            <div>
              {profileMessage && (
                <div className="text-green-600 text-sm">{profileMessage}</div>
              )}
              {profileErrorMsg && (
                <div className="text-red-600 text-sm">{profileErrorMsg}</div>
              )}
            </div>
            <Button
              onClick={() => onSaveProfile()}
              loading={updatePending}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 flex items-center justify-between">
            <div>
              {passwordMessage && (
                <div className="text-green-600 text-sm">{passwordMessage}</div>
              )}
              {passwordErrorMsg && (
                <div className="text-red-600 text-sm">{passwordErrorMsg}</div>
              )}
            </div>
            <Button
              onClick={onChangePassword}
              loading={changePending}
              loadingText="Submitting..."
            >
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>
      <ImageUploadDialog
        open={dialogOpen}
        loading={uploading || uploadPending}
        error={uploadError || undefined}
        statusText={statusText}
        onDone={handleAvatarUpload}
        onClose={() => {
          setDialogOpen(false);
          setUploadError(null);
          setStatusText('');
          setUploading(false);
        }}
      />
    </AppLayout>
  );
}
