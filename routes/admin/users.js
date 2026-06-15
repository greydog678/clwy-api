// 导入express
const express = require('express');
// 引入模型
const { User } = require('../../models');
const {Op} = require("sequelize");
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询用户列表
router.get('/', async(req, res) => {
    try {
        // 从请求中获取查询字符串
        const query = req.query;

        // 分页
        // 1.当前是第几页，如过不传，那就是第一页
        const currentPage = Math.abs(Number(query.currentPage)) || 1;
        // 2.每页显示多少条数据，如过不传，那就显示10条
        const pageSize = Math.abs(Number(query.pageSize)) || 10;
        // 3.计算offset
        const offset = (currentPage - 1) * pageSize;

        // 4.定义查询条件
        const condition = {
            order: [['id', 'DESC']],
            limit: pageSize,
            offset: offset
        }

        // 模糊查询
        if (query.email) {
            condition.where = {
                title: {
                    [Op.eq]: query.email
                }
            }
        }

        if(query.username) {
            condition.where = {
                username: {
                    [Op.eq]: query.username
                }
            }
        }

        if (query.nickname) {
            condition.where = {
                nickname: {
                    [Op.like]: `%${ query.nickname }%`
                }
            }
        }
        if(query.role) {
            condition.where = {
                role: {
                    [Op.eq]: query.role
                }
            }
        }


        // 查询  count是查询的总数   rows是查询出来的数据
        const {count, rows} = await User.findAndCountAll(condition);

        // 响应接口
        success(res, '查询用户列表成功', {
            users: rows,
            pagination: {
                total: count,
                currentPage,
                pageSize,
            }
        })
    }catch(error) {
        failure(res, error);
    }
})



// 查询用户详情
router.get('/:id', async (req, res) => {
    try{
        // 查询当前用户
        const user = await getUser(req);
        success(res, '查询用户成功', {user})
    }catch(error) {
        failure(res, error);
    }
})

// 创建用户
router.post('/', async(req, res) => {
    try {
        // 白名单过滤
        const body = filterBody(req);

        // 从白名单中获取title和content
        const user = await User.create(body);
        // 200和201都是成功的意思， 201另一层意思是创建了新的资源
        success(res, '创建用户成功', {user}, 201);
    }catch(error) {
        failure(res, error)
    }
})


// 更新用户
router.put('/:id', async(req, res) => {
    try{
        // 查询当前用户
        const user = await getUser(req);
        // 白名单过滤
        const body = filterBody(req);
        // 更新用户
        await user.update(body);
        // 响应
        success(res, '更新用户成功', {user});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前用户
async function getUser(req) {
    // 获取用户ID
    const { id } = req.params;
    // 查询当前用户
    const user = await User.findByPk(id);
    // 如果没有找到，就抛出异常
    if (!user) {
        throw new NotFoundError(`ID: ${id}的用户列表未找到`);
    }
    return user;
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.nickname,
        sex: req.body.sex,
        company: req.body.company,
        introduce: req.body.introduce,
        role: req.body.role,
        avatar: req.body.avatar
    }
}



// 暴露路由
module.exports = router;