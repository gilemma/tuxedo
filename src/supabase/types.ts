// Hand-written for now. Replace with `supabase gen types typescript` when the
// schema stabilises past Phase 2.

export type Coder = {
  id: string;
  name: string;
  team: string | null;
  contact: string | null;
  active: boolean;
  created_at: string;
};

export type CoderInsert = {
  name: string;
  team?: string | null;
  contact?: string | null;
  active?: boolean;
};

export type CoderUpdate = Partial<CoderInsert>;

export type Fund = {
  id: string;
  name: string;
};

export type CodeEntry = {
  code: string;
  description: string;
};

export type Case = {
  id: string;
  coder_id: string;
  fund_id: string;
  mrn: string;
  episode: string;
  admit_date: string;
  discharge_date: string;
  coding_date: string | null;
  audit_date: string | null;
  drg_version: string;
  drg_pre: string;
  drg_post: string | null;
  drg_change_reason: DrgChangeReason | null;
  diagnoses_pre: CodeEntry[];
  procedures_pre: CodeEntry[];
  reimbursement_pre: number | null;
  reimbursement_post: number | null;
  impact_delta: number | null;
  impact_note: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
};

export type CaseInsert = {
  coder_id: string;
  fund_id: string;
  mrn: string;
  episode: string;
  admit_date: string;
  discharge_date: string;
  drg_version: string;
  drg_pre: string;
  diagnoses_pre?: CodeEntry[];
  procedures_pre?: CodeEntry[];
};

export type CaseUpdate = Partial<
  Omit<Case, 'id' | 'created_at' | 'updated_at' | 'impact_delta'>
>;

export type CaseWithRefs = Case & {
  coder: { name: string } | null;
  fund: { name: string } | null;
};

// Vocabularies pinned by 0003_VOCAB.sql. Keep in sync with the check
// constraints on cases.status and cases.drg_change_reason.
export const CASE_STATUSES = ['in_review', 'closed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const DRG_CHANGE_REASONS = [
  'adrg_change',
  'split_change',
  'px_change_no_drg_shift',
  'dx_change_only_no_drg_shift',
  'no_change',
] as const;
export type DrgChangeReason = (typeof DRG_CHANGE_REASONS)[number];

export type CodeChangeAction = 'added' | 'removed' | 'made_principal';

export type CodeChange = {
  id: string;
  case_id: string;
  kind: 'dx' | 'px';
  action: CodeChangeAction;
  code: string;
  note: string | null;
  created_at: string;
};

export type CodeChangeInsert = {
  case_id: string;
  kind: 'dx' | 'px';
  action: CodeChangeAction;
  code: string;
  note?: string | null;
};
