const git = require('../../src/git');
const { collect } = require('../../src/metrics/momentum');
jest.mock('../../src/git');
const REPO = '/fake/repo';
describe('momentum.collect', () => {
  beforeEach(() => jest.clearAllMocks());
  test('counts commits per month and fills gaps', async () => {
    git.run.mockReturnValue('2025-04\n2025-04\n2025-06\n2025-06\n2025-06\n');
    const result = await collect(REPO, { since: '2025-04-01' });
    expect(result.months).toEqual(['2025-04', '2025-05', '2025-06']);
    expect(result.counts).toEqual([2, 0, 3]);
  });
  test('trend is growing when recent avg > prior avg by 20%', async () => {
    const lines = [...Array(5).fill('2025-01'),...Array(5).fill('2025-02'),...Array(5).fill('2025-03'),...Array(15).fill('2025-04'),...Array(15).fill('2025-05'),...Array(15).fill('2025-06')].join('\n') + '\n';
    git.run.mockReturnValue(lines);
    const result = await collect(REPO, { since: '2025-01-01' });
    expect(result.trend).toBe('growing');
  });
  test('trend is declining when recent avg < prior avg by 20%', async () => {
    const lines = [...Array(15).fill('2025-01'),...Array(15).fill('2025-02'),...Array(15).fill('2025-03'),...Array(3).fill('2025-04'),...Array(3).fill('2025-05'),...Array(3).fill('2025-06')].join('\n') + '\n';
    git.run.mockReturnValue(lines);
    const result = await collect(REPO, { since: '2025-01-01' });
    expect(result.trend).toBe('declining');
  });
  test('returns stable when fewer than 6 months of data', async () => {
    git.run.mockReturnValue('2025-04\n2025-05\n');
    const result = await collect(REPO, { since: '2025-04-01' });
    expect(result.trend).toBe('stable');
  });
  test('returns empty arrays when no commits', async () => {
    git.run.mockReturnValue('');
    const result = await collect(REPO, { since: '2025-04-01' });
    expect(result.months).toEqual([]);
    expect(result.counts).toEqual([]);
    expect(result.trend).toBe('stable');
  });
});
