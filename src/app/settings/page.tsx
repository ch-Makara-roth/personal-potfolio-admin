'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
} from '@/components/ui';
import { useNotificationActions } from '@/stores';
import {
  Settings,
  Palette,
  Bell,
  Globe,
  Clock,
  Calendar,
  Languages,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeft,
  Minimize2,
  Mail,
  BellRing,
  Volume2,
  Newspaper,
  Check,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────
type Tab = 'general' | 'appearance' | 'notifications';

interface GeneralSettings {
  siteName: string;
  timezone: string;
  dateFormat: string;
  language: string;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarDefault: 'expanded' | 'collapsed';
  compactMode: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  weeklyDigest: boolean;
}

interface AllSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
}

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'app_settings';

const DEFAULT_SETTINGS: AllSettings = {
  general: {
    siteName: 'CONSULT Admin',
    timezone: 'Asia/Phnom_Penh',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
  },
  appearance: {
    theme: 'system',
    sidebarDefault: 'expanded',
    compactMode: false,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    notificationSound: true,
    weeklyDigest: false,
  },
};

const TIMEZONES = [
  { value: 'Asia/Phnom_Penh', label: 'Asia/Phnom_Penh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'km', label: 'ខ្មែរ (Khmer)' },
  { value: 'zh', label: '中文 (Chinese)' },
];

// ─── Tabs Config ─────────────────────────────────────────────────────
const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

// ─── Helper Components ───────────────────────────────────────────────
function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-0.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </div>
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        checked
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
          : 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

function SelectField({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-colors cursor-pointer min-w-[180px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: React.ElementType }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { showToast } = useNotificationActions();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({
          general: { ...prev.general, ...parsed.general },
          appearance: { ...prev.appearance, ...parsed.appearance },
          notifications: { ...prev.notifications, ...parsed.notifications },
        }));
      }
    } catch {
      // Ignore parse errors — use defaults
    }
  }, []);

  const updateGeneral = useCallback(
    (key: keyof GeneralSettings, value: string) => {
      setSettings((prev) => ({
        ...prev,
        general: { ...prev.general, [key]: value },
      }));
      setHasChanges(true);
    },
    []
  );

  const updateAppearance = useCallback(
    <K extends keyof AppearanceSettings>(
      key: K,
      value: AppearanceSettings[K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        appearance: { ...prev.appearance, [key]: value },
      }));
      setHasChanges(true);
    },
    []
  );

  const updateNotifications = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }));
      setHasChanges(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate a brief save delay for UX feel
    await new Promise((r) => setTimeout(r, 400));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setHasChanges(false);
      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Your preferences have been updated successfully.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Save failed',
        message: 'Could not save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [settings, showToast]);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your application preferences and configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 w-fit shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* ─── General Tab ────────────────────────────── */}
          {activeTab === 'general' && (
            <Card className="overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y-0">
                <SettingRow
                  icon={Globe}
                  label="Site Name"
                  description="Display name used across the admin dashboard"
                >
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => updateGeneral('siteName', e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-colors w-[220px]"
                    placeholder="CONSULT Admin"
                  />
                </SettingRow>

                <SettingRow
                  icon={Clock}
                  label="Timezone"
                  description="Used for scheduling and displaying dates"
                >
                  <SelectField
                    value={settings.general.timezone}
                    onChange={(v) => updateGeneral('timezone', v)}
                    options={TIMEZONES}
                    label="Timezone"
                  />
                </SettingRow>

                <SettingRow
                  icon={Calendar}
                  label="Date Format"
                  description="Preferred date display format"
                >
                  <SelectField
                    value={settings.general.dateFormat}
                    onChange={(v) => updateGeneral('dateFormat', v)}
                    options={DATE_FORMATS}
                    label="Date format"
                  />
                </SettingRow>

                <SettingRow
                  icon={Languages}
                  label="Language"
                  description="Interface language preference"
                >
                  <SelectField
                    value={settings.general.language}
                    onChange={(v) => updateGeneral('language', v)}
                    options={LANGUAGES}
                    label="Language"
                  />
                </SettingRow>
              </CardContent>
            </Card>
          )}

          {/* ─── Appearance Tab ─────────────────────────── */}
          {activeTab === 'appearance' && (
            <Card className="overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SettingRow
                  icon={Sun}
                  label="Theme"
                  description="Choose between light, dark, or system theme"
                >
                  <SegmentedControl
                    value={settings.appearance.theme}
                    onChange={(v) => updateAppearance('theme', v)}
                    label="Theme preference"
                    options={[
                      { value: 'light' as const, label: 'Light', icon: Sun },
                      { value: 'dark' as const, label: 'Dark', icon: Moon },
                      {
                        value: 'system' as const,
                        label: 'System',
                        icon: Monitor,
                      },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={PanelLeft}
                  label="Sidebar Default"
                  description="Default sidebar state on page load"
                >
                  <SegmentedControl
                    value={settings.appearance.sidebarDefault}
                    onChange={(v) => updateAppearance('sidebarDefault', v)}
                    label="Sidebar default state"
                    options={[
                      {
                        value: 'expanded' as const,
                        label: 'Expanded',
                        icon: PanelLeft,
                      },
                      {
                        value: 'collapsed' as const,
                        label: 'Collapsed',
                        icon: PanelLeftClose,
                      },
                    ]}
                  />
                </SettingRow>

                <SettingRow
                  icon={Minimize2}
                  label="Compact Mode"
                  description="Reduce spacing for a denser interface"
                >
                  <Toggle
                    checked={settings.appearance.compactMode}
                    onChange={(v) => updateAppearance('compactMode', v)}
                    label="Compact mode"
                  />
                </SettingRow>
              </CardContent>
            </Card>
          )}

          {/* ─── Notifications Tab ──────────────────────── */}
          {activeTab === 'notifications' && (
            <Card className="overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                    <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SettingRow
                  icon={Mail}
                  label="Email Notifications"
                  description="Receive important updates via email"
                >
                  <Toggle
                    checked={settings.notifications.emailNotifications}
                    onChange={(v) =>
                      updateNotifications('emailNotifications', v)
                    }
                    label="Email notifications"
                  />
                </SettingRow>

                <SettingRow
                  icon={BellRing}
                  label="Push Notifications"
                  description="Browser push notifications for real-time alerts"
                >
                  <Toggle
                    checked={settings.notifications.pushNotifications}
                    onChange={(v) =>
                      updateNotifications('pushNotifications', v)
                    }
                    label="Push notifications"
                  />
                </SettingRow>

                <SettingRow
                  icon={Volume2}
                  label="Notification Sound"
                  description="Play a sound when receiving notifications"
                >
                  <Toggle
                    checked={settings.notifications.notificationSound}
                    onChange={(v) =>
                      updateNotifications('notificationSound', v)
                    }
                    label="Notification sound"
                  />
                </SettingRow>

                <SettingRow
                  icon={Newspaper}
                  label="Weekly Digest"
                  description="Get a summary of activity every Monday"
                >
                  <Toggle
                    checked={settings.notifications.weeklyDigest}
                    onChange={(v) => updateNotifications('weeklyDigest', v)}
                    label="Weekly digest"
                  />
                </SettingRow>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to defaults
          </button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            loading={saving}
            loadingText="Saving..."
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200',
              hasChanges
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            )}
          >
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
