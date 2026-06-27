#!/usr/bin/env bash
# Smoke test for the local scenic-dh service stack.

set -euo pipefail

BUSINESS="${BUSINESS_URL:-http://localhost:8001}"
ADMIN="${ADMIN_URL:-http://localhost:8002}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

PASS=0
FAIL=0

ok() { PASS=$((PASS + 1)); echo "OK  $1"; }
fail() { FAIL=$((FAIL + 1)); echo "ERR $1 - $2"; }

request_json() {
  local method="$1" url="$2" data="${3:-}" token="${4:-}"
  local args=(-s -w $'\n%{http_code}' -X "$method" "$url")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi
  curl "${args[@]}" 2>/dev/null || echo '{}'$'\n'"000"
}

check_code() {
  local desc="$1" method="$2" url="$3" data="${4:-}" token="${5:-}" expected="${6:-200}"
  local resp code
  resp=$(request_json "$method" "$url" "$data" "$token")
  code=$(echo "$resp" | tail -1)
  if [ "$code" = "$expected" ]; then
    ok "$desc"
  else
    fail "$desc" "HTTP $code"
  fi
}

login_admin() {
  if [ -n "$ADMIN_TOKEN" ]; then
    echo "$ADMIN_TOKEN"
    return
  fi
  if [ -z "$ADMIN_PASSWORD" ]; then
    echo ""
    return
  fi
  request_json POST "$ADMIN/v1/auth/login" "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASSWORD\"}" \
    | head -n -1 \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null || true
}

echo "Business API: $BUSINESS"
check_code "business health" GET "$BUSINESS/health"
check_code "spot list" GET "$BUSINESS/v1/spots"
check_code "route list" GET "$BUSINESS/v1/routes"
check_code "create session" POST "$BUSINESS/v1/sessions" '{"source":"smoke-test","language":"zh"}'

echo "Admin API: $ADMIN"
check_code "admin health" GET "$ADMIN/health"

TOKEN="$(login_admin)"
if [ -z "$TOKEN" ]; then
  fail "admin login" "set ADMIN_PASSWORD or ADMIN_TOKEN"
else
  ok "admin login"
  check_code "admin me" GET "$ADMIN/v1/auth/me" "" "$TOKEN"
  check_code "knowledge status" GET "$ADMIN/v1/knowledge/status" "" "$TOKEN"
  check_code "runtime status" GET "$ADMIN/v1/runtime/status" "" "$TOKEN"
fi

echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
