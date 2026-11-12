'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

// Isolate configuration checks from the developer's environment and .env file.
function run(source, values = {}, args = []) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (name === 'SECRET' || name === 'NODE_ENV' || name.startsWith('DB_') || name.startsWith('SEED_')) {
      delete env[name];
    }
  }
  return spawnSync(process.execPath, ['-e', source, '--', ...args], {
    cwd: root,
    env: { ...env, ...values },
    encoding: 'utf8'
  });
}

// Disable local .env loading inside isolated configuration checks.
const isolateDotenv = "require('dotenv').config = () => ({ parsed: {} });\n";

test('server fails before listening when SECRET is missing, blank or short; errors redact values', () => {
  for (const value of [undefined, '', '   ', 'short-test-secret']) {
    const result = run(isolateDotenv + "require('./app');", value === undefined ? {} : { SECRET: value });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SECRET 必须设置/);
    if (value && value.trim()) assert.ok(!result.stderr.includes(value));
  }
  const secret = crypto.randomBytes(32).toString('hex');
  const valid = run(isolateDotenv + "require('./config/auth');", { SECRET: secret });
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(valid.stdout, '');
  const whitespace = run(isolateDotenv + "require('./config/auth');", { SECRET: ' ' + secret });
  assert.notEqual(whitespace.status, 0);
  assert.ok(!whitespace.stderr.includes(secret));
});

test('server and migration CLI share environment-based database configuration without requiring SECRET', () => {
  const source = isolateDotenv + `
    const assert = require('node:assert/strict');
    const cli = require('./.sequelizerc');
    const configs = require(cli.config);
    for (const name of ['development', 'test', 'production']) {
      assert.equal(configs[name].username, process.env.DB_USER);
      assert.equal(configs[name].password, process.env.DB_PASSWORD);
      assert.equal(configs[name].database, process.env.DB_NAME);
      assert.equal(configs[name].port, 3307);
      assert.equal(configs[name].host, 'database.internal');
    }
  `;
  const values = {
    DB_USER: 'test-app',
    DB_PASSWORD: crypto.randomBytes(16).toString('hex'),
    DB_NAME: 'test_database',
    DB_HOST: 'database.internal',
    DB_PORT: '3307'
  };
  const result = run(source, values);
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['DB_USER', 'DB_PASSWORD']) {
    const missing = { ...values };
    delete missing[name];
    const failure = run(isolateDotenv + "require('./config/config');", missing);
    assert.notEqual(failure.status, 0);
    assert.match(failure.stderr, new RegExp(name + ' 必须通过环境变量配置'));
    assert.ok(!failure.stderr.includes(values.DB_PASSWORD));
  }
  for (const port of ['0', '65536', '3.5', 'not-a-port']) {
    const failure = run(isolateDotenv + "require('./config/config');", { ...values, DB_PORT: port });
    assert.notEqual(failure.status, 0);
    assert.match(failure.stderr, /DB_PORT 必须/);
  }
});

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('both login routes and authentication middleware use the new key; old and disallowed tokens fail', async () => {
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const password = crypto.randomBytes(16).toString('hex');
  const secret = crypto.randomBytes(32).toString('hex');
  process.env.SECRET = secret;
  // Stub persistence only; exercise actual route handlers, signing and verification.
  const user = { id: 7, role: 100, password: bcrypt.hashSync(password, 4) };
  const modelsPath = require.resolve('../models');
  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: { User: { findOne: async () => user, findByPk: async id => id === user.id ? user : null } }
  };
  const userAuth = require('../middlewares/user-auth');
  const adminAuth = require('../middlewares/auth');
  for (const routePath of ['../routes/auth', '../routes/admin/auth']) {
    const router = require(routePath);
    const login = router.stack.find(layer => layer.route && layer.route.path === '/sign_in').route.stack[0].handle;
    const res = response();
    await login({ body: { login: 'test-admin', password } }, res);
    assert.equal(res.statusCode, 200);
    const token = res.body.data.token;
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    assert.equal(payload.userId, user.id);
    assert.equal(payload.exp - payload.iat, 30 * 24 * 60 * 60);
    for (const middleware of [userAuth, adminAuth]) {
      let nextCalls = 0;
      const req = { headers: { authorization: 'Bearer ' + token } };
      await middleware(req, response(), () => nextCalls++);
      assert.equal(nextCalls, 1);
      assert.equal(req.userId || req.user.id, user.id);
    }
  }
  const previousSecret = crypto.randomBytes(32).toString('hex');
  const rejected = [
    jwt.sign({ userId: user.id }, previousSecret, { algorithm: 'HS256', expiresIn: '30d' }),
    jwt.sign({ userId: user.id }, secret, { algorithm: 'HS384', expiresIn: '30d' }),
    jwt.sign({ userId: user.id }, secret, { algorithm: 'HS512', expiresIn: '30d' }),
    jwt.sign({ userId: user.id }, null, { algorithm: 'none' }),
    jwt.sign({ userId: user.id }, secret, { algorithm: 'HS256', expiresIn: -1 })
  ];
  for (const middleware of [userAuth, adminAuth]) {
    for (const token of rejected) {
      const res = response();
      let nextCalls = 0;
      await middleware({ headers: { authorization: 'Bearer ' + token } }, res, () => nextCalls++);
      assert.equal(res.statusCode, 401);
      assert.equal(nextCalls, 0);
    }
    const missing = response();
    await middleware({ headers: {} }, missing, () => assert.fail('Missing token must fail'));
    assert.equal(missing.statusCode, 401);
  }
  user.role = 0;
  const denied = response();
  await adminAuth({ headers: { authorization: 'Bearer ' + jwt.sign({ userId: user.id }, secret) } }, denied,
    () => assert.fail('Ordinary users must not access admin endpoints'));
  assert.equal(denied.statusCode, 401);
});

