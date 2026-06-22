#!/usr/bin/env bash
# ============================================================================
# stop-all.sh — 一键停止灵山数字人全栈服务
# ============================================================================
# 倒序停止所有服务（先业务后基础依赖），确保优雅关闭。
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/logs/pids"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# 倒序停止列表（先停依赖方，再停被依赖方）
STOP_ORDER=(
    "demo-mock:Demo-Mock(8006)"
    "admin-api:Admin-API(8002)"
    "business-api:Business-API(8001)"
    "fay:Fay-Core(5000)"
    "rag:RAG(5010)"
)

echo ""
echo "=========================================="
echo "  停止所有服务"
echo "=========================================="

for entry in "${STOP_ORDER[@]}"; do
    name="${entry%%:*}"
    label="${entry##*:}"
    pid_file="$PID_DIR/${name}.pid"

    if [ ! -f "$pid_file" ]; then
        continue
    fi

    pid=$(cat "$pid_file" 2>/dev/null || echo "")
    if [ -z "$pid" ]; then
        rm -f "$pid_file"
        continue
    fi

    if kill -0 "$pid" 2>/dev/null; then
        info "停止 $label (PID=$pid)..."
        kill "$pid" 2>/dev/null || true
        # 等待最多 10 秒优雅退出
        for i in $(seq 1 10); do
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # 强制终止
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
            warn "$label 强制终止"
        else
            ok "$label 已停止"
        fi
    else
        warn "$label 已不在运行"
    fi
    rm -f "$pid_file"
done

echo ""
info "清理 PID 文件..."
rm -f "$PID_DIR"/*.pid 2>/dev/null || true
ok "所有服务已停止"
echo ""
