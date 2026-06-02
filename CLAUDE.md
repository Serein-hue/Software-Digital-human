# Software-Digital-human — 景区导览 AI 数字人

中国软件杯 2026 A5 赛题，出题企业 锐捷网络，提交截止 2026-06-30。

## 技术栈
React 19 + Vite + TypeScript + Framer Motion + Recharts + ReactFlow
纯手写 CSS（无 Tailwind/MUI），移动端优先 ≤480px
HashRouter（GitHub Pages 兼容）

## 项目结构
```
frontend/src/
  components/guide/     # C端导览 (6 页面)
  components/admin/     # B端管理后台
  data/siteData.ts      # 站点配置、导航、PRD数据
  i18n/index.ts         # 中英文双语 (100+ keys, useT() hook)
  App.tsx               # 路由 + 布局
  App.css               # 全部样式 (~4800行)
backend/src/
  index.ts              # Express API (8 endpoints)
  data.ts               # 结构化景点数据
docs/app/               # 构建产物 → GitHub Pages
rag-knowledge/          # RAG 知识库 (Markdown)
official-materials/     # 赛题官方资料包
miniprogram/            # 微信小程序 (原生 WXML+WXSS)
skills/                 # 自动化脚本
```

## 当前状态
- [x] C端 6 页面完成：GuidePage, ChatPanel, DigitalHuman, SpotDetail, RouteRecommend, PhotoRecognition, VoiceRecord, ShareCard
- [x] 全部 mock 数据已替换为灵山胜境官方资料
- [x] B端 5 页面完成：DataDashboard, KnowledgeBase, ContentReview, DigitalHumanConfig, SystemSettings
- [x] 微信小程序端：4 页面（guide/spot-detail/route/photo），原生 WXML+WXSS，同设计 token
- [x] RAG 检索管道 → `backend/src/` Express API (8 endpoints)
- [x] 后端 API → `backend/src/index.ts` (spots, routes, chat, analytics)
- [x] LipSync 嘴型同步修复 — `test/ovr_lipsync/test_olipsync.py` 从桩实现改为音频振幅驱动
- [x] ffmpeg 已安装（winget）— pydub 解析 MP3 必需，PATH: `C:\Users\32344\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.WinGet.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin`
- [x] 开发辅助脚本：`skills/test_lipsync.py`（嘴型测试）、`skills/start-dev.sh`（一键启动）

## LipSync 数据流
```
Fay TTS → audio.mp3 → test_olipsync.LipSyncGenerator → WS "Lips" → Lipsync.ts → ParamMouthOpenY
```
- Python 端：pydub 分帧 50ms，RMS 振幅归一化 → viseme 名（sil/PP/TH/DD/E/oh/ou/aa）
- 前端端：`lipsync.ts` 中 `visemeMap` 映射 viseme → 嘴型开合度，平滑过渡
- 启动前需确保 ffmpeg 在 PATH 中

## 数据来源
灵山胜境（无锡，国家5A级景区，世界佛教论坛永久会址）
官方资料包：景点数据集 + 游客行为分析数据 (xlsx 14万条) + 游览指南

## 关键约定
- 纯 CSS，不用任何 CSS 框架
- 移动端优先设计
- 完全自主决策，无需请示用户，直接执行
- 做完就推送，实时更新 GitHub Pages
- 数据替换用增量方式，不搞全量
