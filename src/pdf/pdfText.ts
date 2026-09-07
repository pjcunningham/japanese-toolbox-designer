import type { PDFFont } from 'pdf-lib';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Converts Unicode text containing symbols, Greek letters, math characters,
 * or smart punctuation into safe ASCII / standard-font WinAnsi compatible text.
 */
export function toPdfSafeText(text: string): string {
  if (!text) return '';
  return (
    text
      // Greek letters
      .replace(/α|Α/g, 'alpha')
      .replace(/β|Β/g, 'beta')
      .replace(/γ|Γ/g, 'gamma')
      .replace(/δ|Δ/g, 'delta')
      .replace(/θ|Θ/g, 'theta')
      // Math and symbols
      .replace(/×/g, 'x')
      .replace(/÷/g, '/')
      .replace(/°/g, ' deg')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/↔/g, '<->')
      .replace(/↑/g, '^')
      .replace(/↓/g, 'v')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/≠/g, '!=')
      .replace(/±/g, '+/-')
      .replace(/≈/g, '~')
      // Quotes and dashes
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—−]/g, '-')
      .replace(/…/g, '...')
      .replace(/•/g, '-')
      // Clean up degree spacing like 2 deg
      .replace(/(\d+)\s*deg/g, '$1 deg')
      // Collapse any repeated spaces
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/**
 * Formats a Date in clean UK-friendly style (e.g. 7 September 2026).
 */
export function formatGeneratedDate(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Wraps text into multiple lines fitting within maxWidth using actual font metrics.
 */
export function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const safeText = toPdfSafeText(text);
  if (!safeText) return [''];

  const rawParagraphs = safeText.split('\n');
  const resultLines: string[] = [];

  for (const paragraph of rawParagraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) {
      resultLines.push('');
      continue;
    }

    const words = trimmedPara.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else {
        const candidate = `${currentLine} ${word}`;
        const width = font.widthOfTextAtSize(candidate, fontSize);
        if (width <= maxWidth) {
          currentLine = candidate;
        } else {
          resultLines.push(currentLine);
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      resultLines.push(currentLine);
    }
  }

  return resultLines.length > 0 ? resultLines : [''];
}
