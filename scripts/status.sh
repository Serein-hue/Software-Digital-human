#!/usr/bin/env bash
# ============================================================================
# status.sh — 查看灵山数字人各服务运行状态
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/logs/pids"
LOG_DIR="$PROJECT_DIR/logs"
RAG_PORT="${RAG_SERVICE_PORT:-5012}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✅ $*${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $*${NC}"; }
err()  { echo -e "  ${RED}❌ $*${NC}"; }

echo ""
echo "=========================================="
echo "  灵山数字人 — 服务状态"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

check_one() {
    local label="$1" url="$2" pid_file="$3"
    local color="${4:-$GREEN}"

    pid_file="$PID_DIR/$pid_file"
    echo ""
    echo -e "${color}$label${NC}"

    local pid=""
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            ok "PID=$pid 运行中"
        else
            warn "PID 文件残留或进程已死 ($pid_file)"
        fi
    fi

    if curl -sf "$url" > /dev/null 2>&1; then
        ok "HTTP $url ✅"
    else
        err "HTTP $url ❌"
    fi
}

check_one "RAG (${RAG_PORT})"     "http://127.0.0.1:${RAG_PORT}/api/v1/rag/health" "rag.pid"
check_one "Business-API (8001)"   "http://127.0.0.1:8001/health"             "business-api.pid"
check_one "Admin-API (8002)"      "http://127.0.0.1:8002/health"             "admin-api.pid"
check_one "Fay-Core (5000)"       "http://127.0.0.1:5000/"                    "fay.pid"        "$YELLOW"
check_one "Fay-MCP (5010)"        "http://127.0.0.1:5010/api/mcp/servers"    "fay.pid"
check_one "Demo-Mock (8006)"      "http://127.0.0.1:8006/health"             "demo-mock.pid"  "$YELLOW"
check_one "Express-API (3001)"   "http://127.0.0.1:3001/api/health"         "express-api.pid"
check_one "Frontend (5173)"      "http://127.0.0.1:5173/"                    "frontend.pid"

echo ""
echo "=========================================="
echo "  日志 (logs/)"
echo "=========================================="
ls -lh "$LOG_DIR/"*.log 2>/dev/null | awk '{printf "  %s %s\n", $5, $NF}' || echo "  (无日志文件)"
echo ""
