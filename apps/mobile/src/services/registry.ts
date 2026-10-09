import { FakeClock, systemClock, type Clock } from '@app/core';

/**
 * Single place that decides real vs fake implementations of every port.
 *
 * Dev builds started with EXPO_PUBLIC_USE_FAKES=1 (see `npm run start:fakes`) get
 * deterministic fakes so Maestro flows produce the same result on every run.
 * Add new ports here; screens must never import a real implementation directly.
 */
export const useFakes = process.env.EXPO_PUBLIC_USE_FAKES === '1';

/** Fixed instant for fake mode: 2026-01-01T00:00:00Z. */
const FAKE_EPOCH_MS = 1_767_225_600_000;

export interface Services {
  clock: Clock;
}

export const services: Services = {
  clock: useFakes ? new FakeClock(FAKE_EPOCH_MS) : systemClock,
};
