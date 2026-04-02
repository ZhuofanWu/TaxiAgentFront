# TaxiFront

`TaxiFront` 是 `TaxiAgent` 的前端项目，基于 Vue 3、Vite、TypeScript、Pinia 和 Vue Router，提供用户、司机、客服、管理员等多角色页面，以及订单、工单、知识库和 Agent 对话相关交互。

## 运行环境

- Node.js `^20.19.0 || >=22.12.0`
- npm
- 可用的高德地图 Web 端 Key / 安全密钥
- 已启动的 [`TaxiAgent` 后端](https://github.com/ZhuofanWu/TaxiAgent)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

先复制示例配置：

```bash
# macOS / Linux
cp .env.example .env

# PowerShell
Copy-Item .env.example .env
```

然后按实际环境修改 `.env`：

```dotenv
VITE_API_BASE_URL=http://localhost:8080
AMAP_KEY=your_amap_key_here
AMAP_SAFE_SECRET=your_amap_safe_secret_here

# Vite only exposes VITE_ prefixed vars to client
VITE_AMAP_KEY=${AMAP_KEY}
VITE_AMAP_SAFE_SECRET=${AMAP_SAFE_SECRET}
```

环境变量说明：

- `VITE_API_BASE_URL`：后端 API 基地址。默认对接本地 `TaxiAgent`，即 `http://localhost:8080`
- `AMAP_KEY`：高德地图 JS API Key
- `AMAP_SAFE_SECRET`：高德地图安全密钥
- `VITE_AMAP_KEY` / `VITE_AMAP_SAFE_SECRET`：前端实际读取的变量，示例里已通过前两项自动展开

### 3. 启动开发环境

```bash
npm run dev
```

默认启动后访问 Vite 输出的本地地址即可。

## 与 TaxiAgent 后端联调

前端默认假设 [`TaxiAgent`](https://github.com/ZhuofanWu/TaxiAgent) 运行在 `http://localhost:8080`。如果你还没有启动后端，至少需要按后端仓库 README 完成下面几步：

1. 准备 MySQL、Redis、MongoDB、Elasticsearch
2. 在后端的 `src/main/resources/application.yaml` 中填好数据库、模型、地图、天气、邮件等配置
3. 初始化后端 SQL
4. 在后端项目中执行：

```bash
mvn compile
mvn spring-boot:run
```

联调时建议按下面顺序检查：

1. 后端能正常启动，并监听 `http://localhost:8080`
2. 前端 `.env` 中的 `VITE_API_BASE_URL` 指向正确地址
3. 高德地图 Key 和安全密钥可用，否则地图、POI、路径规划相关页面会报错
4. 通过前端注册或登录后再测试聊天、订单、工单等功能；后端的 `/chat/v2/**` 接口默认依赖登录态和 Token

如果后端不在本机，把 `VITE_API_BASE_URL` 改成对应地址即可。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run type-check
```

## 构建

```bash
npm run build
```
