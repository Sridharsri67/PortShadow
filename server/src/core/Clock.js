/**
 * Configurable Clock Abstraction for PortShadow.
 * Supports standard SystemClock (real-time wall clock) and VirtualClock (deterministic simulation time).
 */
export class Clock {
  /**
   * Return current epoch timestamp in milliseconds.
   * @returns {number}
   */
  now() {
    return Date.now();
  }

  /**
   * Return ISO 8601 formatted timestamp string.
   * @returns {string}
   */
  isoNow() {
    return new Date(this.now()).toISOString();
  }
}

export class VirtualClock extends Clock {
  /**
   * @param {number} [initialTime=Date.now()]
   */
  constructor(initialTime = Date.now()) {
    super();
    this.currentTime = initialTime;
  }

  now() {
    return this.currentTime;
  }

  /**
   * Advance virtual simulation time by milliseconds.
   * @param {number} ms 
   */
  advance(ms) {
    if (ms < 0) throw new Error("Cannot rewind virtual clock by negative duration");
    this.currentTime += ms;
  }

  /**
   * Explicitly set virtual clock time.
   * @param {number} timeMs 
   */
  setTime(timeMs) {
    this.currentTime = timeMs;
  }
}

export const systemClock = new Clock();
