import { describe, expect, it } from 'vitest';
import { isSafeUrl, parseLinks, splitTextWithUrls } from './links';

describe('parseLinks', () => {
  it('turns each line into one link and uses the label from "Label | URL"', () => {
    const result = parseLinks(
      'Brief | https://docs.google.com/doc/1\nhttps://www.figma.com/file/2\n\n',
    );
    expect(result).toEqual({
      ok: true,
      links: [
        { label: 'Brief', url: 'https://docs.google.com/doc/1' },
        { label: 'figma.com', url: 'https://www.figma.com/file/2' },
      ],
    });
  });

  it.each([
    'javascript:alert(1)',
    'ftp://files.example.com',
    'www.example.com',
    'Label | mailto:a@b.com',
  ])('rejects %s with a message naming the line', (line) => {
    const result = parseLinks(`https://ok.example.com\n${line}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Line 2 .*http:\/\/ or https:\/\//);
  });

  it('accepts an empty field', () => {
    expect(parseLinks('')).toEqual({ ok: true, links: [] });
  });
});

describe('isSafeUrl', () => {
  it('only allows http and https', () => {
    expect(isSafeUrl('http://a.com')).toBe(true);
    expect(isSafeUrl('HTTPS://a.com/x?y=1')).toBe(true);
    expect(isSafeUrl('data:text/html,hi')).toBe(false);
    expect(isSafeUrl('https://')).toBe(false);
  });
});

describe('splitTextWithUrls', () => {
  it('finds URLs in free text and leaves trailing punctuation as text', () => {
    expect(splitTextWithUrls('See https://a.com/x. Then call.')).toEqual([
      { kind: 'text', text: 'See ' },
      { kind: 'link', url: 'https://a.com/x' },
      { kind: 'text', text: '. Then call.' },
    ]);
  });

  it('does not treat javascript: as a link', () => {
    expect(splitTextWithUrls('javascript:alert(1)')).toEqual([
      { kind: 'text', text: 'javascript:alert(1)' },
    ]);
  });
});
