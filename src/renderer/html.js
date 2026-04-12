'use strict';

const fs   = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../../templates/report.html');
const CHARTJS_PATH  = path.join(__dirname, '../../node_modules/chart.js/dist/chart.umd.min.js');

/**
 * Render a gitpulse data object into a self-contained HTML string.
 * @param {object} data
 * @returns {string}
 */
function render(data) {
  let html      = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const chartJs = fs.readFileSync(CHARTJS_PATH, 'utf8');

  html = html.replace('__CHARTJS_CODE__', chartJs);
  html = html.replace('"__GITPULSE_DATA__"', JSON.stringify(data));

  return html;
}

module.exports = { render };
