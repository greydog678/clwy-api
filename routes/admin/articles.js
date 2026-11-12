// 导入express
const express = require('express');
// 引入模型
const { Article } = require('../../models');
const {Op} = require("sequelize");
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询文章列表
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
        if (query.title) {
            condition.where = {
                title: {
                    [Op.like]: `%${query.title}%`
                }
            }
        }


        // 查询  count是查询的总数   rows是查询出来的数据
        const {count, rows} = await Article.findAndCountAll(condition);

        // 响应接口
        success(res, '查询文章列表成功', {
            articles: rows,
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



// 查询文章详情
router.get('/:id', async (req, res) => {
    try{
        // 查询当前文章
        const article = await getArticle(req);
        success(res, '查询文章成功', {article})
    }catch(error) {
        failure(res, error);
    }
})

// 创建文章
router.post('/', async(req, res) => {
    try {
        // 白名单过滤
        const body = filterBody(req);

        // 从白名单中获取title和content
        const article = await Article.create(body);
        // 200和201都是成功的意思， 201另一层意思是创建了新的资源
        success(res, '创建文章成功', {article}, 201);
    }catch(error) {
        failure(res, error)
    }
})

// 删除文章
router.delete('/:id', async(req, res) => {
    try{
        // 查询当前文章
        const article = await getArticle(req);
        // 删除文章
        await article.destroy();
        // 响应
        success(res, '删除文章成功')
    }catch(error) {
        failure(res, error);
    }
})

// 更新文章
router.put('/:id', async(req, res) => {
    try{
        // 查询当前文章
        const article = await getArticle(req);
        // 白名单过滤
        const body = filterBody(req);
        // 更新文章
        await article.update(body);
        // 响应
        success(res, '更新文章成功', {article});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前文章
async function getArticle(req) {
    // 获取文章ID
    const { id } = req.params;
    // 查询当前文章
    const article = await Article.findByPk(id);
    // 如果没有找到，就抛出异常
    if (!article) {
        throw new NotFoundError(`ID: ${id}的文章列表未找到`);
    }
    return article;
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        title: req.body.title,
        content: req.body.content
    }
}



// 暴露路由
module.exports = router;