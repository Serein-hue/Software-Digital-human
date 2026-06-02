# 项目进度总览

**项目**：中国软件杯 2026 A5 — 景区导览服务 AI 数字人
**景区**：灵山胜境（无锡，国家 5A 级景区）
**提交截止**：2026-06-30
**GitHub**：https://github.com/Serein-hue/Software-Digital-human

---

## 已完成

### 基础架构
- [x] 前端 React 19 + Vite + TypeScript（C 端导览 + B 端管理后台 + Kiosk 大屏）
- [x] 后端 Express + TypeScript（8 个 API 端点）
- [x] 微信小程序（原生 WXML+WXSS, 4 页面）
- [x] 纯手写 CSS，移动端优先 ≤480px

### AI 能力
- [x] **LLM 接入**：SiliconFlow（DeepSeek 模型），Chat + Embedding 均正常
- [x] **RAG 知识库**：Flask 服务端口 5010，ChromaDB 向量存储，73 条灵山知识
- [x] **Express 集成 RAG**：`/api/chat` 先查 RAG，查不到降级字典匹配
- [x] **LipSync 嘴型同步**：音频振幅驱动，无需外部 API，pydub + RMS 映射
- [x] **Live2D 数字人**：Haru 模型集成，WebSocket 对接 Fay

### 辅助工具
- [x] `skills/test_lipsync.py` — 离线测嘴型（输出时序图+JSON）
- [x] `skills/start-dev.sh` — 一键启动 RAG + 前端
- [x] `skills/deploy.sh` — 构建部署到 GitHub Pages

---

## 待完成

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | **端到端验证 LipSync** | 启动 Fay + Live2D 实测嘴巴动不动 |
| P0 | **前端对接真实 Fay 后端** | 目前用的是 mock 数据 |
| P1 | **RAG 编排层开发** | 对话管理 + 多轮上下文 + 知识库路由 |
| P1 | **TTS 升级** | 当前 Edge TTS，可换 GPT-SoVITS/阿里云 |
| P1 | **ASR 配置** | FunASR（免费）/ 阿里云 NLS |
| P2 | **Orchestrator 编排层** | 会话管理、业务协调 |
| P2 | **系统联调** | 全链路：ASR → LLM → RAG → TTS → Live2D |

---

## 启动方式

### Fay（服务端）
```bash
cd ~/Desktop/Software-Digital-human
python main.py
```

### Live2D 数字人（前端界面）
```bash
cd live2d-avatar/CubismSdkForWeb-5-r.4/Samples/TypeScript/Demo
npm start
# 浏览器 → http://localhost:5173
```

### RAG 服务
```bash
cd ~/Desktop/Software-Digital-human
python rag/run_rag_server.py
# 端口 5010，健康检查: http://127.0.0.1:5010/api/v1/rag/health
```

### 前端主站
```bash
cd ~/Desktop/Software-Digital-human/frontend
npm run dev
# 端口 5173/5174
```
