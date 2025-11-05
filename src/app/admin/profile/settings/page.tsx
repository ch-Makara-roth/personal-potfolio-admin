'use client';
/* eslint-disable prettier/prettier */

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
  AvatarImage,
  AvatarFallback,
} from '@/components/ui';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/api';

export default function AdminProfileSettingsPage() {
  const {
    data: profileResp,
    isLoading: profileLoading,
    isError: profileError,
  } = useProfile();
  const profile = profileResp?.data;

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

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setLocation(profile.location || '');
      setAvatar(profile.avatar || '');
    }
  }, [profile]);

  const websiteValid = useMemo(() => {
    if (!website) return true;
    try {
      const u = new URL(website);
      return Boolean(u.protocol && u.host);
    } catch {
      return false;
    }
  }, [website]);

  const bioValid = bio.length <= 500;
  const locationValid = location.length <= 100;

  const formValid = websiteValid && bioValid && locationValid;

  const onSaveProfile = async () => {
    setProfileMessage(null);
    setProfileErrorMsg(null);
    if (!formValid) {
      setProfileErrorMsg('Please fix validation errors before saving.');
      return;
    }
    try {
      await updateProfile({
        firstName,
        lastName,
        bio,
        website,
        location,
        avatar,
      });
      setProfileMessage('Profile updated successfully');
    } catch (e: any) {
      setProfileErrorMsg(e?.message || 'Failed to update profile');
    }
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

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Profile Settings</h1>

        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          {profileLoading ? (
            <div className="text-gray-500">Loading profile...</div>
          ) : profileError ? (
            <div className="text-red-600">Failed to load profile</div>
          ) : (
            <>
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={avatar || profile?.avatar || ''}
                      alt="User avatar"
                    />
                    <AvatarFallback>
                      {(profile?.firstName || 'U')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Avatar URL"
                    className="w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
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

              <CardFooter className="pt-4 flex items-center justify-between">
                <div>
                  {profileMessage && (
                    <div className="text-green-600 text-sm">
                      {profileMessage}
                    </div>
                  )}
                  {profileErrorMsg && (
                    <div className="text-red-600 text-sm">
                      {profileErrorMsg}
                    </div>
                  )}
                </div>
                <Button
                  onClick={onSaveProfile}
                  loading={updatePending}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </CardFooter>
            </>
          )}
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
    </AppLayout>
  );
}