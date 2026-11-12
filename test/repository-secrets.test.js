'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { checkRepository } = require('../scripts/check-secrets');
const checker = path.resolve(__dirname, '../scripts/check-secrets.js');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'clwy-secret-check-'));
  execFileSync('git', ['init', '--quiet', root]);
  t.after(() => {
    const resolved = path.resolve(root);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith('clwy-secret-check-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

function track(root, filename, content) {
  const target = path.join(root, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  execFileSync('git', ['add', '--force', '--', filename], { cwd: root });
}

test('ignored local environment files and empty templates pass', t => {
  const root = fixture(t);
  track(root, '.gitignore', '.env\n.env.*\n!.env.example\n');
  track(root, '.env.example', 'SECRET=\nDB_PASSWORD="" # intentionally empty\n');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=local-fixture-value\n');
  assert.deepEqual(checkRepository(root), []);
});

test('force-added environment files fail without exposing their contents', t => {
  const root = fixture(t);
  const value = 'fixture-value-that-must-not-appear-in-output';
  track(root, '.env.production', 'SECRET=' + value + '\n');
  const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /local environment file is tracked/);
  assert.ok(!result.stderr.includes(value));
  assert.ok(!result.stdout.includes(value));
});

test('nonempty credentials in either template form are rejected', t => {
  const root = fixture(t);
  const value = 'another-fixture-value-never-log';
  track(root, '.env.example', 'SECRET="' + value + '"\n');
  track(root, '.env.production.example', 'DB_PASSWORD=' + value + '\n');
  const findings = checkRepository(root);
  assert.equal(findings.length, 2);
  assert.ok(!JSON.stringify(findings).includes(value));
});

test('legacy JSON configuration is rejected even after adding ignore rules', t => {
  const root = fixture(t);
  track(root, 'config/config.json', '{"development":{"password":"fixture-only"}}\n');
  track(root, '.gitignore', 'config/config.json\n');
  assert.ok(checkRepository(root).some(finding => finding.path === 'config/config.json'));
});
