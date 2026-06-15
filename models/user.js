'use strict';
const {
  Model
} = require('sequelize');


// 导入加密包
const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 每个用户可以发布很多课程
      models.User.hasMany(models.Course, {as: 'courses'})
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '邮箱必须填写'},
        notEmpty: { msg: '邮箱不能为空'},
        isEmail: { msg: '邮箱格式不正确'},
        async isUnique(value) {
          const user = await User.findOne({where: {email: value}});
          if (user) {
            throw new Error('邮箱已经存在， 请直接登录');
          }
        }

      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '用户名必须填写。' },
        notEmpty: { msg: '用户名不能为空。' },
        len:{args:[2, 45], msg: '用户名长度必须是2 ~ 45之间。'},
        async isUnique(value) {
          const user = await User.findOne({where: {username: value}});
          if (user) {
            throw new Error('用户名已经存在');
          }
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '密码必须填写。' },
        notEmpty: { msg: '密码不能为空。' },
        // set拦截 password 的赋值操作  不会执行user.password = '123456'， 而是调用set()
        set(value) {
          if(value.length >= 6 && value.length <=45) {
            // 把“明文密码 value” → 变成“加密后的字符串” → 再存进模型字段 password
            // this 指当前这条 Sequelize 模型实例（比如一个用户对象）
            // setDataValue 来自 Sequelize Model 实例的方法  直接给字段赋值（绕过 setter）
            this.setDataValue('password', bcrypt.hashSync(value, 10));
          }else {
            throw new Error('密码长度必须是6~45之间');
          }
        }
      }
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: '昵称必须填写。' },
        notEmpty: { msg: '昵称不能为空。' },
        len: { args: [2, 45], msg: '昵称长度必须是2 ~ 45之间。' }
      }
    },
    sex: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        notNull: { msg: '性别必须填写。' },
        notEmpty: { msg: '性别不能为空。' },
        isIn: { args: [[0, 1, 2]], msg: '性别的值必须是，男性：0 女性：1 未选择：2。' }
      }
    },
    company: DataTypes.STRING,
    introduce: DataTypes.TEXT,
    role: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        notNull: { msg: '用户组必须选择。' },
        notEmpty: { msg: '用户组不能为空。' },
        isIn: { args: [[0, 100]], msg: '用户组的值必须是，普通用户：0 管理员：100。' } // 限定值在规定的范围内
      }
    },
    avatar: {
      type: DataTypes.STRING,
      validate: {
        isUrl: { msg: '图片地址不正确。' }
      }
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};