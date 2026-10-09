import { describe, expect, it } from 'vitest';

import { elapsedSince, formatDuration } from './duration';
import { FakeClock } from './ports/clock';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [61_000, '1:01'],
    [3_599_000, '59:59'],
    [3_600_000, '1:00:00'],
    [3_723_000, '1:02:03'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects %d', (ms) => {
    expect(() => formatDuration(ms)).toThrow(RangeError);
  });
});

describe('elapsedSince', () => {
  it('measures time on the injected clock', () => {
    const clock = new FakeClock(1_000);
    clock.advance(5_000);
    expect(elapsedSince(clock, 1_000)).toBe(5_000);
  });

  it('never returns a negative duration', () => {
    expect(elapsedSince(new FakeClock(0), 10)).toBe(0);
  });
});
