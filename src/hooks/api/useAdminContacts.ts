'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminContactApi } from '@/lib/api';
import type { ContactMessage, ContactQuery } from '@/types/api';

export const useAdminContacts = (query?: ContactQuery) => {
  return useQuery({
    queryKey: ['admin', 'contact', 'list', query],
    queryFn: async () => adminContactApi.getContacts(query),
  });
};

export const useAdminContact = (id?: string) => {
  return useQuery({
    queryKey: ['admin', 'contact', 'detail', id],
    queryFn: async () =>
      id ? adminContactApi.getContact(id) : Promise.reject(),
    enabled: !!id,
  });
};

export const useAdminContactStats = () => {
  return useQuery({
    queryKey: ['admin', 'contact', 'stats'],
    queryFn: async () => adminContactApi.getStats(),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactMessage> }) =>
      adminContactApi.updateContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'contact'] });
    },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminContactApi.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'contact'] });
    },
  });
};

export const useContactActions = () => {
  const qc = useQueryClient();
  const markRead = useMutation({
    mutationFn: (id: string) => adminContactApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contact'] }),
  });
  const markReplied = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminContactApi.markReplied(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contact'] }),
  });
  const archive = useMutation({
    mutationFn: (id: string) => adminContactApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contact'] }),
  });
  return { markRead, markReplied, archive };
};
