import { describe, it, expect } from 'vitest';
import { render, TOKENS, type RenderContext } from './render';

const fullCtx: RenderContext = {
  case: {
    mrn: 'MRN-42',
    episode: 'E-9',
    drg_pre: '470',
    drg_post: '469',
  },
  coder: { name: 'Alex Rivera' },
  change: {
    code: 'J96.01',
    note: 'documented in progress note',
    action: 'added',
    kind: 'dx',
  },
};

describe('render', () => {
  it('returns empty string unchanged', () => {
    expect(render('', fullCtx)).toBe('');
  });

  it('passes tokenless text through', () => {
    expect(render('hello world', fullCtx)).toBe('hello world');
  });

  it('substitutes a simple token', () => {
    expect(render('MRN: {{case.mrn}}', fullCtx)).toBe('MRN: MRN-42');
  });

  it('substitutes multiple tokens', () => {
    expect(render('{{coder.first_name}} — {{case.drg_pre}}→{{case.drg_post}}', fullCtx))
      .toBe('Alex — 470→469');
  });

  it('is whitespace-tolerant inside braces', () => {
    expect(render('{{  case.mrn  }}', fullCtx)).toBe('MRN-42');
  });

  it('marks unknown tokens with a visible {{?...}} marker', () => {
    expect(render('{{case.nonsense}}', fullCtx)).toBe('{{?case.nonsense}}');
  });

  it('marks known tokens as {{?...}} when their context branch is missing', () => {
    expect(render('{{coder.name}}', { case: fullCtx.case })).toBe('{{?coder.name}}');
  });

  it('renders nullable fields as empty string when the branch is present', () => {
    const ctx: RenderContext = {
      case: { ...fullCtx.case!, drg_post: null },
    };
    expect(render('post={{case.drg_post}}', ctx)).toBe('post=');
  });

  it('renders change.note as empty string when null', () => {
    const ctx: RenderContext = {
      change: { ...fullCtx.change!, note: null },
    };
    expect(render('[{{change.note}}]', ctx)).toBe('[]');
  });

  it('derives coder.first_name from coder.name', () => {
    expect(render('{{coder.first_name}}', { coder: { name: 'Alex Rivera' } })).toBe('Alex');
  });

  it('coder.first_name returns whole name when no space', () => {
    expect(render('{{coder.first_name}}', { coder: { name: 'Cher' } })).toBe('Cher');
  });

  it('coder.first_name trims leading whitespace', () => {
    expect(render('{{coder.first_name}}', { coder: { name: '  Alex Rivera' } })).toBe('Alex');
  });

  it('leaves malformed braces untouched', () => {
    expect(render('{{}} and {{ }}', fullCtx)).toBe('{{}} and {{ }}');
  });

  it('marks a bare identifier (no namespace.field) as unknown', () => {
    expect(render('{{orphan}}', fullCtx)).toBe('{{?orphan}}');
  });

  it('marks over-nested identifiers as unknown', () => {
    expect(render('{{a.b.c}}', fullCtx)).toBe('{{?a.b.c}}');
  });

  it('resolves the same token twice', () => {
    expect(render('{{case.mrn}} and {{case.mrn}}', fullCtx)).toBe('MRN-42 and MRN-42');
  });

  it('resolves adjacent tokens', () => {
    expect(render('{{case.drg_pre}}{{case.drg_post}}', fullCtx)).toBe('470469');
  });

  it('resolves every token in the vocabulary end-to-end', () => {
    const body = TOKENS.map((t) => `${t}={{${t}}}`).join('|');
    const out = render(body, fullCtx);
    expect(out).not.toContain('{{?');
    for (const t of TOKENS) {
      expect(out).toContain(`${t}=`);
    }
  });
});
