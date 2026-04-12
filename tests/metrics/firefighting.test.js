'use strict';

const git = require('../../src/git');
const { collect } = require('../../src/metrics/firefighting');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11' };

describe('firefighting.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('counts incidents per month and fills gaps', async () => {
    // format: hash\tmonth\tsubject
    git.run.mockReturnValue(
      'h1\t2025-04\trevert foo\nh2\t2025-04\thotfix bar\nh3\t2025-06\trollback baz\n'
    );

    const result = await collect(REPO, OPTS);

    expect(result.months).toEqual(['2025-04', '2025-05', '2025-06']);
    expect(result.counts).toEqual([2, 0, 1]);
    expect(result.commits).toHaveLength(3);
    expect(result.commits[0]).toMatchObject({ hash: 'h1', month: '2025-04', subject: 'revert foo' });
  });

  test('identifies spike months where count > 2x average', async () => {
    // avg = (1+1+1+10+1+1)/6 = 2.5 -> threshold > 5 -> 2025-07 (10) is a spike
    const lines = [
      'h1\t2025-04\tsubject', 'h2\t2025-05\tsubject', 'h3\t2025-06\tsubject',
      ...Array(10).fill(null).map((_, i) => 'h' + (i + 4) + '\t2025-07\tsubject'),
      'h14\t2025-08\tsubject', 'h15\t2025-09\tsubject',
    ].join('\n') + '\n';
    git.run.mockReturnValue(lines);

    const result = await collect(REPO, OPTS);
    expect(result.spikes).toContain('2025-07');
    expect(result.spikes).not.toContain('2025-04');
  });

  test('returns empty state when no firefighting commits', async () => {
    git.run.mockReturnValue('');
    const result = await collect(REPO, OPTS);
    expect(result.months).toEqual([]);
    expect(result.counts).toEqual([]);
    expect(result.spikes).toEqual([]);
    expect(result.average).toBe(0);
  });
});
