'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const project = path.resolve(__dirname, '..');
const dependencyRoot = path.dirname(path.dirname(require.resolve('dotenv/package.json')));

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'clwy-config-env-'));
  fs.mkdirSync(path.join(root, 'config'));
  for (const filename of ['auth.js', 'env.js']) {
    fs.copyFileSync(path.join(project, 'config', filename), path.join(root, 'config', filename));
  }
  t.after(() => {
    const resolved = path.resolve(root);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith('clwy-config-env-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return root;
}

function run(root, injected, expected) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (name === 'SECRET' || name.startsWith('DOTENV_')) delete env[name];
  }
  Object.assign(env, injected, { NODE_PATH: dependencyRoot, EXPECTED_AUTH_SECRET: expected });
  const source = "const assert = require('node:assert/strict');" +
    "const {secret} = require(process.argv[1]);" +
    "assert.equal(secret, process.env.EXPECTED_AUTH_SECRET);";
  return spawnSync(process.execPath, ['-e', source, path.join(root, 'config', 'auth.js')], {
    cwd: os.tmpdir(), env, encoding: 'utf8'
  });
}

test('real dotenv reads the repository root even when launched elsewhere', t => {
  const root = fixture(t);
  const value = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=' + value + '\n');
  const result = run(root, {}, value);
  assert.equal(result.status, 0, 'Repository-root .env must load successfully.');
  assert.equal(result.stdout, '');
  assert.ok(!result.stderr.includes(value));
});

test('injected SECRET takes precedence over a real .env file', t => {
  const root = fixture(t);
  const fileValue = crypto.randomBytes(32).toString('hex');
  const injectedValue = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=' + fileValue + '\n');
  const result = run(root, { SECRET: injectedValue }, injectedValue);
  assert.equal(result.status, 0, 'Injected environment value must win.');
  assert.equal(result.stdout, '');
  assert.ok(!result.stderr.includes(injectedValue));
});

test('empty injected SECRET fails closed despite a valid .env fallback', t => {
  const root = fixture(t);
  const value = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=' + value + '\n');
  const result = run(root, { SECRET: '' }, '');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SECRET 必须设置/);
  assert.ok(!result.stderr.includes(value));
});
