// 成功响应函数  code如果不传  自定义为200
function success(res, message, data = {}, code = 200) {
    res.status(code).json({
        status: true,
        message,
        data
    });
}

// 失败响应函数  res参数用来响应   error把catch捕获的错误传递进来
function failure(res, error) {
    // 表单验证错误 error.name是异常的类型 SequelizeValidationError肯定是数据验证错误了
    if (error.name === 'SequelizeValidationError') {
        //  map() 是数组方法。   遍历数组，把每一项转换成你想要的形式，并返回一个新数组。
        const errors = error.errors.map(e => e.message);
        // 响应   400的意思是请求中存在语法错误
        res.status(400).json({
            status: false,
            message: '请求参数错误',
            errors
        })
    }

    // 400 请求参数错误
    if (error.name === 'BadRequestError') {
        return res.status(400).json({
            status: false,
            message: '请求参数错误',
            errors: [error.message]
        });
    }



    // 响应401  认证失败
    if(error.name === 'UnauthorizedError') {
        return res.status(401).json({
            status: false,
            message: '认证失败',
            errors: [error.message]
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: false,
            message: '认证失败',
            errors: ['您提交的token错误']
        })
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: false,
            message: '认证失败',
            errors: ['您的token已过期']
        })
    }


    // 处理404错误 数据未找到
    if (error.name === 'NotFoundError') {
        return res.status(404).json({
            status: false,
            message: '资源不存在',
            errors: [ error.message]
        })
    }

    // 其他错误 统一用500
    res.status(500).json({
        status: false,
        message: '服务器错误',
        errors: [ error.message]
    });
}

module.exports = {
    success,
    failure,
}