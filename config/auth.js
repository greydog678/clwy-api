'use strict';

require('./env');

const secret = process.env.SECRET;
if (!secret || secret !== secret.trim() || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('SECRET 必须设置为至少 32 字节的随机密钥，且不能包含首尾空白。');
}

// Validate once at startup; never supply a fallback or log the value.
module.exports = Object.freeze({ secret });
