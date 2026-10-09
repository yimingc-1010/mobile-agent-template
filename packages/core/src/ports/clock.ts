/**
 * Port for reading the current time.
 *
 * Every external dependency (time, location, sensors, network, storage, payments)
 * is accessed through a port like this one, with a real and a fake implementation,
 * so unit and e2e tests stay deterministic. See docs/process.md, principle 4.
 */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

/** Deterministic clock for tests and fake-mode dev builds. */
export class FakeClock implements Clock {
  constructor(private current: number = 0) {}

  now(): number {
    return this.current;
  }

  advance(ms: number): void {
    this.current += ms;
  }
}
