import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';

export type CaseStats = {
  open: number;
  closed: number;
  thisWeek: number;
};

export function useCaseStats() {
  return useQuery<CaseStats>({
    queryKey: ['cases', 'stats'],
    queryFn: async () => {
      const weekStart = mondayLocalISO(new Date());
      const [open, closed, thisWeek] = await Promise.all([
        supabase.from('cases').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('cases').select('*', { count: 'exact', head: true }).gte('audit_date', weekStart),
      ]);
      if (open.error) throw open.error;
      if (closed.error) throw closed.error;
      if (thisWeek.error) throw thisWeek.error;
      return {
        open: open.count ?? 0,
        closed: closed.count ?? 0,
        thisWeek: thisWeek.count ?? 0,
      };
    },
  });
}

function mondayLocalISO(now: Date): string {
  const d = new Date(now);
  const dow = d.getDay();
  const daysBack = (dow + 6) % 7;
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
