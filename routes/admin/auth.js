const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { Op } = require('sequelize');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
/**
 * 管理员登录
 * POST /admin/auth/sign_in
 */
router.post('/sign_in', async (req, res) => {
    try {
        // 生成32位随机字符串


        // 1. 接收数据  login可以是邮箱，也可以是用户名
        const { login, password } = req.body;


        // 2. 判断是否输入邮箱或用户名
        if (!login) {
            throw new BadRequestError('邮箱/用户名必须填写');
        }

        // 判断是否输入密码
        if (!password) {
            throw new BadRequestError('密码必须填写');
        }

        // 3 .查询数据库里是否有输入的邮箱或用户名
        // 定义条件
        const condition = {
            where: {
                [Op.or]: [  // or 邮箱或用户名有一个就能查出来
                    {email:login},
                    {username: login}
                ]
            }
        }
        // 4. 查询用户
        const user = await User.findOne(condition);
        if(!user) {
            throw new NotFoundError('用户不存在无法登录');
        }

        // 5. 验证密码
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('密码错误');
        }

        // 验证是否管理员
        if (user.role !== 100) {
            throw new UnauthorizedError('您没有权限登录管理员后台');
        }

        // 生成身份验证令牌
        // data: 要生成的token数据 这里是 user.id
        // secret: 自定义的密钥  配置在env里
        // expiresIn  有效期   30d  d是天
        const token = jwt.sign({
                userId: user.id
            }, process.env.SECRET, { expiresIn: '30d' }
        );
        success(res, '登录成功', {token});

    } catch (error) {
        failure(res, error);
    }
});

module.exports = router;
