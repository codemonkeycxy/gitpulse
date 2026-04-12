const git = require('../../src/git');
const { collect } = require('../../src/metrics/churn');

jest.mock('../../src/git');

const REPO = '/fake/repo';
const OPTS = { since: '2025-04-11', top: 20 };

describe('churn.collect', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns top files by churn count with correct categories', async () => {
    git.run
      .mockReturnValueOnce(
        'src/auth.ts\nsrc/auth.ts\nsrc/auth.ts\n\napi/routes.ts\napi/routes.ts\napi/routes.ts\n\nsrc/db.ts\nsrc/db.ts\n'
      )
      .mockReturnValueOnce('src/auth.ts\napi/routes.ts\n');

    const result = await collect(REPO, OPTS);

    expect(result.files).toEqual([
      { path: 'src/auth.ts',   changes: 3, bugFixes: 1, category: 'danger' },
      { path: 'api/routes.ts', changes: 3, bugFixes: 1, category: 'danger' },
      { path: 'src/db.ts',     changes: 2, bugFixes: 0, category: 'churn'  },
    ]);
  });

  test('appends bug-only files not in top list when bugFixes >= 3', async () => {
    git.run
      .mockReturnValueOnce('src/auth.ts\nsrc/auth.ts\nutils/parse.ts\n')
      .mockReturnValueOnce('utils/parse.ts\nutils/parse.ts\nutils/parse.ts\n');

    const result = await collect(REPO, { since: '2025-04-11', top: 1 });

    const paths = result.files.map(f => f.path);
    expect(paths).toContain('src/auth.ts');
    expect(paths).toContain('utils/parse.ts');

    const parse = result.files.find(f => f.path === 'utils/parse.ts');
    expect(parse.category).toBe('bugs');
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
  });
});
