# IPTV M3U 管理器 — Cloudflare 原生无服务器版

功能丰富的 IPTV M3U 订阅聚合与过滤工具，完全迁移至 Cloudflare 原生无服务器架构。零运维、闲置零成本、全球边缘部署。

## 功能特性

- **多源聚合** — 合并 M3U/TXT/GitHub 订阅源，智能去重
- **智能筛选** — 关键字/正则表达式 包含/排除规则
- **自动分组** — AI 驱动或规则驱动的频道分类
- **M3U 导出** — 公开 `/m3u/{slug}` 端点，KV + R2 双层缓存
- **EPG 支持** — 通过 tvg-name 匹配电子节目表
- **频道检测** — 连通性探测与截图捕获
- **AI 功能** — Workers AI 视觉检测、智能分组、AI 排序
- **管理后台** — React 管理界面（PC + 移动端）
- **定时同步** — Cron 触发器自动更新订阅
- **任务队列** — Cloudflare Queues 异步任务处理

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers (TypeScript) |
| 框架 | Hono |
| 数据库 | Cloudflare D1 (Serverless SQL) |
| 缓存 | Cloudflare KV |
| 存储 | Cloudflare R2 |
| 异步任务 | Cloudflare Queues |
| AI | Workers AI |
| 前端 | React + TypeScript |

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/muzhi621/iptv-m3u-manager-cf.git
cd iptv-m3u-manager-cf

# 2. 安装依赖
npm install

# 3. 创建 Cloudflare 资源
npx wrangler d1 create iptv_db
npx wrangler r2 bucket create iptv-storage
npx wrangler kv:namespace create "CACHE"

# 4. 更新 wrangler.jsonc 中的资源 ID

# 5. 初始化数据库
npx wrangler d1 execute iptv_db --file=./migrations/init.sql

# 6. 设置环境变量
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put COOKIE_SECRET

# 7. 本地开发
npm run dev

# 8. 部署
npm run deploy
```

## API 接口

### 认证
```
POST   /api/login          - 密码登录
POST   /api/logout         - 退出登录
GET    /api/auth/status    - 检查登录状态
```

### 订阅源
```
GET    /api/sources        - 列表
POST   /api/sources        - 添加
PUT    /api/sources/:id    - 更新
DELETE /api/sources/:id    - 删除
POST   /api/sources/:id/sync - 手动同步
```

### 频道
```
GET    /api/channels       - 列表（分页）
GET    /api/channels/:id   - 详情
PUT    /api/channels/:id   - 更新
DELETE /api/channels/:id   - 删除
POST   /api/channels/batch - 批量操作
```

### 分组
```
GET    /api/groups         - 列表
POST   /api/groups         - 创建
PUT    /api/groups/:id     - 更新
DELETE /api/groups/:id     - 删除
```

### 导出
```
GET    /m3u/:slug          - 导出 M3U 播放列表（公开）
GET    /api/preview        - 预览聚合频道
```

### EPG
```
GET    /api/epg/sources    - EPG 源列表
POST   /api/epg/sources    - 添加 EPG 源
DELETE /api/epg/sources/:id - 删除 EPG 源
POST   /api/epg/sync       - 触发 EPG 同步
```

### 系统
```
GET    /api/health         - 健康检查
GET    /api/tasks          - 任务列表
```

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `ADMIN_PASSWORD` | 管理后台密码 | 是 |
| `COOKIE_SECRET` | Cookie 加密密钥 | 是 |
| `DEFAULT_SOURCES` | 默认订阅源 (JSON) | 否 |
| `AI_PROMPT_PREFIX` | AI 视觉检测前置提示词 | 否 |
| `FFMPEG_TIMEOUT` | FFmpeg 截图超时（秒） | 否 |

## 项目结构

```
src/
├── index.ts           # Worker 入口
├── types.ts           # TypeScript 类型定义
├── routes/
│   ├── api.ts         # REST API 路由
│   ├── m3u.ts         # M3U 导出路由
│   └── auth.ts        # 认证路由
├── handlers/
│   ├── sources.ts     # 订阅源 CRUD
│   ├── channels.ts    # 频道 CRUD
│   ├── groups.ts      # 分组 CRUD
│   └── epg.ts         # EPG 管理
├── services/
│   ├── m3u-parser.ts  # M3U 解析/生成器
│   ├── channel-merger.ts  # 去重合并
│   ├── filter-engine.ts   # 筛选引擎
│   └── group-engine.ts    # 自动分组
├── queue/
│   └── handler.ts     # 异步任务处理
└── utils/
    ├── auth.ts        # 认证工具
    ├── cache.ts       # KV 缓存
    └── storage.ts     # R2 存储
```

## 部署到 Cloudflare

### 一键部署

```bash
# 创建资源
npx wrangler d1 create iptv_db
npx wrangler r2 bucket create iptv-storage
npx wrangler kv:namespace create "CACHE"

# 将返回的 ID 填入 wrangler.jsonc

# 初始化数据库
npx wrangler d1 execute iptv_db --file=./migrations/init.sql

# 设置密钥
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put COOKIE_SECRET

# 部署
npm run deploy
```

### GitHub 自动部署（Workers Builds）

1. 在 Cloudflare Dashboard 创建 Worker
2. 连接 GitHub 仓库 `muzhi621/iptv-m3u-manager-cf`
3. 选择部署分支 `master`
4. 每次 push 自动触发构建和部署

## 成本估算

Cloudflare 免费额度（每月）：

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| Workers | 100,000 请求/天 | 个人/小团队足够 |
| D1 | 5 GB 存储 + 5M 读取/月 | — |
| KV | 1 GB 存储 + 1M 读取/月 | — |
| R2 | 10 GB 存储 + 10M A 类操作 | 零出口费用 |
| Queues | 1M 消息/月 | — |
| Workers AI | 10,000 神经元/天 | 轻度 AI 使用 |

**预计月成本**：个人/小团队在免费额度内即可覆盖，无需付费。

## 开源协议

MIT
