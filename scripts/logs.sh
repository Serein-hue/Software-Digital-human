#!/usr/bin/env bash
# ============================================================================
# logs.sh — 查看各服务实时日志
# ============================================================================
# 用法:
#   bash scripts/logs.sh              # 列出可用日志
#   bash scripts/logs.sh rag          # 查看 RAG 日志
#   bash scripts/logs.sh business     # 查看 Business-API 日志
#   bash scripts/logs.sh admin        # 查看 Admin-API 日志
#   bash scripts/logs.sh fay          # 查看 Fay 日志
#   bash scripts/logs.sh all          # 同时查看所有日志
#   bash scripts/logs.sh rag -n 50   # 查看最近 50 行
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}$*${NC}"; }

SERVICE_LOGS=(
    "rag:rag.log"
    "business:business-api.log"
    "admin:admin-api.log"
    "fay:fay.log"
    "demo-mock:demo-mock.log"
)

if [ $# -eq 0 ]; then
    echo ""
    echo "用法: bash scripts/logs.sh <service> [-n 行数]"
    echo ""
    info "可用服务:"
    for entry in "${SERVICE_LOGS[@]}"; do
        name="${entry%%:*}"
        log="${entry##*:}"
        if [ -f "$LOG_DIR/$log" ]; then
            size=$(du -h "$LOG_DIR/$log" | cut -f1)
            printf "  %-15s → %-25s (%s)\n" "$name" "$log" "$size"
        else
            printf "  %-15s → %-25s (不存在)\n" "$name" "$log"
        fi
    done
    echo ""
    echo "示例: bash scripts/logs.sh rag -n 100"
    exit 0
fi

SERVICE_NAME="$1"
shift || true
EXTRA_ARGS=("$@")

case "$SERVICE_NAME" in
    all)
        info "=== 同时查看所有日志 (Ctrl+C 退出) ==="
        log_files=()
        for entry in "${SERVICE_LOGS[@]}"; do
            log="$LOG_DIR/${entry##*:}"
            [ -f "$log" ] && log_files+=("$log")
        done
        if [ ${#log_files[@]} -eq 0 ]; then
            echo "没有找到日志文件"
            exit 1
        fi
        tail -f "${EXTRA_ARGS[@]}" "${log_files[@]}"
        ;;
    rag|business|admin|fay|demo-mock)
        log_file=""
        for entry in "${SERVICE_LOGS[@]}"; do
            if [ "${entry%%:*}" = "$SERVICE_NAME" ]; then
                log_file="$LOG_DIR/${entry##*:}"
                break
            fi
        done
        if [ ! -f "$log_file" ]; then
            echo "日志文件不存在: $log_file"
            exit 1
        fi
        info "=== $log_file ==="
        tail "${EXTRA_ARGS[@]}" -f "$log_file"
        ;;
    *)
        echo "未知服务: $SERVICE_NAME"
        echo "可用: rag, business, admin, fay, demo-mock, all"
        exit 1
        ;;
esac
