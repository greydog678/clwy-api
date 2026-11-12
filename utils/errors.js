// 存放各种自定义的错误类

// 400错误类 客户端发送的请求有问题，服务器拒绝处理. 请求语法错误、参数格式不对、JSON 格式非法等
// name    → 错误的"类型"  → 是什么错？
// message → 错误的"描述"  → 哪里错了？
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError'
    }
}

// 401错误类  客户端请求了需要认证的资源，但没有提供凭证或凭证无效。  "我不知道你是谁，请先证明你的身份"
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

// 404错误类 资源不存在  你请求的东西，服务器上根本找不到
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError'
    }
}

module.exports = {
    BadRequestError,
    UnauthorizedError,
    NotFoundError
}
