import type { Case, CodeChange, Coder } from '../../supabase/types';

export const TOKENS = [
  'case.mrn',
  'case.episode',
  'case.drg_pre',
  'case.drg_post',
  'coder.name',
  'coder.first_name',
  'change.code',
  'change.note',
  'change.action',
  'change.kind',
] as const;

export type Token = (typeof TOKENS)[number];

const VOCABULARY: ReadonlySet<string> = new Set(TOKENS);

export type RenderContext = {
  case?: Pick<Case, 'mrn' | 'episode' | 'drg_pre' | 'drg_post'>;
  coder?: Pick<Coder, 'name'>;
  change?: Pick<CodeChange, 'code' | 'note' | 'action' | 'kind'>;
};

const TOKEN_RE = /\{\{\s*([\w.]+)\s*\}\}/g;

export function render(template: string, ctx: RenderContext): string {
  return template.replace(TOKEN_RE, (_match, token: string) => {
    if (!VOCABULARY.has(token)) return `{{?${token}}}`;
    const value = resolve(token as Token, ctx);
    return value === undefined ? `{{?${token}}}` : value;
  });
}

function resolve(token: Token, ctx: RenderContext): string | undefined {
  switch (token) {
    case 'case.mrn':      return ctx.case?.mrn;
    case 'case.episode':  return ctx.case?.episode;
    case 'case.drg_pre':  return ctx.case?.drg_pre;
    case 'case.drg_post': return ctx.case ? (ctx.case.drg_post ?? '') : undefined;
    case 'coder.name':    return ctx.coder?.name;
    case 'coder.first_name':
      return ctx.coder ? firstName(ctx.coder.name) : undefined;
    case 'change.code':   return ctx.change?.code;
    case 'change.note':   return ctx.change ? (ctx.change.note ?? '') : undefined;
    case 'change.action': return ctx.change?.action;
    case 'change.kind':   return ctx.change?.kind;
  }
}

function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const space = trimmed.indexOf(' ');
  return space === -1 ? trimmed : trimmed.slice(0, space);
}
