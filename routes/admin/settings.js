// 导入express
const express = require('express');
// 引入模型
const { Setting } = require('../../models');
// 引入
const { NotFoundError } = require('../../utils/errors');
const { success, failure } = require('../../utils/responses');



// 创建路由
const router = express.Router();

// 查询系统设置详情
router.get('/', async (req, res) => {
    try{
        // 查询当前系统设置
        const setting = await getSetting();
        success(res, '查询系统设置成功', {setting})
    }catch(error) {
        failure(res, error);
    }
})

// 更新系统设置
router.put('/', async(req, res) => {
    try{
        // 查询当前系统设置
        const setting = await getSetting();
        // 白名单过滤
        const body = filterBody(req);
        // 更新系统设置
        await setting.update(body);
        // 响应
        success(res, '更新系统设置成功', {setting});
    }catch(error) {
        failure(res, error);
    }
})




// 公共方法：查询当前系统设置
async function getSetting() {
    // 查询当前系统设置
    const setting = await Setting.findOne();  // 查询数据库的第一条记录
    // 如果没有找到，就抛出异常
    if (!setting) {
        throw new NotFoundError(`初始系统设置未找到，请运行种子文件`);
    }
    return setting;
}


// 公共方法： 白名单过滤
function filterBody(req) {
    return {
        name: req.body.name,
        icp: req.body.icp,
        copyright: req.body.copyright
    }
}



// 暴露路由
module.exports = router;