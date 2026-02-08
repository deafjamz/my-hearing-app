import { describe, it, expect } from 'vitest';
import {
  evaluateSession,
  SNR_STEP,
  SNR_MIN,
  SNR_MAX,
  SNR_DEFAULT,
  BLOCK_SIZE,
  THRESHOLD_UP,
  THRESHOLD_DOWN,
} from '../api';

// ── Clinical Constants Verification ─────────────────────────────────────────
// These values come from docs/rules/10_CLINICAL_CONSTANTS.md and are
// safety-critical for the adaptive staircase algorithm.

describe('Clinical Constants', () => {
  it('SNR_STEP is 5 dB per 10_CLINICAL_CONSTANTS.md', () => {
    expect(SNR_STEP).toBe(5);
  });

  it('SNR range is -10 to +20 dB', () => {
    expect(SNR_MIN).toBe(-10);
    expect(SNR_MAX).toBe(20);
  });

  it('default SNR is +10 dB (comfortable starting point)', () => {
    expect(SNR_DEFAULT).toBe(10);
  });

  it('block size is 10 trials', () => {
    expect(BLOCK_SIZE).toBe(10);
  });

  it('threshold up (increase difficulty) is 80%', () => {
    expect(THRESHOLD_UP).toBe(80);
  });

  it('threshold down (decrease difficulty) is 50%', () => {
    expect(THRESHOLD_DOWN).toBe(50);
  });
});

// ── evaluateSession — Core Staircase Algorithm ──────────────────────────────

