import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type {
  CodeChange,
  Template,
  TemplateInsert,
  TemplateUpdate,
} from '../../../supabase/types';

const TEMPLATES_KEY = ['templates'] as const;

export function useTemplates() {
  return useQuery<Template[]>({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Template[];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TemplateInsert) => {
      const { data, error } = await supabase
        .from('templates')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TemplateUpdate }) => {
      const merged = { ...patch, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('templates')
        .update(merged)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

// Preview support — narrow case rows for the case-picker dropdown, and the
// code_changes for whichever case is picked. Inline here rather than in
// shared/model because only the template editor consumes them right now.

export type PreviewCaseRow = {
  id: string;
  mrn: string;
  episode: string;
  drg_pre: string;
  drg_post: string | null;
  updated_at: string;
  coder: { name: string } | null;
};

export function useRecentPreviewCases(limit = 20) {
  return useQuery<PreviewCaseRow[]>({
    queryKey: ['templates', 'preview-cases', limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('id, mrn, episode, drg_pre, drg_post, updated_at, coder:coders(name)')
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as PreviewCaseRow[];
    },
  });
}

export function useCaseChanges(caseId: string | undefined) {
  return useQuery<CodeChange[]>({
    queryKey: ['templates', 'preview-changes', caseId ?? ''] as const,
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
