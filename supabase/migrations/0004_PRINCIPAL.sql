-- widen code_changes.action to allow 'made_principal' for capturing
-- principal-dx/px reassignment. one made_principal row per (case_id, kind)
-- is the app invariant (not enforced at DB level — trust the UI for v1).
--
-- reassignment convention: pre[0] of diagnoses_pre / procedures_pre is
-- the pre-audit principal. a made_principal row means the post-audit
-- principal is the referenced code; the previous principal is implicitly
-- demoted. no row is written when the post-audit principal is unchanged.

alter table code_changes
  drop constraint code_changes_action_check;

alter table code_changes
  add constraint code_changes_action_check
  check (action in ('added', 'removed', 'made_principal'));
