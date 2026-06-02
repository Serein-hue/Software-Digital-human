# 灵山胜境 · AI 数字人导览

中国软件杯 2026 A5 赛题 — 景区导览服务 AI 数字人。出题企业：锐捷网络。

**在线演示**: https://serein-hue.github.io/Software-Digital-human/app/

---

## 三端矩阵

| 端 | 入口 | 场景 |
|---|---|---|
| **C端 Web** | `/` 导游页, `/kiosk` 大屏 | 手机扫码、非微信用户、定点一体机 |
| **微信小程序** | `miniprogram/` | 微信生态内扫码导览、拍照识景、语音问答 |
| **B端指挥中心** | `/command` | 运营大屏：实时客流、设施监控、数据看板 |

参考行业标杆（乐山大佛"AI乐小福"、花果山"齐天大圣"）的三端矩阵设计。

## 技术栈

```
前端: React 19 + Vite 8 + TypeScript + Framer Motion + Recharts
样式: 纯手写 CSS（零框架依赖），移动端 ≤480px 优先
路由: HashRouter（GitHub Pages 兼容）
后端: Express + TypeScript（8 个 API 端点）
小程序: 原生 WXML + WXSS + JS（WeChat SDK）
国际化: 自建 i18n（useT() hook，中/英双语，100+ keys）
```

## 项目结构

```
frontend/src/
  components/guide/     # C端：GuidePage, ChatPanel, DigitalHuman, SpotDetail,
                        #       RouteRecommend, PhotoRecognition, VoiceRecord,
                        #       ShareCard, KioskPage, LbsStatus
  components/admin/     # B端：DataDashboard, KnowledgeBase, ContentReview,
                        #       DigitalHumanConfig, SystemSettings, CommandCenter
  api/index.ts          # API 客户端（后端优先 + 本地 fallback）
  i18n/index.ts         # 双语翻译引擎
  data/siteData.ts      # 站点导航与配置
  App.tsx / App.css     # 路由 + 全部样式 (~4800行)

backend/src/
  index.ts              # Express 服务器（8 端点）
  data.ts               # 8 个景点 + 3 条路线 + 知识库 + 运营数据

miniprogram/            # 微信小程序（4 页面原生开发）
rag-knowledge/          # RAG 知识库（Markdown 格式）
docs/app/               # 构建产物 → GitHub Pages
```

## 快速开始

```bash
# 前端
cd frontend
npm install
npx vite          # 开发环境 → http://localhost:5173

# 后端（可选，前端自带 mock 数据可独立运行）
cd backend
npm install
npm run dev       # API → http://localhost:3001

# 构建
cd frontend && npx vite build   # 输出到 docs/app/
```

## C端功能

- **AI 语音导游**: Web Speech API 实时语音识别，支持中/英文
- **拍照识景**: 模拟取景框 + 扫描动画，识别结果关联景点详情
- **三级讲解**: 一句话 / 30秒简短 / 3分钟深度，适配不同游览节奏
- **路线推荐**: 3 条精选路线（历史文化/自然风光/亲子家庭），可展开查看步骤
- **离线模式**: 弱网提示 + 缓存基础讲解包示意
- **Kiosk 大屏**: 横屏布局，Idle 轮播 + Active 交互，QR 码桥接手机
- **中/英双语**: 一键切换，全界面实时生效

## B端功能

- **数据看板**: 实时客流、周趋势、小时分布、景点热度、设备占比
- **知识库管理**: 文档入库、切片解析、检索状态、类型筛选
- **指挥中心**: 全屏轮播大屏（KPI 条 + 图表 + 设施监控 + 告警列表）
- **内容审核 & 数字人配置 & 系统设置**: 后台管理模块

## 微信小程序

- 原生 WXML+WXSS 开发，同设计 token
- `wx.getRecorderManager()` 真实录音（10s max, mp3）
- `wx.chooseMedia` 真实拍照
- 语音交互动画、下拉刷新、分享转发

## 设计规范

```
--teal:       #155d58    品牌主色
--teal-light: #15bba0    品牌亮色
--teal-dark:  #0d4d48    品牌暗色
--rust:       #b4522c    警示色
--rust-light: #e89460    警示亮色
--paper:      #faf8f1    纸张白
--paper-deep: #efe8d7    纸张深色
--paper-light:#f0ece1    纸张亮色
--ink:        #20231f    墨色
--muted:      #62665d    弱化文字
--line:       #ded8c9    分隔线
--line-strong:#bdb4a0    强调线
```

所有颜色值统一使用 CSS 变量，零硬编码。

## 开发文档

项目开发过程中的关键技术文档，位于 `docs/development/`：

| 文档 | 内容 |
|------|------|
| [01-lipsync-fix.md](docs/development/01-lipsync-fix.md) | Live2D 嘴型同步修复方案（音频振幅驱动） |
| [02-background-change.md](docs/development/02-background-change.md) | 更换数字人背景图片的方法 |
| [03-project-progress.md](docs/development/03-project-progress.md) | 项目进度总览 & 启动方式 |
| [04-rag-guide.md](docs/development/04-rag-guide.md) | RAG 配合指南（给队友看） |

## 数据来源

灵山胜境（无锡，国家5A级，世界佛教论坛永久会址）官方资料包：
- 景点结构化数据集（20+ 景点）
- 游客行为分析数据（14万+ 条）
- 历史文化与游览指南

