'use strict';
const bcrypt = require('bcryptjs');
require('../config/env');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const productionCLI = process.argv.some((arg, index) =>
      arg === '--env=production' || (arg === '--env' && process.argv[index + 1] === 'production')
    );
    if (process.env.NODE_ENV === 'production' || productionCLI) {
      throw new Error('生产环境禁止创建演示账号。');
    }
    for (const name of ['SEED_ADMIN_PASSWORD', 'SEED_USER_PASSWORD']) {
      const value = process.env[name];
      if (!value || value.trim().length < 12 || value.length > 45) {
        throw new Error(`${name} 必须设置为 12 到 45 个字符的独立密码。`);
      }
    }
    if (process.env.SEED_ADMIN_PASSWORD === process.env.SEED_USER_PASSWORD) {
      throw new Error('管理员与普通演示用户必须使用不同的密码。');
    }
    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@clwy.cn',
        username: 'admin',
        password: bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD, 10),
        nickname: '超厉害的管理员',
        sex: 2,
        role: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user1@clwy.cn',
        username: 'user1',
        password: bcrypt.hashSync(process.env.SEED_USER_PASSWORD, 10),
        nickname: '普通用户1',
        sex: 0,
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user2@clwy.cn',
        username: 'user2',
        password: bcrypt.hashSync(process.env.SEED_USER_PASSWORD, 10),
        nickname: '普通用户2',
        sex: 0,
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user3@clwy.cn',
        username: 'user3',
        password: bcrypt.hashSync(process.env.SEED_USER_PASSWORD, 10),
        nickname: '普通用户3',
        sex: 1,
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }


};
