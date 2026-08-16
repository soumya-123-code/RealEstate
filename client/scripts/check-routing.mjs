import assert from 'node:assert/strict';
import { sanitizeAppPath } from '../src/lib/sanitizeAppPath.js';

const cases = [
  ['/list', '/list'],
  ['/properties', '/list'],
  ['/properties?type=APARTMENT', '/list?propertyType=APARTMENT'],
  ['/property/123', '/property/123'],
  ['/property/undefined', '/list'],
  ['/property/null', '/list'],
  ['/property/123/extra', '/list'],
  ['https://example.com', '/list'],
  ['//evil.example/path', '/list'],
  ['/blog/my-post', '/blog/my-post'],
  ['/blog/', '/list'],
];

for (const [input, expected] of cases) {
  assert.equal(sanitizeAppPath(input), expected, `${input} should resolve to ${expected}`);
}

console.log(`Routing checks passed: ${cases.length}`);
