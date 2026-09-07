export const DEFAULT_PDF_EXPORT_FILENAME = 'japanese-toolbox-workshop-plan.pdf';

/**
 * Generates a clean, filesystem-safe filename for an exported workshop PDF.
 *
 * Rules:
 * - Lowercase
 * - Spaces converted to hyphens
 * - Unsafe characters removed
 * - Consecutive hyphens collapsed
 * - Leading/trailing hyphens trimmed
 * - Always ends in `-workshop-plan.pdf`
 * - Falls back to DEFAULT_PDF_EXPORT_FILENAME if slug is empty
 */
export function generateWorkshopPdfFilename(designName: string): string {
  const slug = designName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    return DEFAULT_PDF_EXPORT_FILENAME;
  }

  return `${slug}-workshop-plan.pdf`;
}
