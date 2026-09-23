import { describe, expect, it } from 'vitest';
import { contrastRatio, pillColors } from './color';

describe('pillColors', () => {
  it.each(['#2A0CD0', '#1A524E', '#FFD400', '#FFFFFF', '#00FF00', '#6B675F'])(
    'gives %s text that meets WCAG AA on its tint',
    (hex) => {
      const { background, text } = pillColors(hex);
      expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
