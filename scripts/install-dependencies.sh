#!/usr/bin/env bash
# Install the runtime dependencies required by every service in the delivery archive.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON="${PYTHON:-python}"
NPM="${NPM:-npm}"

install_python_requirements() {
    local requirements_file="$1"
    if [ -f "$requirements_file" ]; then
        echo "[INFO] Installing $requirements_file"
        "$PYTHON" -m pip install -r "$requirements_file"
    fi
}

cd "$PROJECT_DIR"
"$PYTHON" -m pip install --upgrade pip
install_python_requirements "$PROJECT_DIR/requirements.txt"

for requirements_file in "$PROJECT_DIR"/services/*/requirements.txt "$PROJECT_DIR"/mcp_servers/*/requirements.txt; do
    install_python_requirements "$requirements_file"
done

for app_dir in "$PROJECT_DIR/frontend" "$PROJECT_DIR/backend"; do
    echo "[INFO] Installing Node dependencies in $app_dir"
    (
        cd "$app_dir"
        "$NPM" ci
    )
done

echo "[OK] Dependencies installed for Fay, MCP, RAG, external APIs, frontend, and backend."
