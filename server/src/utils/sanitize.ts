/**
 * ANSI escape sequence stripper.
 *
 * Prisma (via chalk) colorizes its error messages with ANSI codes (e.g.
 * \u001b[31m, \u001b[1m, \u001b[22m). When those strings flow into JSON
 * responses or winston logs they get serialized as hard-to-read escaped
 * garbage. We strip them centrally instead of fixing each call site.
 */

const ANSI_ESCAPE_RE =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_ESCAPE_RE, '');
}

/**
 * Recursively strip ANSI escapes from every string in a JSON-serializable value
 * (used for winston metadata objects which can be arbitrarily nested).
 */
export function stripAnsiDeep(value: unknown): unknown {
  if (typeof value === 'string') return stripAnsi(value);
  if (Array.isArray(value)) return value.map((v) => stripAnsiDeep(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripAnsiDeep(val);
    }
    return out;
  }
  return value;
}