import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Case, CaseInsert } from '../../../supabase/types';

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaseInsert) => {
      const { data, error } = await supabase
        .from('cases')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Case;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}
