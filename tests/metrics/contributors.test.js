const git = require('../../src/git');
const { collect } = require('../../src/metrics/contributors');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11' };

describe('contributors.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('parses log author names into authors sorted by commits desc', async () => {
    // git log --format=%aN emits one author name per commit
    git.run.mockReturnValue(
      Array(100).fill('Alice').join('\n') + '\n' +
      Array(50).fill('Bob').join('\n') + '\n' +
      Array(10).fill('Carol').join('\n') + '\n'
    );

    const result = await collect(REPO, OPTS);

    expect(result.authors[0]).toEqual({ name: 'Alice', commits: 100 });
    expect(result.authors[1]).toEqual({ name: 'Bob',   commits: 50  });
    expect(result.authors[2]).toEqual({ name: 'Carol', commits: 10  });
    expect(result.total).toBe(160);
  });

  test('bus factor is authors needed to cover >= 80% of commits', async () => {
    git.run.mockReturnValue(
      Array(700).fill('Alice').join('\n') + '\n' +
      Array(200).fill('Bob').join('\n') + '\n' +
      Array(100).fill('Carol').join('\n') + '\n'
    );

    const result = await collect(REPO, OPTS);
    expect(result.busFactor).toBe(2);
  });

  test('collapses authors beyond top 10 into others bucket', async () => {
    // Author0=100 commits, Author1=95, ..., Author11=45; top10 Others = Author10(50)+Author11(45)=95
    const lines = Array.from({ length: 12 }, (_, i) =>
      Array(100 - i * 5).fill('Author' + i).join('\n')
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
