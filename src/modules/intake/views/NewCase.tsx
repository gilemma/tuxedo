import { useState, type FormEvent } from 'react';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { useActiveCoders, useFunds } from '../../admin';
import type { CodeEntry } from '../../../supabase/types';
import { useCreateCase } from '../model/cases';
import { CodeListEditor } from './CodeListEditor';

const EMPTY_CODES: CodeEntry[] = [];

export function NewCase() {
  const coders = useActiveCoders();
  const funds = useFunds();
  const create = useCreateCase();

  const [coderId, setCoderId] = useState('');
  const [fundId, setFundId] = useState('');
  const [mrn, setMrn] = useState('');
  const [episode, setEpisode] = useState('');
  const [admitDate, setAdmitDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [drgVersion, setDrgVersion] = useState('');
  const [drgPre, setDrgPre] = useState('');
  const [diagnoses, setDiagnoses] = useState<CodeEntry[]>(EMPTY_CODES);
  const [procedures, setProcedures] = useState<CodeEntry[]>(EMPTY_CODES);

  const [error, setError] = useState<string | null>(null);
  const [lastCreatedMrn, setLastCreatedMrn] = useState<string | null>(null);

  const reset = () => {
    setCoderId('');
    setFundId('');
    setMrn('');
    setEpisode('');
    setAdmitDate('');
    setDischargeDate('');
    setDrgVersion('');
    setDrgPre('');
    setDiagnoses(EMPTY_CODES);
    setProcedures(EMPTY_CODES);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coderId) return setError('Coder is required.');
    if (!fundId) return setError('Fund is required.');
    if (!mrn.trim()) return setError('MRN is required.');
    if (!episode.trim()) return setError('Episode is required.');
    if (!admitDate) return setError('Admit date is required.');
    if (!dischargeDate) return setError('Discharge date is required.');
    if (dischargeDate < admitDate) return setError('Discharge date cannot be before admit date.');
    if (!drgVersion.trim()) return setError('DRG version is required.');
    if (!drgPre.trim()) return setError('Pre-audit DRG is required.');

    const cleanCodes = (rows: CodeEntry[]) =>
      rows
        .map((r) => ({ code: r.code.trim(), description: r.description.trim() }))
        .filter((r) => r.code !== '');

    try {
      const created = await create.mutateAsync({
        coder_id: coderId,
        fund_id: fundId,
        mrn: mrn.trim(),
        episode: episode.trim(),
        admit_date: admitDate,
        discharge_date: dischargeDate,
        drg_version: drgVersion.trim(),
        drg_pre: drgPre.trim(),
        diagnoses_pre: cleanCodes(diagnoses),
        procedures_pre: cleanCodes(procedures),
      });
      setLastCreatedMrn(created.mrn);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const fundsMissing = funds.data && funds.data.length === 0;
  const codersMissing = coders.data && coders.data.length === 0;

  return (
    <section
      style={{
        maxWidth: 640,
        margin: '2rem auto',
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 4,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <header
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--rule)',
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
        }}
      >
        New audit case
      </header>

      {lastCreatedMrn && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule)',
            background: 'var(--highlight)',
            color: 'var(--ink-2)',
            fontSize: '0.9rem',
          }}
        >
          Case created for MRN <strong>{lastCreatedMrn}</strong>. Case detail lands in Phase 2 step 6.
        </div>
      )}

      <form onSubmit={onSubmit} style={{ padding: '12px 16px' }}>
        <SelectRow
          label="Coder"
          value={coderId}
          onChange={setCoderId}
          disabled={coders.isPending}
          options={
            coders.data?.map((c) => ({ value: c.id, label: c.name })) ?? []
          }
          placeholder={coders.isPending ? 'Loading…' : 'Select a coder'}
        />
        {codersMissing && (
          <p style={{ color: 'var(--audit-red)', fontSize: '0.85rem', marginTop: 4 }}>
            No active coders. Add one in <em>Coders</em> first.
          </p>
        )}

        <SelectRow
          label="Fund"
          value={fundId}
          onChange={setFundId}
          disabled={funds.isPending}
          options={funds.data?.map((f) => ({ value: f.id, label: f.name })) ?? []}
          placeholder={funds.isPending ? 'Loading…' : 'Select a fund'}
        />
        {fundsMissing && (
          <p style={{ color: 'var(--audit-red)', fontSize: '0.85rem', marginTop: 4 }}>
            No funds seeded. Add rows to <code>funds</code> via the Supabase SQL editor.
          </p>
        )}

        <Field label="MRN" value={mrn} onChange={(e) => setMrn(e.target.value)} required />
        <Field label="Episode" value={episode} onChange={(e) => setEpisode(e.target.value)} required />
        <Field
          label="Admit"
          type="date"
          value={admitDate}
          onChange={(e) => setAdmitDate(e.target.value)}
          required
        />
        <Field
          label="Discharge"
          type="date"
          value={dischargeDate}
          onChange={(e) => setDischargeDate(e.target.value)}
          required
        />
        <Field
          label="DRG version"
          value={drgVersion}
          onChange={(e) => setDrgVersion(e.target.value)}
          placeholder="e.g. v11.0"
          required
        />
        <Field
          label="Pre-audit DRG"
          value={drgPre}
          onChange={(e) => setDrgPre(e.target.value)}
          placeholder="e.g. F62A"
          required
        />

        <div style={{ height: 1, background: 'var(--rule)', margin: '16px 0 4px' }} />
        <CodeListEditor label="Diagnoses" value={diagnoses} onChange={setDiagnoses} />
        <CodeListEditor label="Procedures" value={procedures} onChange={setProcedures} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save case'}
          </Button>
        </div>
        {error && <p style={{ color: 'var(--audit-red)', marginTop: 8 }}>{error}</p>}
      </form>
    </section>
  );
}

type Option = { value: string; label: string };

function SelectRow({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}) {
  const id = `s-${label.toLowerCase()}`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <label htmlFor={id} style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        style={{
          background: 'var(--paper-inset)',
          color: 'var(--ink)',
          border: '1px solid var(--rule)',
          borderRadius: 3,
          padding: '6px 8px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
