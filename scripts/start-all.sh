#!/usr/bin/env bash
# ============================================================================
# start-all.sh — 一键启动灵山数字人全栈服务
# ============================================================================
# 启动顺序: RAG → seed 数据库 → business-api → admin-api → [Fay] → [demo-mock]
# 每个服务启动后轮询健康检查，成功后才继续下一步。
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── 颜色 ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── PID / 日志目录 ────────────────────────────────────────────────────
PID_DIR="$PROJECT_DIR/logs/pids"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

# ── Python ────────────────────────────────────────────────────────────
PYTHON="python"
export PYTHONIOENCODING=utf-8

# ── 助手函数 ──────────────────────────────────────────────────────────

health_check() {
    local url="$1" label="$2" max_wait="${3:-30}"
    info "等待 $label 上线 (最多 ${max_wait}s)..."
    for i in $(seq 1 "$max_wait"); do
        if curl -sf "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

start_service() {
    local name="$1" pid_file="$2" log_file="$3" health_url="$4"
    shift 4
    info "启动 $name..."
    local launch_cmd=("$@")
    # 如果最后一个参数是 --workdir <dir>，提取工作目录并去掉它
    local workdir="$PROJECT_DIR"
    if [ "${launch_cmd[-2]}" = "--workdir" ] && [ ${#launch_cmd[@]} -ge 2 ]; then
        workdir="${launch_cmd[-1]}"
        launch_cmd=("${launch_cmd[@]:0:${#launch_cmd[@]}-2}")
    fi
    cd "$workdir"
    PYTHONIOENCODING=utf-8 nohup "${launch_cmd[@]}" > "$LOG_DIR/$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/$pid_file"
    disown "$pid" 2>/dev/null || true
    cd "$PROJECT_DIR"
    if health_check "$health_url" "$name"; then
        ok "$name 已启动 (PID=$pid)"
    else
        warn "$name 启动超时，请检查 $LOG_DIR/$log_file (workdir=$workdir)"
        return 1
    fi
}

start_seed_db() {
    info "检查数据库种子数据..."
    cd "$PROJECT_DIR/services/scenic-dh-business-api"
    if python -c "
import sqlite3, sys
try:
    conn = sqlite3.connect('scenic_business.db')
    c = conn.execute('SELECT COUNT(*) FROM spot')
    if c.fetchone()[0] > 0:
        print('seeded')
    else:
        print('empty')
    conn.close()
except Exception:
    print('empty')
" 2>/dev/null | grep -q "seeded"; then
        ok "数据库已有种子数据，跳过"
    else
        PYTHONIOENCODING=utf-8 python -c "
import sys; sys.path.insert(0, '.')
from app.database import init_db
from seeds.seed_db import seed
init_db()
seed()
print('Seed done')
" 2>&1 | tail -1 && ok "数据库种子数据已写入" || warn "种子数据写入失败"
    fi
    cd "$PROJECT_DIR"
}

# ═══════════════════════════════════════════════════════════════════════
# 主流程
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "=========================================="
echo "  灵山数字人 — 全栈服务启动"
echo "  日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 1) RAG 知识库服务 (port 5010) — 从项目根运行
start_service "RAG" "rag.pid" "rag.log" "http://127.0.0.1:5010/api/v1/rag/health" \
    "$PYTHON" rag/run_rag_server.py

# 2) 数据库 seed
start_seed_db

# 3) Business-API (port 8001)
BUS_DIR="$PROJECT_DIR/services/scenic-dh-business-api"
start_service "Business-API" "business-api.pid" "business-api.log" \
    "http://127.0.0.1:8001/health" \
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 \
    --workdir "$BUS_DIR"

# 4) Admin-API (port 8002)
ADMIN_DIR="$PROJECT_DIR/services/scenic-dh-admin-api"
start_service "Admin-API" "admin-api.pid" "admin-api.log" \
    "http://127.0.0.1:8002/health" \
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8002 \
    --workdir "$ADMIN_DIR"

# 5) Fay 数字人核心 (可选，port 5000)
if [ -f "$PROJECT_DIR/main.py" ]; then
    info "检测到 Fay 主程序 (main.py)，尝试启动..."
    start_service "Fay-Core" "fay.pid" "fay.log" "http://127.0.0.1:5000/" \
        "$PYTHON" main.py --workdir "$PROJECT_DIR" || warn "Fay 启动失败（不影响核心服务）"
else
    warn "未检测到 Fay 主程序，跳过（不影响核心服务）"
fi

# 6) Demo-Mock 服务 (可选，port 8006)
DEMO_DIR="$PROJECT_DIR/services/scenic-dh-demo-mock-service"
if [ -d "$DEMO_DIR" ]; then
    info "检测到 Demo-Mock 服务..."
    start_service "Demo-Mock" "demo-mock.pid" "demo-mock.log" \
        "http://127.0.0.1:8006/health" \
        "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8006 \
        --workdir "$DEMO_DIR" || true
fi

# ═══════════════════════════════════════════════════════════════════════
# 服务汇总
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "=========================================="
echo "  服务状态汇总"
echo "=========================================="
for svc in rag business-api admin-api fay demo-mock; do
    pid_file="$PID_DIR/${svc}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            ok "${svc} (PID=$pid) 运行中"
        else
            warn "${svc} PID=$pid 已停止"
        fi
    else
        warn "${svc} 未启动"
    fi
done

echo ""
echo -e "${GREEN}所有核心服务已启动。${NC}"
echo "  RAG API:      http://127.0.0.1:5010/api/v1/rag/health"
echo "  Business-API: http://127.0.0.1:8001/docs"
echo "  Admin-API:    http://127.0.0.1:8002/docs"
echo ""
echo "停止所有服务: bash scripts/stop-all.sh"
echo "查看运行状态: bash scripts/status.sh"
echo ""
