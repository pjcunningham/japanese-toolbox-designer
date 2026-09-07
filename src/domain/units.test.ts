import { describe, it, expect } from 'vitest';
import {
  MM_PER_INCH,
  inchesToMillimetres,
  millimetresToInches,
  simplifySixteenthsFraction,
  parseMetricDimension,
  parseImperialDimension,
  parseDimension,
  formatMetricDimension,
  formatImperialDimension,
  formatDimension,
} from './units';

describe('Unit Conversions', () => {
  it('defines MM_PER_INCH as exactly 25.4', () => {
    expect(MM_PER_INCH).toBe(25.4);
  });

  it('converts common woodworking imperial inches to exact millimetres', () => {
    expect(inchesToMillimetres(1)).toBe(25.4);
    expect(inchesToMillimetres(1 / 2)).toBe(12.7);
    expect(inchesToMillimetres(1 / 4)).toBe(6.35);
    expect(inchesToMillimetres(1 / 8)).toBe(3.175);
    expect(inchesToMillimetres(1 / 16)).toBe(1.5875);
    expect(inchesToMillimetres(3 / 4)).toBe(19.05);
    expect(inchesToMillimetres(12)).toBe(304.8);
    expect(inchesToMillimetres(24)).toBe(609.6);
  });

  it('converts millimetres to inches accurately', () => {
    expect(millimetresToInches(25.4)).toBe(1);
    expect(millimetresToInches(12.7)).toBe(0.5);
    expect(millimetresToInches(6.35)).toBe(0.25);
    expect(millimetresToInches(3.175)).toBe(0.125);
    expect(millimetresToInches(1.5875)).toBe(0.0625);
    expect(millimetresToInches(304.8)).toBe(12);
  });
});

describe('Fraction Simplification', () => {
  it('simplifies sixteenths fractions down to their lowest terms', () => {
    expect(simplifySixteenthsFraction(0)).toEqual({ numerator: 0, denominator: 1 });
    expect(simplifySixteenthsFraction(1)).toEqual({ numerator: 1, denominator: 16 });
    expect(simplifySixteenthsFraction(2)).toEqual({ numerator: 1, denominator: 8 });
    expect(simplifySixteenthsFraction(3)).toEqual({ numerator: 3, denominator: 16 });
    expect(simplifySixteenthsFraction(4)).toEqual({ numerator: 1, denominator: 4 });
    expect(simplifySixteenthsFraction(5)).toEqual({ numerator: 5, denominator: 16 });
    expect(simplifySixteenthsFraction(6)).toEqual({ numerator: 3, denominator: 8 });
    expect(simplifySixteenthsFraction(7)).toEqual({ numerator: 7, denominator: 16 });
    expect(simplifySixteenthsFraction(8)).toEqual({ numerator: 1, denominator: 2 });
    expect(simplifySixteenthsFraction(9)).toEqual({ numerator: 9, denominator: 16 });
    expect(simplifySixteenthsFraction(10)).toEqual({ numerator: 5, denominator: 8 });
    expect(simplifySixteenthsFraction(11)).toEqual({ numerator: 11, denominator: 16 });
    expect(simplifySixteenthsFraction(12)).toEqual({ numerator: 3, denominator: 4 });
    expect(simplifySixteenthsFraction(13)).toEqual({ numerator: 13, denominator: 16 });
    expect(simplifySixteenthsFraction(14)).toEqual({ numerator: 7, denominator: 8 });
    expect(simplifySixteenthsFraction(15)).toEqual({ numerator: 15, denominator: 16 });
  });
});

