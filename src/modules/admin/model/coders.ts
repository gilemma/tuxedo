import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Coder, CoderInsert, CoderUpdate } from '../../../supabase/types';

const CODERS_KEY = ['coders'] as const;

export function useCoders() {
  return useQuery<Coder[]>({
    queryKey: CODERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coders')
        .select('*')
        .order('active', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Coder[];
    },
  });
}

export function useActiveCoders() {
  return useQuery<Coder[]>({
    queryKey: [...CODERS_KEY, 'active'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coders')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Coder[];
    },
  });
}

export function useCreateCoder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CoderInsert) => {
      const { data, error } = await supabase
        .from('coders')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Coder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CODERS_KEY }),
  });
}

export function useUpdateCoder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: CoderUpdate }) => {
      const { data, error } = await supabase
        .from('coders')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Coder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CODERS_KEY }),
  });
}

export function useSetCoderActive() {
  const update = useUpdateCoder();
  return {
    ...update,
    mutate: (args: { id: string; active: boolean }) =>
      update.mutate({ id: args.id, patch: { active: args.active } }),
    mutateAsync: (args: { id: string; active: boolean }) =>
      update.mutateAsync({ id: args.id, patch: { active: args.active } }),
  };
}
