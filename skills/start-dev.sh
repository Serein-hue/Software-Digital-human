#!/bin/bash
# ============================================================
# 快速开发启动 — 一键启动所有服务
# 使用: bash skills/start-dev.sh [--frontend-only]
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
    info "正在停止所有服务..."
    kill $PID_RAG 2>/dev/null || true
    kill $PID_FRONTEND 2>/dev/null || true
    kill $PID_FAY 2>/dev/null || true
    wait 2>/dev/null || true
    info "已停止所有服务"
    exit 0
}
trap cleanup SIGINT SIGTERM

PID_RAG=""
PID_FRONTEND=""
PID_FAY=""

# ── RAG 服务 ──
if [ "$1" != "--frontend-only" ]; then
    info "启动 RAG 服务 (端口 5010)..."
    source "$(conda info --base)/etc/profile.d/conda.sh" 2>/dev/null || true
    conda run -n scenic-dh python rag/run_rag_server.py &
    PID_RAG=$!
    sleep 2
    # 健康检查
    if curl -s http://127.0.0.1:5010/api/v1/rag/health > /dev/null 2>&1; then
        info "✅ RAG 服务运行中"
    else
        warn "⏳ RAG 服务启动中（可能还需几秒）..."
    fi
fi

# ── 前端 ──
info "启动前端 dev server (端口 5173)..."
cd frontend
npm run dev &
PID_FRONTEND=$!
cd "$PROJECT_DIR"
sleep 3
info "✅ 前端: http://localhost:5173"

# ── 提示 ──
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  所有服务已启动${NC}"
echo -e "${GREEN}========================================${NC}"
echo "  前端:     http://localhost:5173"
echo "  RAG API:  http://127.0.0.1:5010/api/v1/rag/health"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo ""

# 等待任意服务退出
wait
