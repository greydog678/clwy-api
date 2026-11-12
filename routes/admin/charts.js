const express = require('express');
const router = express.Router();
const { sequelize, User } = require('../../models');
const { Op } = require('sequelize');
const {NotFoundError, success, failure} = require('../../utils/responses')


// 统计用户性别
// GET /admin/charts/sex
router.get('/sex', async function(req, res) {
    try {
        const male = await User.count({where: {sex: 0}});
        const female = await User.count({where: {sex: 1}});
        const unknow = await User.count({where: {sex: 2}});

        const data = [
            {value: male, name:'男性'},
            {value: female, name:'女性'},
            {value: unknow, name: '未填写'}
        ];

        success(res, '查询用户性别成功', {data});

        success(res, '查询用户性别成功', {})
    }catch (error) {
        failure(res. error);
    }
})

module.exports = router;
