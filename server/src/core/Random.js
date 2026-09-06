/**
 * Seedable Pseudo-Random Number Generator (PRNG) for PortShadow.
 * Uses Mulberry32 algorithm to provide 100% deterministic simulation seeds.
 */
export class SeedableRandom {
  /**
   * @param {number} [seed=42]
   */
  constructor(seed = 42) {
    this.initialSeed = seed;
    this.seed = seed;
  }

  /**
   * Reset seed to initial value for exact simulation replay.
   */
  reset() {
    this.seed = this.initialSeed;
  }

  /**
   * Set a new seed integer.
   * @param {number} seed 
   */
  setSeed(seed) {
    this.initialSeed = seed;
    this.seed = seed;
  }

  /**
   * Generate next pseudo-random floating-point number between 0 and 1.
   * @returns {number}
   */
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random number in range [min, max).
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Boolean coin flip with probability p (0 <= p <= 1).
   * @param {number} probability 
   * @returns {boolean}
   */
  chance(probability) {
    return this.next() < probability;
  }
}

// Default system non-deterministic random fallback
export const systemRandom = {
  next: () => Math.random(),
  range: (min, max) => min + Math.random() * (max - min),
  chance: (p) => Math.random() < p,
  reset: () => {},
  setSeed: () => {}
};
