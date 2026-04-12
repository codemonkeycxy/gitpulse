const git = require('../../src/git');
const { collect } = require('../../src/metrics/silos');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11' };

describe('silos.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('identifies files touched by only one author in the window', async () => {
    git.run
      .mockReturnValueOnce('src/auth.ts\nsrc/auth.ts\nsrc/db.ts\n')
      .mockReturnValueOnce('Alice|2025-06-01\nAlice|2025-08-15\n')   // auth.ts: Alice only
      .mockReturnValueOnce('Alice|2025-05-01\nBob|2025-09-01\n');    // db.ts: two authors

    const result = await collect(REPO, OPTS);

    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toEqual({
      path: 'src/auth.ts',
      owner: 'Alice',
      lastTouched: '2025-08-15',
      commits: 2,
    });
  });

  test('sorts by lastTouched ascending (oldest first)', async () => {
    git.run
      .mockReturnValueOnce('a.ts\nb.ts\n')
      .mockReturnValueOnce('Alice|2025-09-01\nAlice|2025-07-01\n')   // a.ts newer
      .mockReturnValueOnce('Bob|2025-05-01\nBob|2025-03-01\n');       // b.ts older

    const result = await collect(REPO, OPTS);

    expect(result.files[0].path).toBe('b.ts');
    expect(result.files[1].path).toBe('a.ts');
  });

  test('excludes files with only one commit (just created, not yet a silo)', async () => {
    git.run
      .mockReturnValueOnce('new.ts\nestablished.ts\n')
      .mockReturnValueOnce('Alice|2025-11-01\n')                        // new.ts: 1 commit only
      .mockReturnValueOnce('Alice|2025-08-01\nAlice|2025-06-01\n');     // established.ts: 2 commits

    const result = await collect(REPO, OPTS);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('established.ts');
  });

  test('returns empty array when no files changed', async () => {
    git.run.mockReturnValue('');
    const result = await collect(REPO, OPTS);
    expect(result.files).toEqual([]);
  });
});
