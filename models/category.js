const moment = require('moment');
moment.locale('zh-cn');
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // 每个分类可以有很多课程
      models.Category.hasMany(models.Course, {as: 'courses'})
    }
  }
  Category.init({
    name:  {
      type: DataTypes.STRING,
      allowNull: false,  // 数据库层面的结构约束，如果输入的值是null数据库会直接报错, 这是最后的防线
      validate: {        
        notNull: { msg: '名称必须填写'}, // 这是 Sequelize 的验证规则，在写入数据库之前检查，返回自定义错误信息
        notEmpty: {msg: '名称不能为空'}, // 字符串验证， ""空字符串会报错。
        len: {args:[2, 45], msg: '长度必须是2~45之间'},
        async isUnique(value) {
          const user = await Category.findOne({where: {name: value}});
          if (user) {
            throw new Error('名称已经存在，请选择其他名称');
          }
        }
      }
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {msg: '排序必须填写'},
        isInt: {msg: '排序必须为整数'},
        isPositive(value) {  // 自定义验证
          if (value <= 0) {
            throw new Error('排序必须是大于0');
          }
        }
      }
    },
    createAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('createdAt')).format('LL');
      }
    },
    updateAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('update')).format('LL')
      }
    }

  }, {
    sequelize,
    modelName: 'Category',
  });
  return Category;
};