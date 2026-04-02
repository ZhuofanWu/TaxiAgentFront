# Claude Project Guide - Vue 3 + TS + Pinia

## 1. 技术栈规范 (Tech Stack)
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite
- **Language**: TypeScript (Strict Mode)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Components**: Naive UI

## 2. 目录组织结构 (Project Structure)
必须严格遵守以下目录结构，严禁在 `components` 根目录下堆放所有文件：
- `src/assets/`: 静态资源（图片、图标）
- `src/components/base/`: 基础原子组件（按钮、输入框等通用组件）
- `src/components/business/`: 业务复用组件（如：UserCard, OrderList）
- `src/views/`: 页面级组件（与路由对应）
- `src/stores/`: Pinia Store 定义
- `src/router/`: 路由配置
- `src/types/`: 全局 TypeScript 接口/类型定义
- `src/utils/`: 工具函数
- `src/api/`: API 请求定义（按模块拆分，联调文档在`apidoc/`下）

## 3. 核心编程规则 (Coding Rules)
### 3.1 编写准则
- **单文件组件 (SFC)**: 必须使用 `<script setup lang="ts">`。
- **组件规模**: 单个组件文件代码量严禁超过 300 行。如果超过，必须拆分为子组件。
- **命名规范**: 
  - 组件文件夹/文件：大驼峰 (PascalCase)，如 `UserProfile.vue`。
  - 函数/变量：小驼峰 (camelCase)。
  - 常量：全大写下划线 (SNAKE_CASE)。
- **Types**: 严禁使用 `any`。所有 Props, Emits, Data 必须定义明确的 Interface。

### 3.2 逻辑拆分
- **逻辑抽离 (Composables)**: 复杂的逻辑（超过 30 行的逻辑块）必须抽离到 `src/composables` 中。
- **Pinia**: 状态管理按功能模块拆分（如 `user.ts`, `cart.ts`），严禁把所有状态塞进一个 store。

### 3.3 样式冲突处理 (Critical)
- **Tailwind Preflight 修复**: 
  - 在配置 Tailwind 和 Naive UI 时，必须解决样式覆盖问题。
  - 必须在入口文件（如 `index.html` 或 `App.vue`）中正确配置 Naive UI 的样式注入顺序。
  - 如果发现 Naive UI 按钮样式异常（变透明），必须在全局 CSS (`src/style.css`) 中添加以下修复代码：
    ```css  
    .n-button {  
      background-color: transparent; /* 让 Naive UI 接管背景控制 */  
    }  
    ```

## 4. 常用命令 (Workflow)
- 安装依赖: `npm install`
- 本地开发: `npm run dev`
- 类型检查: `npm run type-check`
- 构建项目: `npm run build`
- 单元测试: `npm run test`

## 5. 开发要求
- 每次修改后，必须运行 `npm run type-check` 确保没有类型错误。
- 只有在测试通过且无类型错误的情况下才能结束。

在完成一个功能模块后，必须主动进行一次全文件扫描，检查：
- 是否遗留了 `console.log`？
- 是否引入了未使用的 import？
- 是否破坏了 `src/components` 的层级结构？

- 应用补丁时，建议使用相对路径类似 `src/utils/amap.ts` 进行编辑。