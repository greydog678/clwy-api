'use strict';

require('./env');

for (const name of ['DB_USER', 'DB_PASSWORD']) {
  if (!process.env[name] || !process.env[name].trim()) {
    throw new Error(`${name} 必须通过环境变量配置。`);
  }
}

const port = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT 必须为 1 到 65535 之间的整数。');
}

module.exports = Object.fromEntries(['development', 'test', 'production'].map(env => [env, {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || `clwy_api_${env}`,
  host: process.env.DB_HOST || '127.0.0.1',
  port,
  dialect: 'mysql',
  ...(env === 'development' || process.env.DB_TIMEZONE
    ? { timezone: process.env.DB_TIMEZONE || '+04:00' }
    : {})
}]));
