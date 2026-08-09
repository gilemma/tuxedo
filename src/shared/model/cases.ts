import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase/client';
import type { Case, CaseUpdate, CaseWithRefs } from '../../supabase/types';

const CASES_KEY = ['cases'] as const;
const caseKey = (id: string) => ['case', id] as const;

export function useCase(id: string | undefined) {
  return useQuery<CaseWithRefs>({
    queryKey: caseKey(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*, coder:coders(name), fund:funds(name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as CaseWithRefs;
    },
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: CaseUpdate }) => {
      const { data, error } = await supabase
        .from('cases')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Case;
    },
    onSuccess: (_row, vars) => {
      qc.invalidateQueries({ queryKey: CASES_KEY });
      qc.invalidateQueries({ queryKey: caseKey(vars.id) });
    },
  });
}