describe('Metric Parsing', () => {
  it('parses valid whole millimetres', () => {
    expect(parseMetricDimension('1')).toEqual({ ok: true, millimetres: 1 });
    expect(parseMetricDimension('18')).toEqual({ ok: true, millimetres: 18 });
    expect(parseMetricDimension('250')).toEqual({ ok: true, millimetres: 250 });
    expect(parseMetricDimension('600')).toEqual({ ok: true, millimetres: 600 });
    expect(parseMetricDimension(' 600 ')).toEqual({ ok: true, millimetres: 600 });
    expect(parseMetricDimension('600mm')).toEqual({ ok: true, millimetres: 600 });
    expect(parseMetricDimension('600 mm')).toEqual({ ok: true, millimetres: 600 });
  });

  it('rejects empty or whitespace-only metric input', () => {
    const emptyResult = parseMetricDimension('');
    expect(emptyResult.ok).toBe(false);
    if (!emptyResult.ok) {
      expect(emptyResult.code).toBe('EMPTY_INPUT');
    }

    const wsResult = parseMetricDimension('   ');
    expect(wsResult.ok).toBe(false);
    if (!wsResult.ok) {
      expect(wsResult.code).toBe('EMPTY_INPUT');
    }
  });

  it('rejects non-positive metric values', () => {
    const zeroResult = parseMetricDimension('0');
    expect(zeroResult.ok).toBe(false);
    if (!zeroResult.ok) {
      expect(zeroResult.code).toBe('NON_POSITIVE_VALUE');
    }

    const negativeResult = parseMetricDimension('-18');
    expect(negativeResult.ok).toBe(false);
    if (!negativeResult.ok) {
      expect(negativeResult.code).toBe('NON_POSITIVE_VALUE');
    }
  });

  it('rejects decimal metric values', () => {
    const decimalDot = parseMetricDimension('18.5');
    expect(decimalDot.ok).toBe(false);
    if (!decimalDot.ok) {
      expect(decimalDot.code).toBe('NON_INTEGER_METRIC');
    }

    const decimalComma = parseMetricDimension('18,5');
    expect(decimalComma.ok).toBe(false);
    if (!decimalComma.ok) {
      expect(decimalComma.code).toBe('NON_INTEGER_METRIC');
    }
  });

  it('rejects non-numeric characters and feet notation in metric input', () => {
    const feetResult = parseMetricDimension('2\' 6"');
    expect(feetResult.ok).toBe(false);
    if (!feetResult.ok) {
      expect(feetResult.code).toBe('FEET_NOT_SUPPORTED');
    }

    const textResult = parseMetricDimension('abc');
    expect(textResult.ok).toBe(false);
    if (!textResult.ok) {
      expect(textResult.code).toBe('INVALID_FORMAT');
    }
  });
});

