const { execFileSync } = require('child_process');
const git = require('../src/git');

jest.mock('child_process');

describe('git.isGitRepo', () => {
  test('returns true when git rev-parse succeeds', () => {
    execFileSync.mockReturnValue('');
    expect(git.isGitRepo('/some/repo')).toBe(true);
    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      ['rev-parse', '--git-dir'],
      expect.objectContaining({ cwd: '/some/repo', stdio: 'pipe', encoding: 'utf8' })
    );
  });

  test('returns false when execFileSync throws', () => {
    execFileSync.mockImplementation(() => { throw new Error('not a repo'); });
    expect(git.isGitRepo('/not/a/repo')).toBe(false);
  });
});

describe('git.getGitRoot', () => {
  test('returns trimmed output of rev-parse --show-toplevel', () => {
    execFileSync.mockReturnValue('/home/user/my-project\n');
    expect(git.getGitRoot('/home/user/my-project/subdir')).toBe('/home/user/my-project');
    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      ['rev-parse', '--show-toplevel'],
      expect.objectContaining({ cwd: '/home/user/my-project/subdir' })
    );
  });
});

describe('git.run', () => {
  test('calls execFileSync with git and the args array', () => {
    execFileSync.mockReturnValue('some output\n');
    const result = git.run(['log', '--oneline'], '/some/repo');
    expect(result).toBe('some output\n');
    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      ['log', '--oneline'],
      expect.objectContaining({ cwd: '/some/repo', encoding: 'utf8', stdio: 'pipe' })
    );
  });

  test('throws when the git command fails', () => {
    execFileSync.mockImplementation(() => { throw new Error('unknown revision'); });
    expect(() => git.run(['log'], '/some/repo')).toThrow('unknown revision');
  });
});
