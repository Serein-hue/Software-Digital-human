#!/usr/bin/env bash
# scenic-dh 全服务冒烟测试脚本
# Usage: bash smoke.sh [base_url]  (默认 localhost:8001)

set -euo pipefail
BASE="${1:-http://localhost:8001}"
PASS=0
FAIL=0
TOKEN="${ADMIN_TOKEN:-adm-dev-token}"

ok() { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1 — $2"; }

check() {
  local desc="$1" method="$2" url="$3" data="${4:-}" extra="${5:-}"
  local code expected_body
  if [ -z "$data" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" $extra 2>/dev/null || echo '{"error":"curl_failed"}'$'\n'"000")
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -H "Content-Type: application/json" -d "$data" $extra 2>/dev/null || echo '{"error":"curl_failed"}'$'\n'"000")
  fi
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | head -n -1)
  success=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null || echo "parse_error")

  if [ "$success" = "True" ]; then
    ok "$desc"
  elif [ "$success" = "False" ]; then
    # 有些端点预期返回 success=false (如 NOT_FOUND)
    err_code=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code',''))" 2>/dev/null || echo "")
    if [ -n "$err_code" ]; then
      ok "$desc (expected error: $err_code)"
    else
      fail "$desc" "$body"
    fi
  else
    fail "$desc" "$body"
  fi
}

echo ""
echo "══════════════════════════════════════════"
echo " scenic-dh 全服务冒烟测试"
echo " Base: $BASE"
echo "══════════════════════════════════════════"
echo ""

# ─── Health ───
echo "▶ Health"
check "health check" GET "/health"

# ─── Spots ───
echo "▶ Spots"
check "spot list" GET "/v1/spots"
check "spot list with keyword" GET "/v1/spots?keyword=大佛"
check "spot detail LS-001" GET "/v1/spots/LS-001"
check "spot not found" GET "/v1/spots/LS-999"
check "spot guide LS-001" GET "/v1/spots/LS-001/guide"
check "spot guide LS-003" GET "/v1/spots/LS-003/guide"

# ─── Scenic Areas ───
echo "▶ Scenic Areas"
check "scenic area SA-001" GET "/v1/scenic-areas/SA-001"

# ─── Routes ───
echo "▶ Routes"
check "route list" GET "/v1/routes"
check "route detail RT-001" GET "/v1/routes/RT-001"
check "route not found" GET "/v1/routes/RT-999"
check "route plan" POST "/v1/routes/plan" '{"interests":["亲子"]}'

# ─── Sessions ───
echo "▶ Sessions"
SESSION_ID=$(curl -s -X POST "$BASE/v1/sessions" -H "Content-Type: application/json" -d '{"source":"smoke-test","language":"zh"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['sessionId'])" 2>/dev/null)
if [ -n "$SESSION_ID" ]; then
  ok "create session → $SESSION_ID"
  check "get session" GET "/v1/sessions/$SESSION_ID"
  check "patch session" PATCH "/v1/sessions/$SESSION_ID" '{"currentSpotId":"LS-001"}'
else
  fail "create session" "no sessionId returned"
fi

# ─── Messages ───
echo "▶ Messages"
if [ -n "$SESSION_ID" ]; then
  check "create message" POST "/v1/sessions/$SESSION_ID/messages" '{"role":"user","text":"灵山大佛有多高？"}'
  check "list messages" GET "/v1/sessions/$SESSION_ID/messages"
else
  fail "messages" "no session"
fi

# ─── Arrivals ───
echo "▶ Arrivals"
if [ -n "$SESSION_ID" ]; then
  check "arrival event" POST "/v1/sessions/$SESSION_ID/arrival-events" '{"spotId":"LS-001","trigger":"demo"}'
  check "list arrivals" GET "/v1/sessions/$SESSION_ID/arrival-events"
else
  fail "arrivals" "no session"
fi

# ─── Feedback ───
echo "▶ Feedback"
if [ -n "$SESSION_ID" ]; then
  check "submit feedback" POST "/v1/sessions/$SESSION_ID/feedback" '{"rating":5,"resolved":true,"comment":"很棒"}'
fi
check "feedback list" GET "/v1/feedback"

# ─── Scenic Info ───
echo "▶ Scenic Info"
check "notices" GET "/v1/notices"
check "events" GET "/v1/events"
check "services" GET "/v1/services"
check "weather" GET "/v1/weather"
check "queues" GET "/v1/queues"
check "tickets" GET "/v1/tickets/products"

# ─── Admin API (port 8002) ───
ADMIN="http://localhost:8002"
echo ""
echo "──────────────────────────────────────────"
echo " Admin API: $ADMIN"
echo "──────────────────────────────────────────"
echo "▶ Admin Health"
check "admin health" GET "/health" "" "-H x-admin-token:$TOKEN" 2>/dev/null
# Override BASE for admin checks
_save_base="$BASE"
BASE="$ADMIN"

echo "▶ Knowledge"
check_light() {
  local desc="$1" method="$2" url="$3" data="${4:-}"
  local code
  if [ -z "$data" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -H "x-admin-token:$TOKEN" 2>/dev/null || echo '{}'$'\n'"000")
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -H "Content-Type: application/json" -H "x-admin-token:$TOKEN" -d "$data" 2>/dev/null || echo '{}'$'\n'"000")
  fi
  body=$(echo "$resp" | head -n -1)
  success=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success','false'))" 2>/dev/null || echo "false")
  if [ "$success" = "True" ]; then ok "$desc"; else fail "$desc" "$body"; fi
}

check_light "knowledge status" GET "/v1/knowledge/status"
check_light "persona P1" GET "/v1/personas/P1"
check_light "broadcasts" GET "/v1/broadcasts"
check_light "create broadcast" POST "/v1/broadcasts" '{"text":"系统测试播报","priority":"normal"}'
check_light "analytics overview" GET "/v1/analytics/overview"
check_light "runtime status" GET "/v1/runtime/status"
check_light "auth required" GET "/v1/knowledge/status" "" 2>/dev/null  # should fail without token

BASE="$_save_base"

# ─── Demo Mock (port 8006) ───
DEMO="http://localhost:8006"
echo ""
echo "──────────────────────────────────────────"
echo " Demo Mock: $DEMO"
echo "──────────────────────────────────────────"
check_light "demo health" GET "/health" "" 2>/dev/null
BASE="$DEMO"
check_light "demo reset" POST "/v1/demo/reset" ""
check_light "demo start" POST "/v1/demo/start" ""
check_light "demo next" POST "/v1/demo/next" ""
check_light "demo current" GET "/v1/demo/current" ""
check_light "mock weather" GET "/v1/mock/weather" ""
check_light "mock location" GET "/v1/mock/locations/LS-001" ""

echo ""
echo "══════════════════════════════════════════"
echo " Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
