## 长乐未央 API

此项目为长乐未央公司开发的，专供学习 Node.js 的同学使用。项目使用 Node.js + Express + MySQL + Sequelize ORM。

项目课程地址：https://clwy.cn/courses/fullstack-node

## 配置环境变量

将 `.env.example` 复制为本机 `.env`，或由部署平台的密钥管理功能注入环境变量。`.env` 及其环境变体受 `.gitignore` 保护；示例文件只保留空密钥。

必须设置 `SECRET`、`DB_USER`、`DB_PASSWORD`；没有默认密钥、数据库密码或公开的初始账号密码。`SECRET` 缺失、少于 32 字节或包含首尾空白时，服务会在监听端口前拒绝启动。长度检查不能替代随机生成。

| 变量 | 用途 |
| --- | --- |
| `NODE_ENV` | 本地为 `development`；生产部署显式设置 `production` |
| `PORT` | 服务端口，默认 3000 |
| `SECRET` | JWT 签名与验签密钥，推荐 32 字节随机数据编码成 64 位十六进制字符串 |
| `DB_HOST` / `DB_PORT` | 数据库地址及端口，默认 `127.0.0.1:3306` |
| `DB_NAME` | 数据库名；未设置时使用 `clwy_api_<环境>` |
| `DB_USER` / `DB_PASSWORD` | 独立的数据库账号与密码，必须配置 |
| `DB_TIMEZONE` | 可选数据库时区；开发环境未设置时沿用 `+04:00` |
| `SEED_ADMIN_PASSWORD` / `SEED_USER_PASSWORD` | 仅运行开发/测试用户种子时需要，分别设置 12–45 个字符的密码 |

可在本机私密终端生成密钥（不要在 CI 或公开日志中运行）：

```shell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

将结果保存到本机 `.env` 的 `SECRET` 或部署密钥管理器。每个环境使用独立密钥；所有服务副本使用该环境同一版本。不要将生成结果粘贴到提交、聊天、截图或日志中。

## 配置数据库

应用和 Sequelize CLI 共用 `config/config.js`，从环境变量读取数据库配置；`.sequelizerc` 指定 CLI 配置路径。不要在受 Git 跟踪的配置文件中填写数据库密码。

从仓库旧版本升级时，先将原数据库账号、数据库名等非敏感配置迁入部署环境，并**轮换旧数据库密码**。生产使用权限受限的应用账号，避免使用数据库超级用户。

## 安装与运行

```shell
npm ci

# 创建本地数据库、建表。需具备相应权限。
npx sequelize-cli db:create --charset utf8mb4 --collate utf8mb4_general_ci
npx sequelize-cli db:migrate

# 仅在开发/测试环境设置两项 SEED_*_PASSWORD 后执行演示数据种子。
npx sequelize-cli db:seed:all

npm start
```

Sequelize CLI 需自行安装或由 `npx` 提供；生产迁移时使 `NODE_ENV=production` 与 `--env production` 一致，并确认 `DB_NAME` 指向生产库。不要在生产执行演示种子。用户种子检测到生产环境会拒绝写入；修改种子不会自动变更已经存在的账号密码。

访问地址：[http://localhost:3000](http://localhost:3000)。开发用户种子中的管理员用户名为 `admin`，密码由 `SEED_ADMIN_PASSWORD` 设置；普通演示用户密码由 `SEED_USER_PASSWORD` 设置。

## 安全验证和轮换

使用 Node.js 18 或更高版本运行：

```shell
npm test
```

测试覆盖启动配置校验、两个登录入口和鉴权中间件、轮换后旧密钥令牌失效、允许的 JWT 算法及演示种子保护。测试模拟数据库访问，不会连接或更改真实数据库。

泄露处置、部署检查和历史清理流程见 [安全配置与轮换说明](docs/security.md)。
