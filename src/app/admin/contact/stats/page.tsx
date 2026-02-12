'use client';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { useAdminContactStats } from '@/hooks/api';

export default function AdminContactStatsPage() {
  const { data, isLoading, isError } = useAdminContactStats();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Contact Stats</h1>
        <Card className="p-6">
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="text-red-600">Failed to load stats</div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(data?.data, null, 2)}
            </pre>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
