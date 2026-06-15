// 导入express
const express = require('express');
// 引入模型
const { Course, Category, User, Chapter  } = require('../../models');
const {Op} = require("sequelize");
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询课程列表
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
            ...getCondition(),
            order: [['id', 'DESC']],
            limit: pageSize,
            offset: offset
        }

        // 模糊查询
        if (query.categoryId) {
            condition.where = {
                title: {
                    [Op.eq]: query.categoryId
                }
            }
        }

        if (query.userId) {
            condition.where = {
                userId: {
                    [Op.eq]: query.userId
                }
            }
        }

        if (query.name) {
            condition.where = {
                name: {
                    [Op.like]: `%${query.name}%`
                }
            }
        }

        if (query.recommended) {
            condition.where = {
                recommended: {
                    // 需要转布尔值
                    [Op.eq]: query.recommended === 'true'
                }
            }
        }

        if (query.introductory) {
            condition.where = {
                introductory: {
                    [Op.eq]: query.introductory === 'true'
                }
            }
        }


        // 查询  count是查询的总数   rows是查询出来的数据
        const {count, rows} = await Course.findAndCountAll(condition);

        // 响应接口
        success(res, '查询课程列表成功', {
            courses: rows,
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



// 查询课程详情
router.get('/:id', async (req, res) => {
    try{
        // 查询当前课程
        const course = await getCourse(req);
        success(res, '查询课程成功', {course})
    }catch(error) {
        failure(res, error);
    }
})

// 创建课程
router.post('/', async(req, res) => {
    try {
        // 白名单过滤
        const body = filterBody(req);

        // 获取当前登录的ID
        body.userId = req.user.id;

        // 从白名单中获取title和content
        const course = await Course.create(body);
        // 200和201都是成功的意思， 201另一层意思是创建了新的资源
        success(res, '创建课程成功', {course}, 201);
    }catch(error) {
        failure(res, error)
    }
})

// 删除课程
router.delete('/:id', async(req, res) => {
    try{
        // 查询当前课程
        const course = await getCourse(req);

        const count = await Chapter.count({where: { courseId: req.params.id }});

        if (count > 0) {
            return res.status(400).json({ message: '当前课程有章节，无法删除' });
        }



        // 删除课程
        await course.destroy();
        // 响应
        success(res, '删除课程成功')
    }catch(error) {
        failure(res, error);
    }
})

// 更新课程
router.put('/:id', async(req, res) => {
    try{
        // 查询当前课程
        const course = await getCourse(req);
        // 白名单过滤
        const body = filterBody(req);
        // 更新课程
        await course.update(body);
        // 响应
        success(res, '更新课程成功', {course});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前课程
async function getCourse(req) {
    // 获取课程ID
    const { id } = req.params;
    // 调用公共函数 获取关联分类、用户数据
    const condition = getCondition();
    // 查询当前课程
    const course = await Course.findByPk(id, condition);
    // 如果没有找到，就抛出异常
    if (!course) {
        throw new NotFoundError(`ID: ${id}的课程列表未找到`);
    }
    return course;
}

// 公共函数：关联分类、用户数据
function getCondition() {
    return {
        attributes: {exclude: ['CategoryId', 'UserId']},
        include: [
            {
                model: Category,
                as: 'category',
                attributes:['id', 'name']
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'avatar']

            }
        ],
    }
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        categoryId: req.body.categoryId,
        name: req.body.name,
        image: req.body.image,
        recommended: req.body.recommended,
        introductory: req.body.introductory,
        content: req.body.content
    }
}



// 暴露路由
module.exports = router;