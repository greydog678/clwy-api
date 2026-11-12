// 导入express
const express = require('express');
// 引入模型
const { Category, Course} = require('../../models');
const {Op} = require("sequelize");
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询分类列表
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
            order: [['rank', 'ASC'], ['id', 'ASC']],
            limit: pageSize,
            offset: offset
        }

        // 模糊查询
        if (query.name) {
            condition.where = {
                name: {
                    [Op.like]: `%${query.name}%`
                }
            }
        }


        // 查询  count是查询的总数   rows是查询出来的数据
        const {count, rows} = await Category.findAndCountAll(condition);

        // 响应接口
        success(res, '查询分类列表成功', {
            categories: rows,
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



// 查询分类详情
router.get('/:id', async (req, res) => {
    try{
        // 查询当前分类
        const category = await getCategory(req);
        success(res, '查询分类成功', {category})
    }catch(error) {
        failure(res, error);
    }
})

// 创建分类
router.post('/', async(req, res) => {
    try {
        // 白名单过滤  从白名单中获取name和rank
        const body = filterBody(req);
        
        // 创建分类
        const category = await Category.create(body);
        // 200和201都是成功的意思， 201另一层意思是创建了新的资源
        success(res, '创建分类成功', {category}, 201);
    }catch(error) {
        failure(res, error)
    }
})

// 删除分类
router.delete('/:id', async(req, res) => {
    try{
        // 查询当前分类
        const category = await getCategory(req);

        // noinspection JSCheckFunctionSignatures
        const count = await Course.count({where: { categoryId: req.params.id }});

        if (count > 0) {
            return res.status(400).json({ message: '当前分类有课程，无法删除' });
        }


        // 删除分类
        await category.destroy();
        // 响应
        success(res, '删除分类成功')
    }catch(error) {
        failure(res, error);
    }
})

// 更新分类
router.put('/:id', async(req, res) => {
    try{
        // 查询当前分类
        const category = await getCategory(req);
        // 白名单过滤
        const body = filterBody(req);
        // 更新分类
        await category.update(body);
        // 响应
        success(res, '更新分类成功', {category});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前分类
async function getCategory(req) {
    // 获取分类ID
    const { id } = req.params;

    // 查询当前分类
    const category = await Category.findByPk(id);
    // 如果没有找到，就抛出异常
    if (!category) {
        throw new NotFoundError(`ID: ${id}的分类列表未找到`);
    }
    return category;
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        name: req.body.name,
        rank: req.body.rank
    }
}



// 暴露路由
module.exports = router;