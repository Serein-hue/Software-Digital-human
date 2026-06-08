#!/bin/bash
# ═══════════════════════════════════════════════════
# scenic-dh 开发环境一键启动
# 用法: bash services/start-dev.sh [start|stop|seed|status|logs]
# ═══════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$ROOT_DIR/.pids"
mkdir -p "$PID_DIR"

# 服务定义: name:port:dir
SERVICES=(
  "business-api:8001:scenic-dh-business-api"
  "admin-api:8002:scenic-dh-admin-api"
  "demo-mock:8006:scenic-dh-demo-mock-service"
)

# ── 颜色 ──
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── 端口检测 ──
port_in_use() {
  local port=$1
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":$port "
  elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":$port "
  else
    return 1
  fi
}

# ── 启动 ──
start_service() {
  local name=$1 port=$2 dir=$3
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$PID_DIR/$name.log"

  if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
    echo -e "${YELLOW}[$name] 已在运行 (pid $(cat $pid_file))${NC}"
    return 0
  fi

  if port_in_use "$port"; then
    echo -e "${RED}[$name] 端口 $port 已被占用${NC}"
    return 1
  fi

  echo -e "${GREEN}[$name] 启动中... (端口 $port)${NC}"
  cd "$ROOT_DIR/services/$dir"
  PYTHONPATH=. nohup python -m uvicorn app.main:app --host 0.0.0.0 --port "$port" --reload > "$log_file" 2>&1 &
  echo $! > "$pid_file"
  sleep 1
  if kill -0 $(cat "$pid_file") 2>/dev/null; then
    echo -e "${GREEN}[$name] 启动成功 ✓${NC}"
  else
    echo -e "${RED}[$name] 启动失败，查看日志: tail -f $log_file${NC}"
    return 1
  fi
}

# ── 停止 ──
stop_service() {
  local name=$1 port=$2 dir=$3
  local pid_file="$PID_DIR/$name.pid"

  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && echo -e "${YELLOW}[$name] 已停止${NC}"
    fi
    rm -f "$pid_file"
  else
    echo -e "${YELLOW}[$name] 未在运行${NC}"
  fi
}

# ── 健康检查 ──
health_check() {
  echo "健康检查..."
  for svc in "${SERVICES[@]}"; do
    IFS=':' read -r name port dir <<< "$svc"
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓ $name (:$port)${NC}"
    else
      echo -e "  ${RED}✗ $name (:$port) 无响应${NC}"
    fi
  done
  # RAG 服务
  if curl -s "http://localhost:5010/api/v1/rag/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ rag-service (:5010)${NC}"
  else
    echo -e "  ${YELLOW}⚠ rag-service (:5010) 未运行 (非必需)${NC}"
  fi
}

# ── 主命令 ──
case "${1:-start}" in
  start)
    echo "=== scenic-dh 开发环境启动 ==="
    # 1. 种子数据
    echo ""
    echo "--- 数据库初始化 ---"
    cd "$ROOT_DIR/services/scenic-dh-business-api"
    PYTHONPATH=. python seed_db.py
    cd "$ROOT_DIR/services/scenic-dh-admin-api"
    PYTHONPATH=. python seed_db.py
    echo ""
    # 2. 启动服务
    echo "--- 启动服务 ---"
    for svc in "${SERVICES[@]}"; do
      IFS=':' read -r name port dir <<< "$svc"
      start_service "$name" "$port" "$dir"
    done
    echo ""
    # 3. 健康检查
    sleep 2
    health_check
    echo ""
    echo "=== 全部就绪 ==="
    echo "  business-api : http://localhost:8001/docs"
    echo "  admin-api    : http://localhost:8002/docs"
    echo "  demo-mock    : http://localhost:8006/docs"
    echo "  默认管理员   : admin / admin123"
    echo "  日志目录     : $PID_DIR/"
    ;;

  stop)
    echo "=== 停止所有服务 ==="
    for svc in "${SERVICES[@]}"; do
      IFS=':' read -r name port dir <<< "$svc"
      stop_service "$name" "$port" "$dir"
    done
    ;;

  seed)
    echo "=== 数据库初始化 ==="
    cd "$ROOT_DIR/services/scenic-dh-business-api"
    PYTHONPATH=. python seed_db.py
    cd "$ROOT_DIR/services/scenic-dh-admin-api"
    PYTHONPATH=. python seed_db.py
    echo "种子数据导入完成 ✓"
    ;;

  status)
    health_check
    ;;

  logs)
    echo "=== 服务日志 ==="
    for svc in "${SERVICES[@]}"; do
      IFS=':' read -r name port dir <<< "$svc"
      log_file="$PID_DIR/$name.log"
      if [ -f "$log_file" ]; then
        echo "--- $name ---"
        tail -20 "$log_file"
        echo ""
      fi
    done
    ;;

  *)
    echo "用法: bash services/start-dev.sh [start|stop|seed|status|logs]"
    echo ""
    echo "  start  启动所有服务（默认）"
    echo "  stop   停止所有服务"
    echo "  seed   初始化数据库种子数据"
    echo "  status 健康检查"
    echo "  logs   查看最近日志"
    ;;
esac