describe('Imperial Parsing', () => {
  it('parses whole inches with and without unit marks', () => {
    expect(parseImperialDimension('1')).toEqual({ ok: true, millimetres: 25.4 });
    expect(parseImperialDimension('12')).toEqual({ ok: true, millimetres: 304.8 });
    expect(parseImperialDimension('24')).toEqual({ ok: true, millimetres: 609.6 });
    expect(parseImperialDimension('12"')).toEqual({ ok: true, millimetres: 304.8 });
    expect(parseImperialDimension(' 12" ')).toEqual({ ok: true, millimetres: 304.8 });
    expect(parseImperialDimension('12 in')).toEqual({ ok: true, millimetres: 304.8 });
  });

  it('parses valid simple fractions on the 1/16 grid', () => {
    expect(parseImperialDimension('1/2')).toEqual({ ok: true, millimetres: 12.7 });
    expect(parseImperialDimension('1/4')).toEqual({ ok: true, millimetres: 6.35 });
    expect(parseImperialDimension('3/4')).toEqual({ ok: true, millimetres: 19.05 });
    expect(parseImperialDimension('1/8')).toEqual({ ok: true, millimetres: 3.175 });
    expect(parseImperialDimension('3/8')).toEqual({ ok: true, millimetres: 9.525 });
    expect(parseImperialDimension('5/8')).toEqual({ ok: true, millimetres: 15.875 });
    expect(parseImperialDimension('7/8')).toEqual({ ok: true, millimetres: 22.225 });
    expect(parseImperialDimension('1/16')).toEqual({ ok: true, millimetres: 1.5875 });
    expect(parseImperialDimension('15/16')).toEqual({ ok: true, millimetres: 23.8125 });
    expect(parseImperialDimension('1/2"')).toEqual({ ok: true, millimetres: 12.7 });
    expect(parseImperialDimension('15/16"')).toEqual({ ok: true, millimetres: 23.8125 });
  });

  it('parses mixed numbers with space and hyphen delimiters', () => {
    expect(parseImperialDimension('1 1/2')).toEqual({ ok: true, millimetres: 38.1 });
    expect(parseImperialDimension('12 3/4')).toEqual({ ok: true, millimetres: 323.85 });
    expect(parseImperialDimension('24 15/16')).toEqual({ ok: true, millimetres: 633.4125 });
    expect(parseImperialDimension('12 1/2"')).toEqual({ ok: true, millimetres: 317.5 });

    // Woodworking hyphenated style
    expect(parseImperialDimension('12-1/2')).toEqual({ ok: true, millimetres: 317.5 });
    expect(parseImperialDimension('12-1/2"')).toEqual({ ok: true, millimetres: 317.5 });
    expect(parseImperialDimension('12 - 3/4"')).toEqual({ ok: true, millimetres: 323.85 });
  });

  it('rejects imperial fractions finer than 1/16"', () => {
    const f32 = parseImperialDimension('1/32');
    expect(f32.ok).toBe(false);
    if (!f32.ok) {
      expect(f32.code).toBe('INVALID_FRACTION_DENOMINATOR');
    }

    const f32Mixed = parseImperialDimension('12 3/32"');
    expect(f32Mixed.ok).toBe(false);
    if (!f32Mixed.ok) {
      expect(f32Mixed.code).toBe('INVALID_FRACTION_DENOMINATOR');
    }
  });

  it('rejects arbitrary or unsupported denominators', () => {
    const f3 = parseImperialDimension('1/3');
    expect(f3.ok).toBe(false);
    if (!f3.ok) {
      expect(f3.code).toBe('INVALID_FRACTION_DENOMINATOR');
    }

    const f5 = parseImperialDimension('2/5');
    expect(f5.ok).toBe(false);
    if (!f5.ok) {
      expect(f5.code).toBe('INVALID_FRACTION_DENOMINATOR');
    }

    const f0 = parseImperialDimension('1/0');
    expect(f0.ok).toBe(false);
    if (!f0.ok) {
      expect(f0.code).toBe('INVALID_FRACTION_DENOMINATOR');
    }
  });

  it('rejects improper fractions', () => {
    const improper = parseImperialDimension('17/16');
    expect(improper.ok).toBe(false);
    if (!improper.ok) {
      expect(improper.code).toBe('IMPROPER_FRACTION');
    }

    const improperMixed = parseImperialDimension('12 17/16');
    expect(improperMixed.ok).toBe(false);
    if (!improperMixed.ok) {
      expect(improperMixed.code).toBe('IMPROPER_FRACTION');
    }

    const fullFrac = parseImperialDimension('4/4');
    expect(fullFrac.ok).toBe(false);
    if (!fullFrac.ok) {
      expect(fullFrac.code).toBe('IMPROPER_FRACTION');
    }
  });

  it('rejects decimal numbers in imperial mode', () => {
    const decimal = parseImperialDimension('12.5');
    expect(decimal.ok).toBe(false);
    if (!decimal.ok) {
      expect(decimal.code).toBe('INVALID_FORMAT');
    }
  });

  it('rejects feet notation in V1', () => {
    const feet = parseImperialDimension('2\' 6"');
    expect(feet.ok).toBe(false);
    if (!feet.ok) {
      expect(feet.code).toBe('FEET_NOT_SUPPORTED');
    }

    const feetOnly = parseImperialDimension("2'");
    expect(feetOnly.ok).toBe(false);
    if (!feetOnly.ok) {
      expect(feetOnly.code).toBe('FEET_NOT_SUPPORTED');
    }
  });

  it('rejects malformed syntax and non-positive imperial values', () => {
    expect(parseImperialDimension('').ok).toBe(false);
    expect(parseImperialDimension('0').ok).toBe(false);
    expect(parseImperialDimension('-12').ok).toBe(false);
    expect(parseImperialDimension('3/').ok).toBe(false);
    expect(parseImperialDimension('1//2').ok).toBe(false);
    expect(parseImperialDimension('abc').ok).toBe(false);
  });
});