test('demo seed requires explicit passwords, hashes them, and refuses production without database writes', () => {
  const source = isolateDotenv + `
    const assert = require('node:assert/strict');
    const bcrypt = require('bcryptjs');
    const seed = require('./seeders/20260312072907-user');
    const inserted = [];
    seed.up({ bulkInsert: async (table, rows) => inserted.push(...rows) }).then(() => {
      assert.equal(inserted.length, 4);
      for (const row of inserted) {
        const expected = row.role === 100 ? process.env.SEED_ADMIN_PASSWORD : process.env.SEED_USER_PASSWORD;
        assert.notEqual(row.password, expected);
        assert.ok(bcrypt.compareSync(expected, row.password));
      }
    }).catch(error => {
      assert.equal(inserted.length, 0);
      console.error(error.message);
      process.exitCode = 1;
    });
  `;
  const values = {
    NODE_ENV: 'development',
    SEED_ADMIN_PASSWORD: crypto.randomBytes(16).toString('hex'),
    SEED_USER_PASSWORD: crypto.randomBytes(16).toString('hex')
  };
  const valid = run(source, values);
  assert.equal(valid.status, 0, valid.stderr);
  for (const name of ['SEED_ADMIN_PASSWORD', 'SEED_USER_PASSWORD']) {
    const missing = { ...values };
    delete missing[name];
    const failure = run(source, missing);
    assert.notEqual(failure.status, 0);
    assert.match(failure.stderr, new RegExp(name + ' 必须设置'));
  }
  for (const args of [[], ['--env', 'production'], ['--env=production']]) {
    const production = run(source, { ...values, NODE_ENV: args.length ? 'development' : 'production' }, args);
    assert.notEqual(production.status, 0);
    assert.match(production.stderr, /生产环境禁止创建演示账号/);
  }
  const shared = run(source, { ...values, SEED_USER_PASSWORD: values.SEED_ADMIN_PASSWORD });
  assert.notEqual(shared.status, 0);
  assert.match(shared.stderr, /必须使用不同的密码/);
});
