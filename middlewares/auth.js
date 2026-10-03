const jwt = require('jsonwebtoken');
const { secret } = require('../config/auth');
const { User } = require('../models');
const { UnauthorizedError } = require('../utils/errors');
const { success, failure } = require('../utils/responses');

module.exports = async (req, res, next) => {
    try {
        // 判断Token是否存在
        const { authorization } = req.headers;
        if (!authorization) {
            throw new UnauthorizedError('当前接口需要认证才能登录');
        }
        const token = authorization.replace('Bearer ', '');

        // 验证token是否正确
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        // 从jwt中，解析出之前存入的userId
        const { userId } = decoded;

        // 查询一下，当前用户
        const user = await User.findByPk(userId);
        if (!user) {
            throw new UnauthorizedError('用户不存在');
        }
        // 验证当前用户是否管理员
        if(user.role !== 100) {
            throw new UnauthorizedError('您没有权限使用当前接口');
        }
        // 如果通过验证，将user对象挂载到req上， 方便后续中间件或路由使用
        req.user = user;
        // 一定要加上next(), 才能继续进入到后续中间件或路由
        next();
    } catch (error) {
        failure(res, error);
    }
};
