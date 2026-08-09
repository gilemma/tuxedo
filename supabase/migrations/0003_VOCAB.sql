-- pin case-status and drg-change-reason vocabularies via check constraints.
-- both existing rows already satisfy: status defaults to 'in_review'; no UI
-- has ever written drg_change_reason, so every row is currently null.
-- widen the vocab in later migrations (drop-constraint + re-add) as new
-- statuses (e.g. 'awaiting_coder' in phase 5) come online.

alter table cases
  add constraint cases_status_check
  check (status in ('in_review', 'closed'));

alter table cases
  add constraint cases_drg_change_reason_check
  check (
    drg_change_reason is null
    or drg_change_reason in (
      'adrg_change',
      'split_change',
      'px_change_no_drg_shift',
      'dx_change_only_no_drg_shift',
      'no_change'
    )
  );
