import { describe, expect, it } from 'vitest';
import { accessDeniedPage } from './accessPages';

describe('accessDeniedPage', () => {
  it('escapes the email so it cannot inject markup', () => {
    const html = accessDeniedPage('<script>alert(1)</script>@example.com');
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('&lt;script&gt;');
  });
});
