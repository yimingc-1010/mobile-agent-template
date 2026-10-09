import type { Clock } from './ports/clock';

/** Formats a non-negative duration as `H:MM:SS`, or `M:SS` when under an hour. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`duration must be a non-negative finite number, got ${ms}`);
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours === 0) {
    return `${minutes}:${ss}`;
  }
  return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
}

export function elapsedSince(clock: Clock, startedAt: number): number {
  return Math.max(0, clock.now() - startedAt);
}
