import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { toPdfSafeText, formatGeneratedDate, wrapText } from './pdfText';

describe('pdfText helpers', () => {
  describe('toPdfSafeText', () => {
    it('converts Greek letters and degree symbols correctly', () => {
      expect(toPdfSafeText('α = 2°')).toBe('alpha = 2 deg');
      expect(toPdfSafeText('β = 10°')).toBe('beta = 10 deg');
    });

    it('converts multiplication symbols to x', () => {
      expect(toPdfSafeText('600 × 300 × 250 mm')).toBe('600 x 300 x 250 mm');
    });

    it('converts arrow symbols to ASCII arrows', () => {
      expect(toPdfSafeText('a → b')).toBe('a -> b');
      expect(toPdfSafeText('left ← right')).toBe('left <- right');
    });

    it('converts en-dash and em-dash to regular hyphen', () => {
      expect(toPdfSafeText('part A – part B — finished')).toBe('part A - part B - finished');
    });

    it('converts smart quotes to ASCII quotes', () => {
      expect(toPdfSafeText('“Smart quotes” and ‘single quotes’')).toBe(
        '"Smart quotes" and \'single quotes\'',
      );
    });

    it('handles empty or blank strings safely', () => {
      expect(toPdfSafeText('')).toBe('');
      expect(toPdfSafeText('   ')).toBe('');
    });
  });

  describe('formatGeneratedDate', () => {
    it('formats dates consistently in day month year format', () => {
      const testDate = new Date(2026, 8, 7); // September 7, 2026
      expect(formatGeneratedDate(testDate)).toBe('7 September 2026');
    });
  });

  describe('wrapText', () => {
    it('wraps long lines based on font width measurements', async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const text =
        'The locking wedge is tapered in plan and bevelled vertically so the profile is captured rather than relying on gravity.';

      const wrapped = wrapText(text, font, 10, 150);
      expect(wrapped.length).toBeGreaterThan(1);
      for (const line of wrapped) {
        expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(150);
      }
    });

    it('preserves single short line without unnecessary wrapping', async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const text = 'Short title';

      const wrapped = wrapText(text, font, 10, 300);
      expect(wrapped).toEqual(['Short title']);
    });
  });
});
