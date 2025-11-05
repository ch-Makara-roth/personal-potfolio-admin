'use client';

import React from 'react';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { DashboardStats } from '@/components/features/dashboard';

export default function DashboardStatsDemo() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Statistics Demo
            </h1>
            <p className="mt-2 text-gray-600">
              Demonstration of the StatsCard component with real-time data
              integration
            </p>
          </div>

          {/* Main dashboard stats */}
          <div className="mb-12">
            <DashboardStats
              showRefreshButton={true}
              autoRefresh={true}
              refreshInterval={10000} // 10 seconds for demo
              useMockData={true}
            />
          </div>

          {/* Additional examples */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Without Auto-refresh
              </h2>
              <DashboardStats
                showRefreshButton={true}
                autoRefresh={false}
                useMockData={true}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Minimal Version (No Refresh Button)
              </h2>
              <DashboardStats
                showRefreshButton={false}
                autoRefresh={false}
                useMockData={true}
              />
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Features Demonstrated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  StatsCard Component
                </h4>
                <ul className="space-y-1">
                  <li>• Purple borders and gradients</li>
                  <li>• Icon integration (document, circle, check)</li>
                  <li>• Optional trend line visualization</li>
                  <li>• Responsive sizing and typography</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Data Integration
                </h4>
                <ul className="space-y-1">
                  <li>• TanStack Query for server state</li>
                  <li>• Real-time data refresh</li>
                  <li>• Loading and error states</li>
                  <li>• Data transformation utilities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
