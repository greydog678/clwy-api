const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const { failure } = require('../utils/responses');

module.exports = async(req, res, next) => {
    try{
        // 1. 判断token是否存在
        const { authorization } = req.headers;
        if (!authorization) {
            throw new UnauthorizedError('当前接口需要认证才能访问');
        }

        const token = authorization.replace('Bearer ', '');

        // 2. 验证token是否正确
        const decoded = jwt.verify(token, process.env.SECRET);

        // 3. 从jwt中，解析出之前存入的userId
        const { userId } = decoded;

        // 4. 如果通过验证， 将userId挂载到req上，方便后续中间件或路由使用
        req.userId = userId;

        next();



    }catch(error) {
        failure(res, error);
    }

}