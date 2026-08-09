import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { CodeChange, CodeChangeInsert } from '../../../supabase/types';

const codeChangesKey = (caseId: string) => ['code_changes', caseId] as const;

export function useCodeChanges(caseId: string | undefined) {
  return useQuery<CodeChange[]>({
    queryKey: codeChangesKey(caseId ?? ''),
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('code_changes')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CodeChange[];
    },
  });
}

// Replace-all mutation: delete every existing code_change for the case,
// then insert the new set. Single-user app — no cross-writer race to worry
// about. Not atomic; if the insert fails after the delete, the case is
// left with no code_changes and the user needs to save again.
export function useReplaceCodeChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      changes,
    }: {
      caseId: string;
      changes: Omit<CodeChangeInsert, 'case_id'>[];
    }) => {
      const { error: delErr } = await supabase
        .from('code_changes')
        .delete()
        .eq('case_id', caseId);
      if (delErr) throw delErr;

      if (changes.length === 0) return [] as CodeChange[];

      const rows: CodeChangeInsert[] = changes.map((c) => ({ ...c, case_id: caseId }));
      const { data, error: insErr } = await supabase
        .from('code_changes')
        .insert(rows)
        .select();
      if (insErr) throw insErr;
      return data as CodeChange[];
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: codeChangesKey(vars.caseId) });
    },
  });
}
