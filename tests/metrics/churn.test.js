const git = require('../../src/git');
const { collect } = require('../../src/metrics/churn');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11', top: 20 };

describe('churn.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns top files sorted by churn count descending', async () => {
    git.run.mockReturnValue(
      'src/auth.ts\nsrc/auth.ts\nsrc/auth.ts\n\napi/routes.ts\napi/routes.ts\napi/routes.ts\n\nsrc/db.ts\nsrc/db.ts\n'
    );

    const result = await collect(REPO, OPTS);

    expect(result.files).toEqual([
      { path: 'src/auth.ts',   changes: 3 },
      { path: 'api/routes.ts', changes: 3 },
      { path: 'src/db.ts',     changes: 2 },
    ]);
    expect(result.filtered).toEqual([]);
  });

  test('respects the top limit', async () => {
    git.run.mockReturnValue(
      'src/auth.ts\nsrc/auth.ts\nutils/parse.ts\n'
    );

    const result = await collect(REPO, { since: '2025-04-11', top: 1 });

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('src/auth.ts');
  });

  test('excludes noise files by default and reports them in filtered', async () => {
    git.run.mockReturnValue('go.sum\ngo.sum\ngo.sum\nsrc/auth.ts\nsrc/auth.ts\n');

    const result = await collect(REPO, OPTS);

    expect(result.files.map(f => f.path)).not.toContain('go.sum');
    expect(result.filtered).toContain('go.sum');
  });

  test('includes noise files when allFiles is true', async () => {
    git.run.mockReturnValue('go.sum\ngo.sum\ngo.sum\nsrc/auth.ts\nsrc/auth.ts\n');

    const result = await collect(REPO, { ...OPTS, allFiles: true });

    expect(result.files.map(f => f.path)).toContain('go.sum');
    expect(result.filtered).toEqual([]);
  });

  test('passes since as a separate array element (not shell-interpolated)', async () => {
    git.run.mockReturnValue('');
    await collect(REPO, OPTS);
    expect(git.run).toHaveBeenCalledWith(
      expect.arrayContaining(['--since=2025-04-11']),
      REPO
    );
  });

  test('returns empty files array when repo has no commits', async () => {
    git.run.mockReturnValue('');
    const result = await collect(REPO, OPTS);
    expect(result.files).toEqual([]);
    expect(result.filtered).toEqual([]);
  });
});
