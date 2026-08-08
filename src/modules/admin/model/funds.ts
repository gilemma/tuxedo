import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Fund } from '../../../supabase/types';

const FUNDS_KEY = ['funds'] as const;

export function useFunds() {
  return useQuery<Fund[]>({
    queryKey: FUNDS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Fund[];
    },
  });
}
