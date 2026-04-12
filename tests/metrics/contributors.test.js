const git = require('../../src/git');
const { collect } = require('../../src/metrics/contributors');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11' };

describe('contributors.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('parses shortlog into authors sorted by commits desc', async () => {
    git.run.mockReturnValue('  100\tAlice\n   50\tBob\n   10\tCarol\n');

    const result = await collect(REPO, OPTS);

    expect(result.authors[0]).toEqual({ name: 'Alice', commits: 100 });
    expect(result.authors[1]).toEqual({ name: 'Bob',   commits: 50  });
    expect(result.authors[2]).toEqual({ name: 'Carol', commits: 10  });
    expect(result.total).toBe(160);
  });

  test('bus factor is authors needed to cover >= 80% of commits', async () => {
    git.run.mockReturnValue('  700\tAlice\n  200\tBob\n  100\tCarol\n');

    const result = await collect(REPO, OPTS);
    expect(result.busFactor).toBe(2);
  });

  test('collapses authors beyond top 10 into others bucket', async () => {
    const lines = Array.from({ length: 12 }, (_, i) =>
      '  ' + (100 - i * 5) + '\tAuthor' + i
    ).join('\n') + '\n';
    git.run.mockReturnValue(lines);

    const result = await collect(REPO, OPTS);

    expect(result.authors).toHaveLength(11);
    expect(result.authors[10].name).toBe('others');
    expect(result.authors[10].commits).toBe(95);
  });

  test('returns empty result when no commits', async () => {
    git.run.mockReturnValue('');
    const result = await collect(REPO, OPTS);
    expect(result.authors).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.busFactor).toBe(0);
  });
});
