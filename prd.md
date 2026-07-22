# IPTV M3U Manager —— Cloudflare 原生无服务器版

## 一、项目概述

### 1.1 项目背景

[iptv-m3u-manager](https://github.com/XianYuDaXian/iptv-m3u-manager) 是一个功能丰富的 IPTV M3U 订阅聚合与过滤工具，支持多源合并、关键字/正则筛选、自定义分组、EPG 节目表匹配、截图与 AI 检测等能力。原项目基于 Python + FastAPI 构建，通过 Docker 或源码方式部署。

本重构项目旨在将原项目完整迁移至 **Cloudflare 原生无服务器架构**，打造一个开箱即用、零运维、低成本、全球边缘部署的 IPTV 管理应用。

### 1.2 设计目标

| 目标            | 说明                                               |
| --------------- | -------------------------------------------------- |
| **零运维**      | 无需管理服务器，完全由 Cloudflare 全球边缘网络承载 |
| **低成本**      | 充分利用 Cloudflare 免费额度，闲置时成本趋近于零   |
| **开箱即用**    | 一键部署，无需复杂配置                             |
| **GitHub 同步** | 通过 Workers Builds 实现代码推送即自动部署         |
| **功能对等**    | 完整保留原项目的核心功能                           |
| **全球加速**    | 边缘节点就近响应，低延迟访问                       |

### 1.3 技术栈对比

| 组件         | 原项目                     | 重构项目                                   |
| ------------ | -------------------------- | ------------------------------------------ |
| **运行时**   | Python + FastAPI + Uvicorn | Cloudflare Workers (JavaScript/TypeScript) |
| **数据库**   | SQLite (本地文件)          | Cloudflare D1 (Serverless SQL)             |
| **文件存储** | 本地文件系统 (./data)      | Cloudflare R2 (S3 兼容，零出口费用)        |
| **缓存**     | 内存/本地文件              | Cloudflare KV (全球分布式 KV)              |
| **异步任务** | Taskiq                     | Cloudflare Queues                          |
| **部署**     | Docker / 源码              | Workers Builds (GitHub 集成)               |
| **前端**     | HTML + CSS (服务端渲染)    | 静态前端 (Workers 托管)                    |


## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户浏览器 / IPTV 播放器                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Cloudflare 全球边缘网络                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Cloudflare Workers                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │  前端托管    │  │  API 路由   │  │   M3U 导出服务      │ │   │
│  │  │ (静态资源)   │  │ (Hono框架)  │  │  (/m3u/{slug})     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │  订阅同步器  │  │  AI 服务    │  │   截图/检测服务     │ │   │
│  │  │ (定时任务)   │  │ (Workers AI)│  │   (FFmpeg WASM)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│              ┌───────────────┼───────────────┐                    │
│              ▼               ▼               ▼                    │
│         ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│         │  D1     │    │  KV     │    │  R2     │               │
│         │ (SQL)   │    │ (缓存)  │    │ (存储)  │               │
│         └─────────┘    └─────────┘    └─────────┘               │
│              │               │               │                    │
│              └───────────────┴───────────────┘                    │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   外部 M3U / EPG 数据源                            │
│           (多源订阅、GitHub 链接、TXT 地址等)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心服务组件

#### 2.2.1 Worker 主服务

采用 **Hono** 框架构建轻量级 API 服务，单一 Worker 项目承载全部后端逻辑：

- **前端托管**：托管 React/Vue 构建的静态管理界面
- **RESTful API**：频道管理、分组管理、订阅源管理、EPG 管理等
- **M3U 导出**：公开访问的 `/m3u/{slug}` 端点，返回聚合后的 M3U 文件
- **管理认证**：Cookie/Session -based 密码保护

#### 2.2.2 D1 数据库

Cloudflare D1 作为主数据存储，存储以下数据：

- 订阅源配置（URL、名称、启用状态、同步策略）
- 频道元数据（tvg-name、tvg-logo、group-title、URL）
- 用户自定义分组（央视、卫视、体育等）
- 筛选规则（关键字、正则表达式、排除规则）
- 系统配置（管理密码、AI 提示词等）
- 任务执行记录

#### 2.2.3 KV 缓存

Cloudflare KV 用于高频读取数据的全球缓存：

- 聚合后的 M3U 内容（缓存版本，减少重复计算）
- EPG 节目表快照
- 预览数据（频道列表、分组视图）
- 检测结果缓存

#### 2.2.4 R2 对象存储

Cloudflare R2 存储静态文件与媒体资源：

- 频道截图（FFmpeg 截图结果）
- 导出的 M3U 文件（gzip 压缩落盘）
- 预览数据静态产物
- 用户上传的自定义图标/台标

#### 2.2.5 Queues 异步任务

Cloudflare Queues 处理后台任务：

- 定时订阅同步（按配置间隔拉取 M3U 源）
- 频道连通性探测
- FFmpeg 截图任务
- AI 检测任务（视觉检测、AI 分组、AI 排序）

#### 2.2.6 Workers AI

Cloudflare Workers AI 提供边缘 AI 能力：

- AI 视觉检测（频道截图内容识别，可配置前置提示词）
- AI 智能分组（自动整理节目表生成分组视图）
- AI 排序（自定义提示词排序频道）

### 2.3 数据流设计

```
┌──────────────────────────────────────────────────────────────────────┐
│                         用户操作流程                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 添加订阅源 ──► D1 存储配置 ──► 触发 Queues 同步任务              │
│                                                                      │
│  2. 同步任务 ──► 拉取 M3U/TXT ──► 解析频道 ──► 存入 D1              │
│                    │                                                 │
│                    ▼                                                 │
│              触发后续处理：EPG 匹配 / 截图 / AI 检测                 │
│                                                                      │
│  3. 用户访问预览 ──► 检查 KV 缓存 ──► 命中则返回 ──► 未命中则计算   │
│                                                                      │
│  4. M3U 导出 ──► 读取 D1 + 应用筛选/分组 ──► 生成 M3U ──► 返回     │
│                    │                                                 │
│                    ▼                                                 │
│              同时写入 R2 作为静态缓存                                │
│                                                                      │
│  5. 频道检测 ──► Queues 任务 ──► FFmpeg WASM 截图 ──► R2 存储      │
│                    │                                                 │
│                    ▼                                                 │
│              Workers AI 视觉检测 ──► 更新频道状态                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```


## 三、功能模块

### 3.1 功能对照表

| 原功能                     | 重构实现方案                      | 状态 |
| -------------------------- | --------------------------------- | ---- |
| 多源聚合（M3U/TXT/GitHub） | Worker 定时拉取 + M3U 解析器      | ✅    |
| 关键字/正则筛选            | D1 查询 + 正则匹配                | ✅    |
| 自定义分组                 | D1 存储分组规则 + 分组引擎        | ✅    |
| AI 分组                    | Workers AI + 自定义提示词         | ✅    |
| 聚合预览（PC/移动端）      | 前端 React/Vue + API              | ✅    |
| EPG 节目表匹配             | 定时拉取 EPG 源 + tvg-name 匹配   | ✅    |
| 同频道智能覆盖             | 频道聚类算法 + 供体选择逻辑       | ✅    |
| FFmpeg 截图                | FFmpeg WASM (WebAssembly)         | ✅    |
| 连通性探测                 | HTTP 请求探测 + 超时控制          | ✅    |
| AI 视觉检测                | Workers AI (视觉模型)             | ✅    |
| AI 排序                    | Workers AI (LLM)                  | ✅    |
| M3U 静态导出               | R2 存储 + `/m3u/{slug}` 公开访问  | ✅    |
| 管理页密码保护             | Cookie 认证 + 环境变量            | ✅    |
| 任务中心                   | Queues + D1 任务记录              | ✅    |
| 定时自动同步               | Cron Triggers (Scheduled Workers) | ✅    |

### 3.2 核心 API 设计

```typescript
// 订阅源管理
GET    /api/sources               // 列表
POST   /api/sources               // 添加
PUT    /api/sources/:id           // 更新
DELETE /api/sources/:id           // 删除
POST   /api/sources/:id/sync      // 手动同步

// 频道管理
GET    /api/channels              // 列表（支持筛选、分页）
GET    /api/channels/:id          // 详情
PUT    /api/channels/:id          // 更新（启用/禁用等）
DELETE /api/channels/:id          // 删除（剔除）
POST   /api/channels/batch        // 批量操作

// 分组管理
GET    /api/groups                // 列表
POST   /api/groups                // 创建
PUT    /api/groups/:id            // 更新
DELETE /api/groups/:id            // 删除
POST   /api/groups/auto           // AI 自动分组

// 预览与导出
GET    /api/preview               // 聚合预览数据
GET    /m3u/:slug                // M3U 导出（公开）
GET    /api/preview/cache/refresh // 刷新缓存

// EPG
GET    /api/epg/sources           // EPG 源列表
POST   /api/epg/sync              // 同步 EPG
GET    /api/epg/now/:channelId    // 当前节目

// AI
POST   /api/ai/detect             // 视觉检测
POST   /api/ai/sort               // AI 排序
POST   /api/ai/group              // AI 分组

// 系统
GET    /api/health                // 健康检查
GET    /api/tasks                 // 任务列表
```

### 3.3 前端界面

采用 **React + TypeScript** 构建单页应用，由 Worker 托管静态资源：

- **PC 端**：表格布局，支持筛选、排序、批量操作
- **移动端**：卡片布局，触屏优化
- **日间/夜间主题**：自动适配系统主题
- **分组 Tab**：PC 等宽 / 移动平铺


## 四、部署与 CI/CD

### 4.1 GitHub 同步更新（Workers Builds）

项目采用 **Cloudflare Workers Builds** 实现 GitHub 同步自动部署：

1. 在 Cloudflare Dashboard 中创建 Worker
2. 连接 GitHub 仓库（支持 GitHub 或 GitLab）
3. 选择部署分支（如 `main`）
4. 每次 `git push` 自动触发构建和部署

```yaml
# wrangler.jsonc 配置示例
{
  "name": "iptv-m3u-manager",
  "main": "src/index.ts",
  "compatibility_date": "2025-08-01",
  "env": {
    "production": {
      "vars": {
        "ADMIN_PASSWORD": "your-secure-password"
      },
      "d1_databases": [
        { "binding": "DB", "database_name": "iptv_db", "database_id": "xxx" }
      ],
      "kv_namespaces": [
        { "binding": "CACHE", "id": "xxx" }
      ],
      "r2_buckets": [
        { "binding": "STORAGE", "bucket_name": "iptv-storage" }
      ]
    }
  },
  "triggers": {
    "crons": ["0 */6 * * *"]  // 每6小时同步订阅
  }
}
```

### 4.2 一键部署流程

```bash
# 1. 克隆项目
git clone https://github.com/your-username/iptv-m3u-manager-cf.git
cd iptv-m3u-manager-cf

# 2. 安装依赖
npm install

# 3. 创建 D1 数据库
npx wrangler d1 create iptv_db

# 4. 创建 R2 存储桶
npx wrangler r2 bucket create iptv-storage

# 5. 创建 KV 命名空间
npx wrangler kv:namespace create "CACHE"

# 6. 运行数据库迁移
npx wrangler d1 execute iptv_db --file=./migrations/init.sql

# 7. 本地开发
npm run dev

# 8. 部署
npm run deploy
```

### 4.3 环境变量

| 变量名             | 说明                  | 必填 |
| ------------------ | --------------------- | ---- |
| `ADMIN_PASSWORD`   | 管理后台密码          | ✅    |
| `COOKIE_SECRET`    | Cookie 加密密钥       | ✅    |
| `DEFAULT_SOURCES`  | 默认订阅源列表 (JSON) | ❌    |
| `AI_PROMPT_PREFIX` | AI 视觉检测前置提示词 | ❌    |
| `FFMPEG_TIMEOUT`   | FFmpeg 截图超时(秒)   | ❌    |


## 五、关键技术挑战与解决方案

### 5.1 Python → JavaScript/TypeScript 迁移

原项目使用 Python + FastAPI，重构需用 TypeScript 重写全部逻辑。

**解决方案**：
- 使用 Hono 框架替代 FastAPI，API 风格相似
- M3U 解析器用 TypeScript 重写（参考 `iptv-playlist-parser` 等开源库）
- FFmpeg 功能通过 **FFmpeg WASM** 在 Worker 中运行
- Workers AI 替代原有 LLM 调用

### 5.2 无状态计算的挑战

Worker 是无状态的，每次请求可能在不同隔离环境中执行。

**解决方案**：
- 所有持久化数据存入 D1/R2/KV
- 使用 D1 存储任务状态，Queues 处理异步任务
- 缓存优先策略：KV 缓存频繁读取的数据

### 5.3 执行时间限制

Worker 请求有 CPU 时间限制（免费计划 10ms，付费计划 50ms）。

**解决方案**：
- 同步任务（M3U 解析、频道聚合）控制在 50ms 内
- 耗时任务（截图、AI 检测）通过 **Queues** 异步处理
- 定时同步通过 **Cron Triggers** 在后台执行

### 5.4 文件系统限制

Worker 提供的是临时内存文件系统，数据在隔离销毁时丢失。

**解决方案**：
- 所有文件持久化存储使用 **R2**
- 临时文件处理使用内存流（`ArrayBuffer` / `Blob`）
- 不使用本地文件系统做持久化


## 六、项目结构

```
iptv-m3u-manager-cf/
├── wrangler.jsonc              # Cloudflare Worker 配置
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                # Worker 入口
│   ├── routes/
│   │   ├── api.ts              # API 路由 (Hono)
│   │   ├── m3u.ts              # M3U 导出路由
│   │   └── static.ts           # 静态资源路由
│   ├── handlers/
│   │   ├── sources.ts          # 订阅源处理
│   │   ├── channels.ts         # 频道处理
│   │   ├── groups.ts           # 分组处理
│   │   ├── epg.ts              # EPG 处理
│   │   └── ai.ts               # AI 处理
│   ├── services/
│   │   ├── m3u-parser.ts       # M3U 解析器
│   │   ├── channel-merger.ts   # 频道合并/去重
│   │   ├── filter-engine.ts    # 筛选引擎
│   │   ├── group-engine.ts     # 分组引擎
│   │   └── ffmpeg.ts           # FFmpeg WASM 封装
│   ├── db/
│   │   ├── schema.sql          # D1 表结构
│   │   └── migrations/         # 迁移文件
│   ├── queue/
│   │   ├── sync.ts             # 同步任务
│   │   ├── detect.ts           # 检测任务
│   │   └── snapshot.ts         # 截图任务
│   ├── utils/
│   │   ├── cache.ts            # KV 缓存工具
│   │   ├── storage.ts          # R2 存储工具
│   │   └── auth.ts             # 认证工具
│   └── frontend/               # 前端源码 (React)
│       ├── src/
│       ├── public/
│       └── vite.config.ts
├── migrations/
│   └── init.sql                # 初始数据库迁移
└── README.md
```


## 七、开发路线图

### Phase 1: 基础架构 (Week 1-2)
- [ ] 搭建 Worker 项目骨架 (Hono + TypeScript)
- [ ] 配置 D1、KV、R2 绑定
- [ ] 实现 M3U 解析器
- [ ] 实现基础 API (订阅源 CRUD)

### Phase 2: 核心功能 (Week 3-4)
- [ ] 频道聚合与去重引擎
- [ ] 关键字/正则筛选
- [ ] 自定义分组
- [ ] M3U 导出 (`/m3u/{slug}`)
- [ ] 管理后台认证

### Phase 3: 高级功能 (Week 5-6)
- [ ] EPG 匹配与节目表
- [ ] 同频道智能覆盖
- [ ] Queues 异步任务
- [ ] Cron 定时同步

### Phase 4: AI 与检测 (Week 7-8)
- [ ] Workers AI 集成 (视觉检测、AI 分组、AI 排序)
- [ ] FFmpeg WASM 截图
- [ ] 连通性探测

### Phase 5: 前端与优化 (Week 9-10)
- [ ] React 管理界面 (PC + 移动端)
- [ ] 缓存策略优化
- [ ] 性能调优
- [ ] 文档与部署指南

### Phase 6: 测试与发布 (Week 11-12)
- [ ] 单元测试与集成测试
- [ ] CI/CD 配置 (Workers Builds)
- [ ] 生产环境部署
- [ ] 项目开源发布


## 八、成本估算

Cloudflare 免费额度（每月）：

| 服务           | 免费额度                  | 说明                |
| -------------- | ------------------------- | ------------------- |
| **Workers**    | 100,000 请求/天           | 足够个人/小团队使用 |
| **D1**         | 5 GB 存储 + 5M 读取/月    |                     |
| **KV**         | 1 GB 存储 + 1M 读取/月    |                     |
| **R2**         | 10 GB 存储 + 10M A 类操作 | 零出口费用          |
| **Queues**     | 1M 消息/月                |                     |
| **Workers AI** | 10,000 神经元/天          | 轻度 AI 使用        |

**预计月成本**：个人/小团队在免费额度内即可覆盖，无需付费。


## 九、参考资料

| 资源                      | 链接                                                    |
| ------------------------- | ------------------------------------------------------- |
| 原项目                    | https://github.com/XianYuDaXian/iptv-m3u-manager        |
| Cloudflare Workers 文档   | https://developers.cloudflare.com/workers/              |
| Cloudflare D1 文档        | https://developers.cloudflare.com/d1/                   |
| Cloudflare R2 文档        | https://developers.cloudflare.com/r2/                   |
| Cloudflare Workers AI     | https://developers.cloudflare.com/workers-ai/           |
| Workers Builds            | https://developers.cloudflare.com/workers/ci-cd/builds/ |
| Hono 框架                 | https://hono.dev/                                       |
| 参考实现：MOE-IPTV-Player | https://github.com/Mohammad-Aali/MOE-IPTV-Player        |

---

*本文档可作为 AI 辅助开发的产品规格说明书，用于指导 iptv-m3u-manager 的 Cloudflare 原生重构工作。*