# 项目清理与打包方案

## 提交材料的4个压缩包

根据大赛要求，提交材料需分为**4个压缩包**分别上传，命名按官网分配的编码。

---

## 压缩包1：作品源代码

### 范围
整个 `Software-Digital-human/` 代码仓库，但需清理：

### 需要清理的目录（应删除）

| 路径 | 原因 |
|------|------|
| `__pycache__/` （各目录） | Python 缓存，自动生成 |
| `rag/chroma_db/` | 向量库持久化，可重新生成 |
| `.venv/` 、 `rag/.venv/` | 虚拟环境，评审方自己安装 |
| `node_modules/` | npm 依赖，评审方自己安装 |
| `docs/app/` | 构建产物，可重新构建 |
| `live2d-avatar/CubismSdkForWeb-5-r.4/` | Live2D SDK，体积大（仅保留 docs 说明即可） |
| `_teacher-miniprogram/` | 老师独立仓库，不属于本作品 |
| `samples/` 、 `logs/` 、 `cache_data/` 、 `memory/` | Fay 运行时生成目录 |
| `*.db` 、 `*.db-shm` 、 `*.db-wal` | 数据库文件，重新 seed 即可生成 |
| `chroma_db/` 各类副本 | 向量库 |
| `download/` | 下载缓存 |

### 需要保留的目录

```
Software-Digital-human/
├── frontend/             # React 前端源码
├── backend/              # Express 后端（向下兼容保留）
├── services/
│   ├── scenic-dh-business-api/     # FastAPI 业务服务
│   ├── scenic-dh-admin-api/        # FastAPI 管理服务
│   ├── scenic-dh-demo-mock-service/ # 演示兜底服务
│   └── scenic-dh-contracts/        # API 契约文档
├── rag/                  # RAG 知识库服务
│   ├── *.py              # 源码
│   ├── config/           # 配置文件
│   ├── data/             # 运行时数据（sources.json, qa_pairs.json）
│   └── chroma_db/        # ⚠️ 向量库可保留（免去重新入库）
├── miniprogram/          # 微信小程序源码
├── scripts/              # 启动/停止脚本
├── docs/
│   ├── submission/       # 本次提交的文档
│   └── development/      # 开发文档
├── contracts/            # RAG 服务契约
├── config/               # 配置文件
├── faymcp/               # Fay MCP 工具
├── mcp_servers/          # MCP 服务器
├── official-materials/   # 赛题官方资料
└── README.md
```

---

## 压缩包2：可执行文件（部署运行包）

这个包应包含评审方**一键运行所需的最小文件集**：

```
deploy/
├── rag/
│   ├── run_rag_server.py
│   ├── api.py / rag_engine.py / ...（RAG 全部源码）
│   └── chroma_db/           # 预构建好的向量库
├── services/
│   ├── scenic-dh-business-api/
│   │   ├── app/              # 全部源码
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── scenic-dh-admin-api/
│   │   ├── app/              # 全部源码
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── scenic-dh-demo-mock-service/
│       ├── app/              # 全部源码
│       └── requirements.txt
├── scripts/
│   ├── start-all.sh
│   ├── stop-all.sh
│   └── health-check.ps1
├── README.md
└── 部署说明.txt
```

评审方操作步骤：
```bash
# 1. 安装 Python 依赖
pip install -r services/scenic-dh-business-api/requirements.txt
pip install -r services/scenic-dh-admin-api/requirements.txt
pip install -r services/scenic-dh-demo-mock-service/requirements.txt

# 2. 配置 .env（修改密码等）
cp services/scenic-dh-business-api/.env.example services/scenic-dh-business-api/.env
cp services/scenic-dh-admin-api/.env.example services/scenic-dh-admin-api/.env

# 3. 启动所有服务
bash scripts/start-all.sh
```

---

## 压缩包3：PPT / 演示视频 / 文档

| 文件 | 说明 | 状态 |
|------|------|------|
| `01-deployment-manual.md` | 部署和使用手册 | ✅ 已写好 |
| `02-design-document.md` | 总体设计文档 | ✅ 已写好 |
| `03-ppt-content.md` | PPT 文字大纲 | ✅ 已写好（老师配图排版） |
| `04-video-script.md` | 演示视频脚本 | ✅ 已写好 |
| `演示视频.mp4` | ≤7分钟 | 🎥 需录制 |
| `方案介绍PPT.pptx` | 完整 PPT | 👨‍🏫 老师做 |

---

## 压缩包4：报名表+学生证

由你自行下载填写+拍照，我这边不需要操作。
