import { describe, expect, it } from 'vitest';

import { presentHistoryScore } from './historyScore';

describe('history score presentation', () => {
  it.each(['off_topic', 'grade_withheld'])('withholds the numeric sentinel when %s is flagged', (flag) => {
    expect(presentHistoryScore({
      overallScore: 0,
      overallMax: 100,
      flags: [flag],
    })).toEqual({ label: 'Score withheld', withheld: true });
  });

  it('withholds a dependency-failure result carrying the grade-withheld flag', () => {
    expect(presentHistoryScore({
      overallScore: 0,
      overallMax: 100,
      flags: ['grade_withheld', 'relevance_check_unavailable'],
    })).toEqual({ label: 'Score withheld', withheld: true });
  });

  it('keeps ordinary and missing scores recognizable', () => {
    expect(presentHistoryScore({
      overallScore: 87,
      overallMax: 100,
      flags: ['minor_grammar'],
    })).toEqual({ label: '87/100', withheld: false });

    expect(presentHistoryScore({
      overallScore: null,
      overallMax: 100,
      flags: [],
    })).toEqual({ label: '—', withheld: false });
  });
});
