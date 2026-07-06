"""RAG 查询代理 — 前端通过 business-api 访问 RAG 服务"""

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.schemas.common import ok, err
from app.config import settings

router = APIRouter(tags=["RAG Proxy"])

RAG_QUERY_URL = f"{settings.RAG_SERVICE_URL}/api/v1/rag/query"
RAG_HEALTH_URL = f"{settings.RAG_SERVICE_URL}/api/v1/rag/health"


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=10)
    filters: dict | None = None


# ── Mock 问答数据 — 当 RAG 服务不可达时返回，方便前端演示 ────────

_MOCK_QA: dict[str, str] = {
    "灵山大佛": "灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道抱佛脚，可俯瞰太湖全景。开放时间8:00-17:00。",
    "灵山梵宫": "灵山梵宫建筑面积7.2万平方米，最高处66.5米，被誉为东方卢浮宫。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，28米高星空穹顶用100公斤纯金绘制。核心琉璃巨制《华藏世界》由160块彩色琉璃拼接而成。每日上演《灵山吉祥颂》大型演出。",
    "九龙灌浴": "九龙灌浴位于景区中轴线核心，总高27.2米，青铜重量260吨。每日4-5场表演，莲花瓣缓缓开启，太子佛在九龙喷泉与《佛之诞》音乐中旋转升起。每场约15分钟，建议提前10分钟到场。表演结束后可接取祈福圣水。",
    "五印坛城": "五印坛城位于香水海中央独立圆岛上，五层重檐楼宇，总高约30米，占地5000平方米。藏式碉楼风格，白墙红边金顶。转经筒长廊环绕主殿，摆放108个纯铜转经筒，游客可顺时针转动祈福。登顶层观景台可俯瞰全景。",
    "祥符禅寺": "祥符禅寺始建于唐贞观年间，由玄奘法师弟子窥基大师开坛讲经。北宋大中祥符年间赐额祥符禅寺。寺内有千年银杏、六角古井等珍贵历史遗迹，钟楼内祥符禅钟重12.8吨，钟声浑厚洪亮，响彻灵山山谷。",
    "门票": "灵山胜境成人票210元/人，学生票105元/人，60-69岁老人105元/人，70岁以上免票。票价包含所有核心景点及《灵山吉祥颂》演出。观光车20元/人。建议通过官方小程序提前购票。",
    "开放时间": "灵山胜境旺季（3月-10月）7:30-17:30，淡季（11月-次年2月）8:00-17:00。灵山大佛8:00-17:00（冬季提前至16:30），灵山梵宫9:00-17:00。",
    "路线": "推荐经典路线：南门入园 → 灵山大照壁 → 佛手广场 → 祥符禅寺 → 灵山大佛（登顶抱佛脚）→ 灵山梵宫 → 五印坛城 → 出口。全程约6小时，建议上午9点前入园避开人流高峰。",
    "亲子": "亲子家庭路线约4小时：南门入园 → 九龙灌浴（孩子最爱的动态表演）→ 佛手广场（摸掌祈福）→ 百子戏弥勒（亲子拍照）→ 灵山大佛（全家抱佛脚）→ 灵山梵宫（看《吉祥颂》）→ 五印坛城（转108个转经筒）。节奏轻松，出口旁有素面餐厅。",
    "交通": "灵山胜境位于无锡市滨湖区马山镇灵山路1号。公交：无锡火车站乘88路直达约90分钟；自驾：导航灵山胜境，停车场小车10元/次。从无锡市区约1小时车程。",
    "餐饮": "景区内餐饮丰富：灵山精舍素斋馆（人均68元起）、梵宫自助餐厅（人均88元）、景区出口素面馆（人均25元）。另有小吃亭散布各景点。",
    "抱佛脚": "抱佛脚是灵山大佛最受欢迎的体验项目。登上216级登云道（暗合108烦恼+108愿望），可以亲手抱一抱大佛的脚趾。佛像脚趾一个就有1米多高，寓意临时抱佛脚求得庇佑。登顶后可俯瞰太湖全景。",
    "演出": "灵山梵宫《灵山吉祥颂》演出时间：10:35、11:30、14:00、16:00。九龙灌浴表演时间：10:00、11:30、13:30、15:00。周末及节假日增加场次。",
}


def _mock_query(query: str) -> dict:
    """当 RAG 服务不可达时返回模拟结果"""
    query_lower = query.lower()
    # 精确匹配
    for key, answer in _MOCK_QA.items():
        if key in query:
            return {
                "answerable": True,
                "answer": answer,
                "contexts": [{"text": answer[:200], "score": 0.85, "source": "知识库（模拟）", "domain": "general"}],
                "citations": [answer[:200]],
                "fallback": None,
                "latencyMs": 0,
                "_mock": True,
            }

    # 模糊匹配
    matched = None
    matched_len = 0
    for key, answer in _MOCK_QA.items():
        if any(kw in query for kw in key):
            if len(key) > matched_len:
                matched = answer
                matched_len = len(key)

    if matched:
        return {
            "answerable": True,
            "answer": matched,
            "contexts": [{"text": matched[:200], "score": 0.65, "source": "知识库（模拟）", "domain": "general"}],
            "citations": [matched[:200]],
            "fallback": None,
            "latencyMs": 0,
            "_mock": True,
        }

    return {
        "answerable": False,
        "answer": "灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址。核心景点包括灵山大佛（世界最高露天青铜立像）、灵山梵宫、九龙灌浴、五印坛城、祥符禅寺等。您可以询问景点详情、开放时间、门票价格、路线推荐等问题。",
        "contexts": [],
        "citations": [],
        "fallback": {"reason": "low_score", "message": "当前问题缺少可靠知识依据"},
        "latencyMs": 0,
        "_mock": True,
    }


@router.post("/rag/query")
async def rag_query(body: RagQueryRequest, request: Request):
    """代理 RAG 语义检索，前端统一入口"""
    trace_id = request.state.trace_id

    payload = {"query": body.query, "top_k": body.top_k}
    if body.filters:
        payload["filters"] = body.filters

    upstream_headers = {
        "X-Trace-Id": trace_id,
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.RAG_API_KEY}",
    }

    # 尝试调用真实 RAG 服务，失败则返回 mock 数据
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                RAG_QUERY_URL,
                json=payload,
                headers=upstream_headers,
            )
            resp.raise_for_status()
            rag_data = resp.json()
    except (httpx.ConnectError, httpx.TimeoutException, Exception):
        mock_data = _mock_query(body.query)
        return ok(mock_data, trace_id)

    if rag_data.get("code") == 0:
        return ok(rag_data["data"], trace_id)
    else:
        mock_data = _mock_query(body.query)
        return ok(mock_data, trace_id)


@router.get("/rag/health")
async def rag_health(request: Request):
    """检查 RAG 服务连通性"""
    trace_id = request.state.trace_id
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(RAG_HEALTH_URL, headers={"X-Trace-Id": trace_id})
            return ok({"rag_status": "ok", "rag_detail": resp.json()}, trace_id)
    except Exception:
        return ok({"rag_status": "unreachable", "rag_detail": None}, trace_id)
