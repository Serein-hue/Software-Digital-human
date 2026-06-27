#!/usr/bin/env bash
# Start the demo runtime stack: RAG, business-api, admin-api, optional Fay, and optional demo-mock.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/logs/pids"
LOG_DIR="$PROJECT_DIR/logs"
PYTHON="${PYTHON:-python}"

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

start_service "RAG" "rag.pid" "rag.log" "http://127.0.0.1:5010/api/v1/rag/health" \
    "$PYTHON" rag/run_rag_server.py

seed_business_db

start_service "Business-API" "business-api.pid" "business-api.log" "http://127.0.0.1:8001/health" \
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 \
    --workdir "$PROJECT_DIR/services/scenic-dh-business-api"

start_service "Admin-API" "admin-api.pid" "admin-api.log" "http://127.0.0.1:8002/health" \
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8002 \
    --workdir "$PROJECT_DIR/services/scenic-dh-admin-api"

if [ -f "$PROJECT_DIR/main.py" ]; then
    start_service "Fay-Core" "fay.pid" "fay.log" "http://127.0.0.1:5000/" \
        "$PYTHON" main.py --workdir "$PROJECT_DIR" || warn "Fay is optional for API-only validation"
fi

DEMO_DIR="$PROJECT_DIR/services/scenic-dh-demo-mock-service"
if [ -d "$DEMO_DIR" ]; then
    start_service "Demo-Mock" "demo-mock.pid" "demo-mock.log" "http://127.0.0.1:8006/health" \
        "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8006 \
        --workdir "$DEMO_DIR" || warn "Demo-Mock is optional"
fi

echo ""
echo "Service summary:"
for svc in rag business-api admin-api fay demo-mock; do
    pid_file="$PID_DIR/${svc}.pid"
    if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
        ok "$svc running (PID=$(cat "$pid_file"))"
    else
        warn "$svc not running"
    fi
done

echo ""
echo "Core URLs:"
echo "  RAG:          http://127.0.0.1:5010/api/v1/rag/health"
echo "  Business-API: http://127.0.0.1:8001/docs"
echo "  Admin-API:    http://127.0.0.1:8002/docs"
echo ""
echo "Stop all services: bash scripts/stop-all.sh"
echo "Check health: powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1"
