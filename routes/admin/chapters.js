// 导入express
const express = require('express');
// 引入模型
const { Chapter, Course} = require('../../models');
const {Op} = require("sequelize");
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询章节列表
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

        if (!query.courseId) {
            throw new Error('获取章节列表失败， 课程ID不能为空');
        }


        // 4.定义查询条件
        const condition = {
            ...getCondition(),
            // 从小到大排序， 当rank值相同时，就用id排序
            order: [['rank', 'ASC'],  ['id', 'ASC']],
            limit: pageSize,
            offset: offset
        }

        // 模糊查询
        if (query.title) {
            condition.where = {
                title: {
                    [Op.like]: `%${query.title}%`
                }
            }
        }


        // 查询  count是查询的总数   rows是查询出来的数据
        const {count, rows} = await Chapter.findAndCountAll(condition);

        // 响应接口
        success(res, '查询章节列表成功', {
            chapters: rows,
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



// 查询章节详情
router.get('/:id', async (req, res) => {
    try{
        // 查询当前章节
        const chapter = await getChapter(req);
        success(res, '查询章节成功', {chapter})
    }catch(error) {
        failure(res, error);
    }
})

// 创建章节
router.post('/', async(req, res) => {
    try {
        // 白名单过滤
        const body = filterBody(req);

        // 从白名单中获取title和content
        const chapter = await Chapter.create(body);
        // 200和201都是成功的意思， 201另一层意思是创建了新的资源
        success(res, '创建章节成功', {chapter}, 201);
    }catch(error) {
        failure(res, error)
    }
})

// 删除章节
router.delete('/:id', async(req, res) => {
    try{
        // 查询当前章节
        const chapter = await getChapter(req);
        // 删除章节
        await chapter.destroy();
        // 响应
        success(res, '删除章节成功')
    }catch(error) {
        failure(res, error);
    }
})

// 更新章节
router.put('/:id', async(req, res) => {
    try{
        // 查询当前章节
        const chapter = await getChapter(req);
        // 白名单过滤
        const body = filterBody(req);
        // 更新章节
        await chapter.update(body);
        // 响应
        success(res, '更新章节成功', {chapter});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前章节
async function getChapter(req) {
    // 获取章节ID
    const { id } = req.params;
    const condition = getCondition();

    // 查询当前章节
    const chapter = await Chapter.findByPk(id, condition);
    // 如果没有找到，就抛出异常
    if (!chapter) {
        throw new NotFoundError(`ID: ${id}的章节列表未找到`);
    }
    return chapter;
}

// 关联课程数据  公共的关联查询条件
function getCondition() {
    return {
        attributes: { exclude: ['CourseId']},
        include: [
            {
                model: Course,
                as: 'course',
                attributes: ['id', 'name']
            }
        ]
    }
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        courseId: req.body.courseId,
        title: req.body.title,
        content: req.body.content,
        video: req.body.video,
        rank: req.body.rank
    }
}



// 暴露路由
module.exports = router;