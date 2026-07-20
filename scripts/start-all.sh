#!/usr/bin/env bash
# Start the demo runtime stack: RAG, business-api, admin-api, optional Fay, and optional demo-mock.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/logs/pids"
LOG_DIR="$PROJECT_DIR/logs"
PYTHON="${PYTHON:-python}"
NPM="${NPM:-npm}"
RAG_PORT="${RAG_SERVICE_PORT:-5012}"

mkdir -p "$PID_DIR" "$LOG_DIR"
export PYTHONIOENCODING=utf-8

info() { echo "[INFO] $*"; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }

health_check() {
    local url="$1" label="$2" max_wait="${3:-30}"
    info "Waiting for $label: $url"
    for _ in $(seq 1 "$max_wait"); do
        if curl -sf "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

tcp_health_check() {
    local host="$1" port="$2" label="$3" max_wait="${4:-30}"
    info "Waiting for $label: $host:$port"
    for _ in $(seq 1 "$max_wait"); do
        if (exec 3<>"/dev/tcp/$host/$port") 2>/dev/null; then
            exec 3>&-
            exec 3<&-
            return 0
        fi
        sleep 1
    done
    return 1
}

start_service() {
    local name="$1" pid_file="$2" log_file="$3" health_url="$4"
    shift 4

    local args=("$@")
    local workdir="$PROJECT_DIR"
    local n=${#args[@]}
    if [ "$n" -ge 2 ] && [ "${args[$((n-2))]}" = "--workdir" ]; then
        workdir="${args[$((n-1))]}"
        unset 'args[$((n-1))]'
        unset 'args[$((n-2))]'
    fi

    info "Starting $name"
    (
        cd "$workdir"
        nohup "${args[@]}" > "$LOG_DIR/$log_file" 2>&1 &
        echo "$!" > "$PID_DIR/$pid_file"
    )

    local pid
    pid="$(cat "$PID_DIR/$pid_file")"
    if health_check "$health_url" "$name"; then
        ok "$name is running (PID=$pid)"
    else
        warn "$name did not become healthy. Check $LOG_DIR/$log_file"
        return 1
    fi
}

seed_business_db() {
    info "Ensuring business database seed data"
    (
        cd "$PROJECT_DIR/services/scenic-dh-business-api"
        PYTHONIOENCODING=utf-8 "$PYTHON" - <<'PY'
from app.database import init_db
try:
    from seeds.seed_db import seed
    init_db()
    seed()
    print("seed ok")
except Exception as exc:
    print(f"seed warning: {exc}")
PY
    )
}

echo "=========================================="
echo "  Scenic Digital Human service startup"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

start_service "RAG" "rag.pid" "rag.log" "http://127.0.0.1:${RAG_PORT}/api/v1/rag/health" \
    env "RAG_SERVICE_PORT=$RAG_PORT" "$PYTHON" rag/run_rag_server.py

seed_business_db

start_service "Business-API" "business-api.pid" "business-api.log" "http://127.0.0.1:8001/health" \
    env "RAG_SERVICE_URL=http://127.0.0.1:${RAG_PORT}" "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 \
    --workdir "$PROJECT_DIR/services/scenic-dh-business-api"

start_service "Admin-API" "admin-api.pid" "admin-api.log" "http://127.0.0.1:8002/health" \
    env "RAG_SERVICE_URL=http://127.0.0.1:${RAG_PORT}/api/v1" "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8002 \
    --workdir "$PROJECT_DIR/services/scenic-dh-admin-api"

start_service "Fay-Core" "fay.pid" "fay.log" "http://127.0.0.1:5000/" \
    env FAY_MCP_SSE_ENABLE=1 "$PYTHON" main.py start --workdir "$PROJECT_DIR"
health_check "http://127.0.0.1:5010/api/mcp/servers" "Fay-MCP" || {
    warn "Fay-MCP did not become healthy. Check $LOG_DIR/fay.log"
    exit 1
}
tcp_health_check "127.0.0.1" "8765" "Fay-MCP-SSE" || {
    warn "Fay-MCP-SSE did not become healthy. Check $LOG_DIR/fay.log"
    exit 1
}

DEMO_DIR="$PROJECT_DIR/services/scenic-dh-demo-mock-service"
start_service "Demo-Mock" "demo-mock.pid" "demo-mock.log" "http://127.0.0.1:8006/health" \
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8006 \
    --workdir "$DEMO_DIR"

start_service "Express-API" "express-api.pid" "express-api.log" "http://127.0.0.1:3001/api/health" \
    "$NPM" run dev -- --workdir "$PROJECT_DIR/backend"

start_service "Frontend" "frontend.pid" "frontend.log" "http://127.0.0.1:5173/" \
    "$NPM" run dev -- --host 0.0.0.0 --workdir "$PROJECT_DIR/frontend"

echo ""
echo "Service summary:"
for svc in rag business-api admin-api fay demo-mock express-api frontend; do
    pid_file="$PID_DIR/${svc}.pid"
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        ok "$svc running (PID=$(cat "$pid_file"))"
    else
        warn "$svc not running"
    fi
done

echo ""
echo "Core URLs:"
echo "  RAG:          http://127.0.0.1:${RAG_PORT}/api/v1/rag/health"
echo "  Business-API: http://127.0.0.1:8001/docs"
echo "  Admin-API:    http://127.0.0.1:8002/docs"
echo "  Fay-MCP:      http://127.0.0.1:5010/api/mcp/servers"
echo "  Fay-MCP-SSE:  http://127.0.0.1:8765/sse"
echo "  Express-API:  http://127.0.0.1:3001/api/health"
echo "  Frontend:     http://127.0.0.1:5173"
echo ""
echo "Stop all services: bash scripts/stop-all.sh"
echo "Check health: powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1"
