import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

// The user's approved template-1 baseline. No browser/dependency installation required.
const baselineCommit = 'ac98eafb9fee6c1c7f9b12939dc186a6b09bc68d';
const before = execFileSync('git', ['show', `${baselineCommit}:app/index.html`], {encoding: 'utf8'}).replaceAll('\r\n', '\n');
const after = readFileSync('app/index.html', 'utf8').replaceAll('\r\n', '\n');

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name}`);
  // Functions in this baseline have balanced braces, including their template literals.
  let at = source.indexOf('{', start) + 1, depth = 1;
  while (depth && at < source.length) {
    if (source[at] === '{') depth++;
    if (source[at] === '}') depth--;
    at++;
  }
  assert.equal(depth, 0, `Unclosed ${name}`);
  return source.slice(start, at);
}

const unchanged = [
  'drawStyleV3', 'drawVerticalWatermark', 'drawBrandMark', 'drawWatermarkLogo',
  'drawWatermarkTime', 'drawWatermarkAddress', 'drawWatermarkFullName',
  'loadReferenceClock', 'wrapManualLines', 'drawTextLines', 'drawShield',
  'download', 'canvasToBlob', 'downloadBlob', 'shareImageIfAvailable',
  'openImageSaveGuide', 'isIOS', 'isAndroid', 'activate', 'autoCheckKey'
];
for (const name of unchanged) assert.equal(functionSource(after, name), functionSource(before, name), `${name} must remain unchanged`);

for (const match of after.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) new Function(match[1]);
new Function(readFileSync('app/attendance-template.js', 'utf8'));
const markup = after.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '');
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate DOM IDs');
for (const name of ['Logo', 'Title', 'Art', 'Tags', 'Time', 'Address', 'Coordinates', 'Map']) {
  assert(ids.includes(`attendanceToggle${name}`), `Missing template-2 control ${name}`);
}
console.log(`PASS: ${unchanged.length} template-1/shared functions unchanged, scripts parse, controls have distinct IDs.`);
