import { describe, it, expect } from 'vitest';
import { generateWorkshopPdfFilename, DEFAULT_PDF_EXPORT_FILENAME } from './pdfFilename';

describe('generateWorkshopPdfFilename', () => {
  it('converts normal design name into slugified workshop plan filename', () => {
    expect(generateWorkshopPdfFilename('Workshop Toolbox')).toBe(
      'workshop-toolbox-workshop-plan.pdf',
    );
  });

  it('handles lowercase, spaces, punctuation and special characters', () => {
    expect(generateWorkshopPdfFilename('My #1 Master Toolbox (v2.0)!')).toBe(
      'my-1-master-toolbox-v20-workshop-plan.pdf',
    );
  });

  it('collapses multiple spaces and dashes', () => {
    expect(generateWorkshopPdfFilename('  Pine --- Tool Box   ')).toBe(
      'pine-tool-box-workshop-plan.pdf',
    );
  });

  it('falls back to default filename if name contains only invalid characters or whitespace', () => {
    expect(generateWorkshopPdfFilename('')).toBe(DEFAULT_PDF_EXPORT_FILENAME);
    expect(generateWorkshopPdfFilename('    ')).toBe(DEFAULT_PDF_EXPORT_FILENAME);
    expect(generateWorkshopPdfFilename('!@#$%^&*()')).toBe(DEFAULT_PDF_EXPORT_FILENAME);
    expect(generateWorkshopPdfFilename('---')).toBe(DEFAULT_PDF_EXPORT_FILENAME);
  });
});
