import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { CaseWithRefs } from '../../../supabase/types';

export type CaseFilters = {
  search: string;
  status: string;
  coderId: string;
  from: string;
  to: string;
};

const EMPTY: CaseFilters = { search: '', status: '', coderId: '', from: '', to: '' };

export function useCasesList(filters: CaseFilters = EMPTY) {
  return useQuery<CaseWithRefs[]>({
    queryKey: ['cases', 'list', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from('cases')
        .select('*, coder:coders(name), fund:funds(name)')
        .order('audit_date', { ascending: false, nullsFirst: false });

      if (filters.status) q = q.eq('status', filters.status);
      if (filters.coderId) q = q.eq('coder_id', filters.coderId);
      if (filters.from) q = q.gte('audit_date', filters.from);
      if (filters.to) q = q.lte('audit_date', filters.to);
      if (filters.search.trim()) {
        const s = filters.search.trim().replace(/[%_,()]/g, '');
        q = q.or(`mrn.ilike.%${s}%,episode.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as CaseWithRefs[];
    },
  });
}
