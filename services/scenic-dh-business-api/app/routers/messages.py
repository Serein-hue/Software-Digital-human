"""消息记录接口 + AI 回复生成"""

import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.config import settings
from app.schemas.common import ok, err

router = APIRouter(tags=["Messages"])

_MESSAGES: dict[str, list[dict]] = {}

# 灵山胜境坐标
LAT = "31.433"
LON = "120.093"


class CreateMessageRequest(BaseModel):
    role: str = "user"
    text: str
    citations: list[dict] | None = None
    fallback: bool = False
    fallbackReason: str | None = None
    confidence: float | None = None
    speechState: str | None = None
    durationMs: int | None = None


@router.post("/sessions/{session_id}/messages")
async def create_message(session_id: str, body: CreateMessageRequest, request: Request):
    trace_id = request.state.trace_id
    message_id = str(uuid.uuid4())

    # 存用户消息
    user_msg = {
        "id": message_id,
        "sessionId": session_id,
        "role": body.role,
        "text": body.text,
        "citations": body.citations or [],
        "fallback": body.fallback,
        "fallbackReason": body.fallbackReason,
        "confidence": body.confidence,
        "speechState": body.speechState or "done",
        "durationMs": body.durationMs,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    _MESSAGES.setdefault(session_id, []).append(user_msg)

    # ── 生成 AI 回复 ──────────────────────────────────────────────
    content = body.text.strip()
    reply_text = ""
    citations = []
    source = ""

    # 1. 天气问题
    if any(kw in content for kw in ["天气", "温度", "冷不冷", "热不热", "下雨", "晴", "多少度"]):
        weather_info = await _fetch_weather()
        if weather_info:
            reply_text = (
                f"当前灵山胜境的天气情况：\n"
                f"🌤 {weather_info.get('weather', '未知')}，"
                f"温度 {weather_info.get('temperature', '--')}°C，"
                f"湿度 {weather_info.get('humidity', '--')}%，"
                f"风速 {weather_info.get('windSpeed', '--')}\n\n"
                f"建议：如果天气晴朗，适合户外游览灵山大佛和九龙灌浴；"
                f"如果天气较热或下雨，建议先去梵宫室内参观。"
            )
            source = weather_info.get("source", "和风天气")
        else:
            reply_text = "暂时无法获取天气信息，建议出发前查看当地天气预报。"
            source = "系统"

    # 2. 开放时间
    elif any(kw in content for kw in ["开放时间", "几点开", "几点关", "营业时间", "什么时候去"]):
        reply_text = (
            "灵山胜境开放时间：\n"
            "• 旺季（3月-10月）：07:30-17:30\n"
            "• 淡季（11月-2月）：08:00-17:00\n\n"
            "各景点开放时间略有不同，建议上午9点前入园避开人流高峰。"
        )
        source = "灵山胜境官方资料"

    # 3. 门票价格
    elif any(kw in content for kw in ["门票", "多少钱", "价格", "票价", "收费"]):
        reply_text = (
            "灵山胜境门票价格：\n"
            "• 成人票：210 元/人\n"
            "• 学生票：105 元/人（凭学生证）\n"
            "• 60-69岁老人：105 元/人\n"
            "• 70岁以上：免票\n\n"
            "票价包含所有核心景点及《灵山吉祥颂》演出。建议通过官方小程序提前购票。"
        )
        source = "灵山胜境官方资料"

    # 4. 路线推荐
    elif any(kw in content for kw in ["路线", "怎么逛", "怎么走", "推荐", "游览路线"]):
        reply_text = (
            "推荐经典路线（约6小时）：\n"
            "南门入园 → 灵山大照壁 → 佛手广场 → 祥符禅寺 → 灵山大佛（登顶抱佛脚）→ 灵山梵宫（看《吉祥颂》）→ 五印坛城 → 出口\n\n"
            "另有亲子路线（约4小时）和自然风光路线（约5小时），可在「路线」页面查看详情。"
        )
        source = "灵山胜境官方资料"

    # 5. 演出/表演
    elif any(kw in content for kw in ["演出", "表演", "九龙灌浴", "吉祥颂"]):
        reply_text = (
            "今日主要演出：\n"
            "• 九龙灌浴：10:00、11:30、13:30、15:00（每场约15分钟）\n"
            "• 《灵山吉祥颂》：10:35、11:30、14:00、16:00（梵宫圣坛）\n\n"
            "建议提前15分钟到场。具体时间以现场公告为准。"
        )
        source = "灵山胜境官方资料"

    # 6. 附近设施
    elif any(kw in content for kw in ["厕所", "卫生间", "洗手间", "吃饭", "餐厅", "餐饮", "休息", "停车"]):
        reply_text = (
            "景区内服务设施：\n"
            "• 卫生间：南门入口、九龙灌浴广场右侧、梵宫地下一层\n"
            "• 餐饮：灵山蔬食馆（大佛广场东侧）、梵宫自助餐厅、出口素面馆\n"
            "• 停车场：P1南门停车场（5000车位）\n"
            "• 游客中心：南门入口（咨询/寄存/投诉）"
        )
        source = "灵山胜境官方资料"

    # 7. 灵山大佛相关
    elif any(kw in content for kw in ["大佛", "灵山大佛", "抱佛脚", "多高"]):
        reply_text = (
            "灵山大佛是世界上最高的露天青铜释迦牟尼立像。\n"
            "• 通高88米（佛体79米+莲花瓣9米），含台基总高101.5米\n"
            "• 用铜量725吨，由1560块铜壁板构成\n"
            "• 右手施无畏印，左手施与愿印\n"
            "• 登216级登云道可抱佛脚，俯瞰太湖全景"
        )
        source = "灵山胜境官方资料"

    # 8. 默认回复
    else:
        reply_text = (
            f"你好！关于「{content}」，我暂时无法给出详细回答。\n\n"
            f"你可以试试问：\n"
            f"• 今天天气怎么样？\n"
            f"• 门票多少钱？\n"
            f"• 推荐一条游览路线\n"
            f"• 九龙灌浴几点表演？\n"
            f"• 附近哪里有卫生间？"
        )
        source = "AI 导览"

    # 存 AI 回复
    reply_id = str(uuid.uuid4())
    reply_msg = {
        "id": reply_id,
        "sessionId": session_id,
        "role": "assistant",
        "text": reply_text,
        "source": source,
        "citations": citations,
        "confidence": "high",
        "speechState": "done",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    _MESSAGES.setdefault(session_id, []).append(reply_msg)

    # 返回给前端：包含用户消息和 AI 回复
    return ok(
        {
            "messageId": message_id,
            "content": reply_text,
            "source": source,
            "citations": citations,
            "replyMessageId": reply_id,
        },
        trace_id,
    )


async def _fetch_weather() -> dict | None:
    """获取实时天气"""
    if not settings.QWEATHER_API_KEY:
        # 模拟数据
        return {
            "temperature": 26,
            "weather": "多云",
            "humidity": 60,
            "windSpeed": "3级",
            "source": "mock（未配置天气 API key）",
        }
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{settings.QWEATHER_BASE_URL}/weather/now",
                params={"location": f"{LON},{LAT}", "key": settings.QWEATHER_API_KEY},
            )
            data = resp.json()
        if data.get("code") == "200":
            now = data.get("now", {})
            return {
                "temperature": int(now.get("temp", 0)),
                "weather": now.get("text", "未知"),
                "humidity": int(now.get("humidity", 0)),
                "windSpeed": now.get("windDir", "") + now.get("windScale", "") + "级",
                "source": "和风天气",
            }
    except Exception:
        pass
    return None


@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str, limit: int = 50, request: Request = None):
    trace_id = request.state.trace_id
    messages = _MESSAGES.get(session_id, [])
    return ok({"messages": messages[-limit:]}, trace_id)
