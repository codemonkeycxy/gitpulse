const { render } = require('../../src/renderer/html');

const SAMPLE = {
  meta:         { repoName: 'test-repo', totalCommits: 100, sinceLabel: '12 months', generatedAt: new Date().toISOString() },
  churn:        { files: [] },
  momentum:     { months: [], counts: [], trend: 'stable' },
  contributors: { authors: [], total: 0, busFactor: 0 },
  silos:        { files: [] },
  firefighting: { months: [], counts: [], average: 0, spikes: [] },
};

describe('renderer.render', () => {
  test('returns a string starting with DOCTYPE', () => {
    const html = render(SAMPLE);
    expect(typeof html).toBe('string');
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  test('injects data JSON and removes placeholder', () => {
    const html = render(SAMPLE);
    expect(html).toContain('"repoName":"test-repo"');
    expect(html).not.toContain('"__GITPULSE_DATA__"');
  });

  test('inlines Chart.js and removes placeholder', () => {
    const html = render(SAMPLE);
    expect(html).not.toContain('__CHARTJS_CODE__');
    expect(html).not.toContain('cdn.jsdelivr.net');
    expect(html).toContain('Chart');
  });

  test('output has no external script src attributes', () => {
    const html = render(SAMPLE);
    expect(html).not.toMatch(/<script\s[^>]*src=/i);
  });
});
