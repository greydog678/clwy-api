'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Article.init({
    title: {
      type: DataTypes.STRING, // string 到数据库里会自动变成varchar
      allowNull: false,  // 允许空是false
      validate: {  // 下面的错误信息会进入catch中
        notNull: {   // 如果用的表单根本就没传title过来
          msg: '标题必须存在'
        },
        notEmpty: {  //  用户传了title过来， 但是却没有值
          msg: '标题不能为空'
        },
        len: {   // 限定title的长度
          args: [2, 45],
          msg: '标题长度需要在2-45个字符之间'
        }
      }
    },
    content: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Article',
  });
  return Article;
};