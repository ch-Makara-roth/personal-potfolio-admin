'use client';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useParams } from 'next/navigation';
import { useAdminContact, useContactActions } from '@/hooks/api';

export default function AdminContactDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading, isError } = useAdminContact(id);
  const { markRead, markReplied, archive } = useContactActions();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Message Detail</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => id && markRead.mutate(id)}
            >
              Mark Read
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => id && markReplied.mutate({ id })}
            >
              Mark Replied
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => id && archive.mutate(id)}
            >
              Archive
            </Button>
          </div>
        </div>

        <Card className="p-6">
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="text-red-600">Failed to load message</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="font-medium">{data?.data?.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium">{data?.data?.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-medium">{data?.data?.status}</div>
                </div>
                {data?.data?.phone && (
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium">{data?.data?.phone}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500">Subject</div>
                <div className="font-medium">{data?.data?.subject}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Message</div>
                <div className="whitespace-pre-wrap">{data?.data?.message}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
