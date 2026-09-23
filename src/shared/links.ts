export interface TaskLink {
  label: string;
  url: string;
}

export type LinkParseResult = { ok: true; links: TaskLink[] } | { ok: false; message: string };

const SAFE_URL = /^https?:\/\/[^\s/?#]+[^\s]*$/i;
const URL_IN_TEXT = /(https?:\/\/[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

export function isSafeUrl(value: string): boolean {
  return SAFE_URL.test(value.trim());
}

export function siteName(url: string): string {
  const host = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0] ?? url;
  return host.replace(/^www\./i, '');
}

/** One link per non-blank line, optionally written as `Label | URL`. */
export function parseLinks(text: string): LinkParseResult {
  const links: TaskLink[] = [];
  const lines = text.split(/\r?\n/);
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const separator = line.lastIndexOf('|');
    const url = (separator >= 0 ? line.slice(separator + 1) : line).trim();
    const label = separator >= 0 ? line.slice(0, separator).trim() : '';
    if (!isSafeUrl(url)) {
      return {
        ok: false,
        message: `Line ${index + 1} of Links is not a web link. Links must start with http:// or https://.`,
      };
    }
    links.push({ label: label || siteName(url), url });
  }
  return { ok: true, links };
}

export type TextPart = { kind: 'text'; text: string } | { kind: 'link'; url: string };

/** Splits free text so URLs can be rendered as links and everything else as plain text. */
export function splitTextWithUrls(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const start = match.index;
    const url = match[0].replace(TRAILING_PUNCTUATION, '');
    if (start > cursor) parts.push({ kind: 'text', text: text.slice(cursor, start) });
    parts.push({ kind: 'link', url });
    cursor = start + url.length;
  }
  if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) });
  return parts;
}