describe('evaluateSession', () => {
  // Helper: create result arrays
  const results = (correct: number, total: number): boolean[] => [
    ...Array(correct).fill(true),
    ...Array(total - correct).fill(false),
  ];

  describe('increase difficulty (decrease SNR) when accuracy >= 80%', () => {
    it('8/10 correct (80%) → decrease SNR by 5', () => {
      const res = evaluateSession(10, results(8, 10));
      expect(res.action).toBe('decrease');
      expect(res.next_snr).toBe(5);
      expect(res.accuracy).toBe(80);
    });

    it('9/10 correct (90%) → decrease SNR by 5', () => {
      const res = evaluateSession(10, results(9, 10));
      expect(res.action).toBe('decrease');
      expect(res.next_snr).toBe(5);
      expect(res.accuracy).toBe(90);
    });

    it('10/10 correct (100%) → decrease SNR by 5 with perfect score message', () => {
      const res = evaluateSession(10, results(10, 10));
      expect(res.action).toBe('decrease');
      expect(res.next_snr).toBe(5);
      expect(res.accuracy).toBe(100);
      expect(res.recommendation).toContain('Perfect score');
    });
  });

  describe('decrease difficulty (increase SNR) when accuracy <= 50%', () => {
    it('5/10 correct (50%) → increase SNR by 5', () => {
      const res = evaluateSession(10, results(5, 10));
      expect(res.action).toBe('increase');
      expect(res.next_snr).toBe(15);
      expect(res.accuracy).toBe(50);
    });

    it('3/10 correct (30%) → increase SNR by 5', () => {
      const res = evaluateSession(10, results(3, 10));
      expect(res.action).toBe('increase');
      expect(res.next_snr).toBe(15);
      expect(res.accuracy).toBe(30);
    });

    it('0/10 correct (0%) → increase SNR by 5', () => {
      const res = evaluateSession(10, results(0, 10));
      expect(res.action).toBe('increase');
      expect(res.next_snr).toBe(15);
      expect(res.accuracy).toBe(0);
    });
  });

  describe('maintain SNR when accuracy is 51-79%', () => {
    it('6/10 correct (60%) → keep SNR', () => {
      const res = evaluateSession(10, results(6, 10));
      expect(res.action).toBe('keep');
      expect(res.next_snr).toBe(10);
      expect(res.accuracy).toBe(60);
    });

    it('7/10 correct (70%) → keep SNR', () => {
      const res = evaluateSession(10, results(7, 10));
      expect(res.action).toBe('keep');
      expect(res.next_snr).toBe(10);
      expect(res.accuracy).toBe(70);
    });
  });

  describe('boundary conditions at threshold edges', () => {
    it('exactly 80% → decrease (boundary inclusive)', () => {
      const res = evaluateSession(10, results(8, 10));
      expect(res.action).toBe('decrease');
    });

    it('exactly 50% → increase (boundary inclusive)', () => {
      const res = evaluateSession(10, results(5, 10));
      expect(res.action).toBe('increase');
    });

    it('51% (just above 50%) → keep', () => {
      // 51% requires non-10 block or fractional — test with 100 trials
      const r = results(51, 100);
      const res = evaluateSession(10, r);
      expect(res.action).toBe('keep');
    });

    it('79% (just below 80%) → keep', () => {
      const r = results(79, 100);
      const res = evaluateSession(10, r);
      expect(res.action).toBe('keep');
    });
  });

  describe('SNR clamping to valid range', () => {
    it('cannot go below SNR_MIN (-10 dB)', () => {
      // At -10 dB with 100% accuracy → should stay at -10
      const res = evaluateSession(SNR_MIN, results(10, 10));
      expect(res.action).toBe('decrease');
      expect(res.next_snr).toBe(SNR_MIN); // Clamped, won't go to -15
    });

    it('cannot go above SNR_MAX (+20 dB)', () => {
      // At +20 dB with 0% accuracy → should stay at +20
      const res = evaluateSession(SNR_MAX, results(0, 10));
      expect(res.action).toBe('increase');
      expect(res.next_snr).toBe(SNR_MAX); // Clamped, won't go to +25
    });

    it('clamping at -5 dB with perfect score → goes to -10', () => {
      const res = evaluateSession(-5, results(10, 10));
      expect(res.next_snr).toBe(-10);
    });

    it('clamping at +15 dB with 0% → goes to +20', () => {
      const res = evaluateSession(15, results(0, 10));
      expect(res.next_snr).toBe(20);
    });
  });

  describe('non-standard block sizes', () => {
    it('handles 5-trial blocks', () => {
      const res = evaluateSession(10, results(4, 5));
      expect(res.action).toBe('decrease'); // 80%
      expect(res.accuracy).toBe(80);
    });

    it('handles 20-trial blocks', () => {
      const res = evaluateSession(10, results(16, 20));
      expect(res.action).toBe('decrease'); // 80%
      expect(res.accuracy).toBe(80);
    });

    it('handles single trial', () => {
      const res = evaluateSession(10, [true]);
      expect(res.action).toBe('decrease'); // 100%
      expect(res.accuracy).toBe(100);
    });
  });

  describe('return type structure', () => {
    it('always returns recommendation, action, accuracy, and next_snr', () => {
      const res = evaluateSession(10, results(7, 10));
      expect(res).toHaveProperty('recommendation');
      expect(res).toHaveProperty('action');
      expect(res).toHaveProperty('accuracy');
      expect(res).toHaveProperty('next_snr');
      expect(typeof res.recommendation).toBe('string');
      expect(typeof res.accuracy).toBe('number');
      expect(typeof res.next_snr).toBe('number');
    });

    it('action is always one of increase/decrease/keep', () => {
      const actions = ['increase', 'decrease', 'keep'];
      for (let correct = 0; correct <= 10; correct++) {
        const res = evaluateSession(10, results(correct, 10));
        expect(actions).toContain(res.action);
      }
    });

    it('accuracy values are whole-number-accurate for 10-trial blocks', () => {
      // With 10 trials, accuracy should be exact multiples of 10
      for (let correct = 0; correct <= 10; correct++) {
        const res = evaluateSession(10, results(correct, 10));
        expect(res.accuracy).toBe(correct * 10);
      }
    });
  });

  describe('staircase convergence behavior', () => {
    it('repeated perfect scores converge to SNR_MIN', () => {
      let snr = SNR_DEFAULT; // +10
      for (let block = 0; block < 10; block++) {
        const res = evaluateSession(snr, results(10, 10));
        snr = res.next_snr;
      }
      expect(snr).toBe(SNR_MIN); // Should hit floor
    });

    it('repeated failures converge to SNR_MAX', () => {
      let snr = SNR_DEFAULT; // +10
      for (let block = 0; block < 10; block++) {
        const res = evaluateSession(snr, results(0, 10));
        snr = res.next_snr;
      }
      expect(snr).toBe(SNR_MAX); // Should hit ceiling
    });

    it('70% accuracy maintains SNR indefinitely', () => {
      let snr = SNR_DEFAULT;
      for (let block = 0; block < 20; block++) {
        const res = evaluateSession(snr, results(7, 10));
        snr = res.next_snr;
      }
      expect(snr).toBe(SNR_DEFAULT); // Never changed
    });
  });
});
