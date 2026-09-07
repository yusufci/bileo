/**
 * SERVER ONLY. Minimal schema.org microdata reader for landing pages that mark trips up with
 * `itemscope` / `itemprop` attributes (obilet, biletall). Regex based on purpose: no DOM dependency,
 * and the pages in question keep one item per `<li itemscope itemtype="...">` block.
 */
import { decodeEntities } from '../turna/parse';

/** Outer HTML of every element whose `itemtype` ends with `/{typeName}` (e.g. `BusTrip`). */
export function extractItemscopes(html: string, typeName: string): string[] {
  const out: string[] = [];
  const open = new RegExp(`<(li|div|article|section)\\b[^>]*\\bitemtype="[^"]*/${typeName}"[^>]*>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = open.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const end = findClosing(html, match.index + match[0].length, tag);
    if (end === -1) break;
    out.push(html.slice(match.index, end));
    open.lastIndex = end;
  }
  return out;
}

/** Index just past the closing tag that balances the element opened before `from`. */
function findClosing(html: string, from: number, tag: string): number {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = from;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] === '/') {
      depth -= 1;
      if (depth === 0) return m.index + m[0].length;
    } else if (!m[0].endsWith('/>')) {
      depth += 1;
    }
  }
  return -1;
}

function stripTags(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Value of the first `itemprop="name"` inside `block`: the `content` attribute when present (meta,
 * data-* style), else the element's text with tags stripped. Null when the property is absent.
 */
export function itemprop(block: string, name: string): string | null {
  const re = new RegExp(`<([a-z0-9]+)\\b([^>]*\\bitemprop="${name}"[^>]*)>`, 'i');
  const m = re.exec(block);
  if (!m) return null;
  const attrs = m[2];
  const content = /\bcontent="([^"]*)"/i.exec(attrs);
  if (content) return decodeEntities(content[1]).trim();
  const tag = m[1].toLowerCase();
  const start = m.index + m[0].length;
  if (m[0].endsWith('/>') || tag === 'meta' || tag === 'img' || tag === 'input') return null;
  const end = findClosing(block, start, tag);
  const text = stripTags(block.slice(start, end === -1 ? undefined : end - (`</${tag}>`.length)));
  return text || null;
}

/** Outer HTML of the first nested itemscope carrying `itemprop="name"`, or null. */
export function nestedScope(block: string, name: string): string | null {
  const re = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bitemprop="${name}"[^>]*\\bitemscope\\b[^>]*>|<([a-z0-9]+)\\b[^>]*\\bitemscope\\b[^>]*\\bitemprop="${name}"[^>]*>`, 'i');
  const m = re.exec(block);
  if (!m) return null;
  const tag = (m[1] ?? m[2]).toLowerCase();
  const end = findClosing(block, m.index + m[0].length, tag);
  return end === -1 ? null : block.slice(m.index, end);
}

/** First `attr="..."` value inside `block`, entity-decoded; null when absent. */
export function attrValue(block: string, attr: string): string | null {
  const m = new RegExp(`\\b${attr}="([^"]*)"`, 'i').exec(block);
  return m ? decodeEntities(m[1]).trim() : null;
}

/** "779,0000" / "1.465,99" / "560 TL" -> number; null when no digits. */
export function parseTrPrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  // Turkish notation: '.' thousands, ',' decimals. A lone '.' followed by 3 digits is a thousands separator.
  const normalised = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/\.(?=\d{3}(\D|$))/g, '');
  const value = Number(normalised);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

/** Minutes between two HH:MM clocks, wrapping past midnight; null when either clock is malformed. */
export function clockDiffMinutes(departure: string | null, arrival: string | null): number | null {
  const parse = (clock: string | null): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec((clock ?? '').trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h < 24 && min < 60 ? h * 60 + min : null;
  };
  const a = parse(departure);
  const b = parse(arrival);
  if (a === null || b === null) return null;
  return b >= a ? b - a : b + 24 * 60 - a;
}