describe('Metric Formatting', () => {
  it('formats millimetres rounded to the nearest whole integer with and without unit suffix', () => {
    expect(formatMetricDimension(18)).toBe('18 mm');
    expect(formatMetricDimension(250)).toBe('250 mm');
    expect(formatMetricDimension(600)).toBe('600 mm');
    expect(formatMetricDimension(18, { includeUnit: false })).toBe('18');
  });

  it('rounds decimal mm values during display without modifying original numbers', () => {
    // 1/16" is 1.5875 mm -> displays as 2 mm in metric
    expect(formatMetricDimension(1.5875)).toBe('2 mm');
    expect(formatMetricDimension(18.4)).toBe('18 mm');
    expect(formatMetricDimension(18.6)).toBe('19 mm');
  });
});

describe('Imperial Formatting', () => {
  it('formats exact sixteenths and simplified fractions', () => {
    expect(formatImperialDimension(25.4)).toBe('1"');
    expect(formatImperialDimension(12.7)).toBe('1/2"');
    expect(formatImperialDimension(19.05)).toBe('3/4"');
    expect(formatImperialDimension(3.175)).toBe('1/8"');
    expect(formatImperialDimension(1.5875)).toBe('1/16"');
    expect(formatImperialDimension(304.8)).toBe('12"');
    expect(formatImperialDimension(317.5)).toBe('12 1/2"');
    expect(formatImperialDimension(323.85)).toBe('12 3/4"');
  });

  it('formats imperial dimensions without unit suffix when requested', () => {
    expect(formatImperialDimension(25.4, { includeUnit: false })).toBe('1');
    expect(formatImperialDimension(317.5, { includeUnit: false })).toBe('12 1/2');
    expect(formatImperialDimension(1.5875, { includeUnit: false })).toBe('1/16');
  });

  it('carries rounding into the next whole inch without showing 16/16', () => {
    // 11.98 inches in mm: 11.98 * 25.4 = 304.292 mm -> rounds to 12"
    expect(formatImperialDimension(304.292)).toBe('12"');

    // 0.98 inches in mm: 0.98 * 25.4 = 24.892 mm -> rounds to 1"
    expect(formatImperialDimension(24.892)).toBe('1"');
  });

  it('rounds near fraction boundaries correctly', () => {
    // 1/16" = 0.0625".
    // 0.0625 * 25.4 = 1.5875 mm
    // Boundary halfway to next sixteenth is at 1.5/16 = 0.09375" (2.38125 mm)
    // 1.6 mm -> 1/16"
    expect(formatImperialDimension(1.6)).toBe('1/16"');
    // 1.55 mm -> 1/16"
    expect(formatImperialDimension(1.55)).toBe('1/16"');
    // 2.4 mm -> 2/16" = 1/8"
    expect(formatImperialDimension(2.4)).toBe('1/8"');
  });

  it('handles zero gracefully', () => {
    expect(formatImperialDimension(0)).toBe('0"');
    expect(formatImperialDimension(0, { includeUnit: false })).toBe('0');
  });
});

describe('Generic parseDimension and formatDimension', () => {
  it('delegates correctly based on UnitSystem', () => {
    expect(parseDimension('600', 'metric')).toEqual({ ok: true, millimetres: 600 });
    expect(parseDimension('12 1/2"', 'imperial')).toEqual({ ok: true, millimetres: 317.5 });

    expect(formatDimension(600, 'metric')).toBe('600 mm');
    expect(formatDimension(317.5, 'imperial')).toBe('12 1/2"');
  });
});
