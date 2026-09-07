import type { UnitSystem } from './design';

/**
 * Exact standard conversion factor: 1 inch = 25.4 mm.
 */
export const MM_PER_INCH = 25.4;

export type DimensionParseErrorCode =
  | 'EMPTY_INPUT'
  | 'INVALID_FORMAT'
  | 'NON_POSITIVE_VALUE'
  | 'NON_INTEGER_METRIC'
  | 'INVALID_FRACTION_DENOMINATOR'
  | 'IMPROPER_FRACTION'
  | 'FEET_NOT_SUPPORTED';

export type DimensionParseResult =
  { ok: true; millimetres: number } | { ok: false; error: string; code: DimensionParseErrorCode };

export interface DimensionFormatOptions {
  includeUnit?: boolean;
}

export interface SimplifiedFraction {
  numerator: number;
  denominator: number;
}

/**
 * Cleans up binary floating-point representation artifacts to standard precision.
 */
export function roundToPrecision(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Converts inches to millimetres using the exact conversion factor.
 */
export function inchesToMillimetres(inches: number): number {
  return roundToPrecision(inches * MM_PER_INCH);
}

/**
 * Converts millimetres to inches using the exact conversion factor.
 */
export function millimetresToInches(millimetres: number): number {
  return roundToPrecision(millimetres / MM_PER_INCH);
}

/**
 * Simplifies a fraction with a power-of-two denominator (up to 16).
 */
export function simplifySixteenthsFraction(numerator: number): SimplifiedFraction {
  if (numerator <= 0) {
    return { numerator: 0, denominator: 1 };
  }
  if (numerator % 8 === 0) {
    return { numerator: numerator / 8, denominator: 2 };
  }
  if (numerator % 4 === 0) {
    return { numerator: numerator / 4, denominator: 4 };
  }
  if (numerator % 2 === 0) {
    return { numerator: numerator / 2, denominator: 8 };
  }
  return { numerator, denominator: 16 };
}

/**
 * Parses user input in metric units (millimetres).
 * V1 Rules:
 * - Dimensions are in whole millimetres only.
 * - Value must be strictly positive.
 * - Leading/trailing whitespace is ignored.
 */
export function parseMetricDimension(input: string): DimensionParseResult {
  const trimmed = input.trim();

  if (trimmed === '') {
    return {
      ok: false,
      error: 'Please enter a dimension.',
      code: 'EMPTY_INPUT',
    };
  }

  if (trimmed.includes("'")) {
    return {
      ok: false,
      error: 'Feet notation is not supported. Please enter millimetres.',
      code: 'FEET_NOT_SUPPORTED',
    };
  }

  if (trimmed.includes('.') || trimmed.includes(',')) {
    return {
      ok: false,
      error: 'Metric dimensions must be whole millimetres.',
      code: 'NON_INTEGER_METRIC',
    };
  }

  // Allow optional trailing "mm"
  const metricPattern = /^([+-]?\d+)(?:\s*mm)?$/i;
  const match = trimmed.match(metricPattern);

  if (!match || !match[1]) {
    return {
      ok: false,
      error: 'Invalid metric dimension. Enter a whole number of millimetres.',
      code: 'INVALID_FORMAT',
    };
  }

  const value = parseInt(match[1], 10);

  if (isNaN(value)) {
    return {
      ok: false,
      error: 'Invalid metric dimension. Enter a whole number of millimetres.',
      code: 'INVALID_FORMAT',
    };
  }

  if (value <= 0) {
    return {
      ok: false,
      error: 'Dimension must be a positive number.',
      code: 'NON_POSITIVE_VALUE',
    };
  }

  return {
    ok: true,
    millimetres: value,
  };
}

const ALLOWED_IMPERIAL_DENOMINATORS = new Set([2, 4, 8, 16]);

/**
 * Parses woodworking imperial input into canonical millimetres.
 * Supported syntaxes:
 * - Whole inches: 12, 12"
 * - Simple fractions: 1/2, 3/4, 15/16, 1/2"
 * - Mixed numbers: 12 1/2, 12 1/2", 12-1/2, 12-1/2"
 *
 * Rules:
 * - Denominators must be 2, 4, 8, or 16 (1/16" grid).
 * - Improper fractions (e.g. 17/16) are rejected.
 * - Feet notation (e.g. 2' 6") is rejected in V1.
 * - Values must be strictly positive.
 */
export function parseImperialDimension(input: string): DimensionParseResult {
  const trimmed = input.trim();

  if (trimmed === '') {
    return {
      ok: false,
      error: 'Please enter a dimension.',
      code: 'EMPTY_INPUT',
    };
  }

  if (trimmed.includes("'")) {
    return {
      ok: false,
      error: 'Feet notation is not supported. Please enter inches and fractions (e.g. 12 1/2").',
      code: 'FEET_NOT_SUPPORTED',
    };
  }

  if (trimmed.includes('.') || trimmed.includes(',')) {
    return {
      ok: false,
      error:
        'Decimal inches are not supported. Use whole inches or 1/16" fractions (e.g. 12 1/2").',
      code: 'INVALID_FORMAT',
    };
  }

  // Strip optional trailing inch marks (" or in)
  const withoutUnit = trimmed.replace(/(?:\s*"|\s*in|")\s*$/i, '').trim();

  if (withoutUnit === '') {
    return {
      ok: false,
      error: 'Please enter a dimension.',
      code: 'EMPTY_INPUT',
    };
  }

  // 1. Whole number check: e.g. "12"
  const wholeOnlyMatch = withoutUnit.match(/^([+-]?\d+)$/);
  if (wholeOnlyMatch && wholeOnlyMatch[1] !== undefined) {
    const whole = parseInt(wholeOnlyMatch[1], 10);
    if (whole <= 0) {
      return {
        ok: false,
        error: 'Dimension must be a positive number.',
        code: 'NON_POSITIVE_VALUE',
      };
    }
    return {
      ok: true,
      millimetres: inchesToMillimetres(whole),
    };
  }

  // 2. Simple fraction check: e.g. "3/4"
  const fractionOnlyMatch = withoutUnit.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (
    fractionOnlyMatch &&
    fractionOnlyMatch[1] !== undefined &&
    fractionOnlyMatch[2] !== undefined
  ) {
    const num = parseInt(fractionOnlyMatch[1], 10);
    const den = parseInt(fractionOnlyMatch[2], 10);

    if (!ALLOWED_IMPERIAL_DENOMINATORS.has(den)) {
      return {
        ok: false,
        error: 'Imperial fractions must use denominators of 2, 4, 8, or 16 (no finer than 1/16").',
        code: 'INVALID_FRACTION_DENOMINATOR',
      };
    }

    if (num <= 0) {
      return {
        ok: false,
        error: 'Dimension must be a positive number.',
        code: 'NON_POSITIVE_VALUE',
      };
    }

    if (num >= den) {
      return {
        ok: false,
        error: 'Improper fractions are not supported. Use mixed numbers (e.g. 1 1/16").',
        code: 'IMPROPER_FRACTION',
      };
    }

    const inches = num / den;
    return {
      ok: true,
      millimetres: inchesToMillimetres(inches),
    };
  }

  // 3. Mixed number check: e.g. "12 1/2", "12-1/2", "12 - 1/2"
  const mixedMatch = withoutUnit.match(/^([+-]?\d+)(?:\s+|\s*-\s*)([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (
    mixedMatch &&
    mixedMatch[1] !== undefined &&
    mixedMatch[2] !== undefined &&
    mixedMatch[3] !== undefined
  ) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);

    if (!ALLOWED_IMPERIAL_DENOMINATORS.has(den)) {
      return {
        ok: false,
        error: 'Imperial fractions must use denominators of 2, 4, 8, or 16 (no finer than 1/16").',
        code: 'INVALID_FRACTION_DENOMINATOR',
      };
    }

    if (whole < 0 || num <= 0) {
      return {
        ok: false,
        error: 'Dimension must be a positive number.',
        code: 'NON_POSITIVE_VALUE',
      };
    }

    if (num >= den) {
      return {
        ok: false,
        error:
          'Improper fractions are not supported in mixed numbers (e.g. use 13 1/16 instead of 12 17/16).',
        code: 'IMPROPER_FRACTION',
      };
    }

    const inches = whole + num / den;
    if (inches <= 0) {
      return {
        ok: false,
        error: 'Dimension must be a positive number.',
        code: 'NON_POSITIVE_VALUE',
      };
    }

    return {
      ok: true,
      millimetres: inchesToMillimetres(inches),
    };
  }

  return {
    ok: false,
    error:
      'Invalid imperial dimension. Enter whole inches (e.g. 12), fractions (e.g. 3/4), or mixed numbers (e.g. 12 1/2 or 12-1/2).',
    code: 'INVALID_FORMAT',
  };
}

/**
 * Dispatches parsing based on the specified unit system.
 */
export function parseDimension(input: string, unitSystem: UnitSystem): DimensionParseResult {
  return unitSystem === 'metric' ? parseMetricDimension(input) : parseImperialDimension(input);
}

/**
 * Formats a canonical millimetre dimension as a metric string rounded to the nearest whole millimetre.
 * Does not mutate or alter the input millimetres.
 */
export function formatMetricDimension(
  millimetres: number,
  options?: DimensionFormatOptions,
): string {
  const includeUnit = options?.includeUnit ?? true;
  const rounded = Math.round(millimetres);
  return includeUnit ? `${rounded} mm` : `${rounded}`;
}

/**
 * Formats a canonical millimetre dimension as imperial inches rounded to the nearest 1/16".
 * Simplifies fractions (e.g. 8/16 -> 1/2) and carries full fractions into whole inches.
 */
export function formatImperialDimension(
  millimetres: number,
  options?: DimensionFormatOptions,
): string {
  const includeUnit = options?.includeUnit ?? true;
  const unitSuffix = includeUnit ? '"' : '';

  const totalInches = millimetresToInches(millimetres);
  const totalSixteenths = Math.round(totalInches * 16);

  if (totalSixteenths <= 0) {
    return `0${unitSuffix}`;
  }

  const whole = Math.floor(totalSixteenths / 16);
  const remSixteenths = totalSixteenths % 16;

  if (remSixteenths === 0) {
    return `${whole}${unitSuffix}`;
  }

  const fraction = simplifySixteenthsFraction(remSixteenths);

  if (whole === 0) {
    return `${fraction.numerator}/${fraction.denominator}${unitSuffix}`;
  }

  return `${whole} ${fraction.numerator}/${fraction.denominator}${unitSuffix}`;
}

/**
 * Formats a canonical millimetre dimension according to the active unit system.
 */
export function formatDimension(
  millimetres: number,
  unitSystem: UnitSystem,
  options?: DimensionFormatOptions,
): string {
  return unitSystem === 'metric'
    ? formatMetricDimension(millimetres, options)
    : formatImperialDimension(millimetres, options);
}
