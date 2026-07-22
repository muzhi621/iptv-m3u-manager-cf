# IPTV M3U Manager — Cloudflare Native Serverless Edition

[English](README.md) | [中文](README_CN.md)

A feature-rich IPTV M3U subscription aggregation and filtering tool, fully migrated to Cloudflare's native serverless architecture. Zero operations, zero cost at idle, global edge deployment.

## Features

- **Multi-source Aggregation** - Merge M3U/TXT/GitHub sources with intelligent deduplication
- **Smart Filtering** - Keyword/regex include/exclude rules
- **Auto Grouping** - AI-powered or rule-based channel categorization
- **M3U Export** - Public `/m3u/{slug}` endpoints with KV/R2 caching
- **EPG Support** - Electronic Program Guide matching via tvg-name
- **Channel Detection** - Connectivity checks and screenshot capture
- **AI Features** - Visual detection, smart grouping, AI sorting via Workers AI
- **Admin Dashboard** - React-based management interface (PC + Mobile)
- **Scheduled Sync** - Cron triggers for automatic subscription updates
- **Task Queue** - Async processing via Cloudflare Queues

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers (TypeScript) |
| Framework | Hono |
| Database | Cloudflare D1 (Serverless SQL) |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 |
| Async Tasks | Cloudflare Queues |
| AI | Workers AI |
| Frontend | React + TypeScript |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/muzhi621/iptv-m3u-manager-cf.git
cd iptv-m3u-manager-cf

# 2. Install
npm install

# 3. Create Cloudflare resources
npx wrangler d1 create iptv_db
npx wrangler r2 bucket create iptv-storage
npx wrangler kv:namespace create "CACHE"

# 4. Update wrangler.jsonc with your resource IDs

# 5. Initialize database
npx wrangler d1 execute iptv_db --file=./migrations/init.sql

# 6. Set environment variables
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put COOKIE_SECRET

# 7. Development
npm run dev

# 8. Deploy
npm run deploy
```

## API Reference

### Authentication
```
POST   /api/login          - Login with password
POST   /api/logout         - Logout
GET    /api/auth/status    - Check auth status
```

### Sources
```
GET    /api/sources        - List all sources
POST   /api/sources        - Add new source
PUT    /api/sources/:id    - Update source
DELETE /api/sources/:id    - Delete source
POST   /api/sources/:id/sync - Manual sync
```

### Channels
```
GET    /api/channels       - List channels (paginated)
GET    /api/channels/:id   - Get channel details
PUT    /api/channels/:id   - Update channel
DELETE /api/channels/:id   - Delete channel
POST   /api/channels/batch - Batch operations
```

### Groups
```
GET    /api/groups         - List groups
POST   /api/groups         - Create group
PUT    /api/groups/:id     - Update group
DELETE /api/groups/:id     - Delete group
```

### Export
```
GET    /m3u/:slug          - Export M3U playlist (public)
GET    /api/preview        - Preview aggregated channels
```

### EPG
```
GET    /api/epg/sources    - List EPG sources
POST   /api/epg/sources    - Add EPG source
DELETE /api/epg/sources/:id - Delete EPG source
POST   /api/epg/sync       - Trigger EPG sync
```

### System
```
GET    /api/health         - Health check
GET    /api/tasks          - List recent tasks
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_PASSWORD` | Admin dashboard password | Yes |
| `COOKIE_SECRET` | Session encryption key | Yes |
| `DEFAULT_SOURCES` | Default sources (JSON) | No |
| `AI_PROMPT_PREFIX` | AI detection prompt prefix | No |
| `FFMPEG_TIMEOUT` | FFmpeg timeout in seconds | No |

## Project Structure

```
src/
├── index.ts           # Worker entry point
├── types.ts           # TypeScript types
├── routes/
│   ├── api.ts         # REST API routes
│   ├── m3u.ts         # M3U export routes
│   └── auth.ts        # Authentication routes
├── handlers/
│   ├── sources.ts     # Source CRUD
│   ├── channels.ts    # Channel CRUD
│   ├── groups.ts      # Group CRUD
│   └── epg.ts         # EPG management
├── services/
│   ├── m3u-parser.ts  # M3U parser/generator
│   ├── channel-merger.ts  # Deduplication
│   ├── filter-engine.ts   # Filter rules
│   └── group-engine.ts    # Auto grouping
├── queue/
│   └── handler.ts     # Async task handler
└── utils/
    ├── auth.ts        # Authentication
    ├── cache.ts       # KV caching
    └── storage.ts     # R2 storage
```

## License

MIT
