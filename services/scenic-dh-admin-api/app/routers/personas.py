"""人设与提示词策略 — 景区数字人专用人格（含持久化）"""

import json
import os
import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.config import settings

router = APIRouter(tags=["Personas"])

PERSONAS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "personas.json")

_DEFAULT_PERSONAS = {
    "default": {
        "id": "default",
        "name": "灵山小导游（默认）",
        "description": "灵山胜境景区数字人导览。热情友好，用通俗易懂的语言讲解佛教文化和景点故事。",
        "tone": "friendly",
        "systemPrompt": "你是灵山胜境景区的AI数字人导游，名叫Fay。你的任务是帮助游客了解景区信息，包括景点介绍、路线规划、演出时间、票务信息等。回答简洁准确热情。",
        "agentDesc": {"first_name": "Fay", "sex": "女", "age": "成年", "occupation": "景区导游", "position": "灵山胜境数字人导游", "additional": "热情友好、熟悉灵山所有景点"},
        "fallbackPolicy": {"maxRetries": 2, "lowConfidenceThreshold": 0.4, "timeoutMs": 8000, "defaultFallback": "抱歉，我需要问一下景区工作人员。"},
    },
    "P1": {
        "id": "P1",
        "name": "灵山小导游",
        "description": "热情活泼，面向普通游客。用通俗易懂的语言讲解佛教文化和景点故事。",
        "tone": "friendly",
        "systemPrompt": "你是灵山胜境景区的AI数字人导游，名叫Fay。用热情活泼的方式回答游客问题，语言通俗易懂。",
        "agentDesc": {"first_name": "Fay", "sex": "女", "age": "成年", "occupation": "景区导游", "position": "灵山胜境数字人导游", "additional": "活泼开朗，喜欢和游客互动"},
        "fallbackPolicy": {"maxRetries": 2, "lowConfidenceThreshold": 0.4, "timeoutMs": 8000, "defaultFallback": "抱歉，我需要问一下景区工作人员。"},
    },
    "P2": {
        "id": "P2",
        "name": "灵山文化导览",
        "description": "专业庄重，面向文化深度游。引用文献深入讲解佛教艺术和历史。",
        "tone": "professional",
        "systemPrompt": "你是灵山胜境景区的文化导览专家。用专业严谨的语言讲解佛教文化、建筑艺术和历史典故。",
        "agentDesc": {"first_name": "Fay", "sex": "女", "age": "成年", "occupation": "文化导览专家", "position": "灵山胜境文化解说员", "additional": "博学严谨，熟悉佛教文化和建筑艺术"},
        "fallbackPolicy": {"maxRetries": 3, "lowConfidenceThreshold": 0.5, "timeoutMs": 12000, "defaultFallback": "目前资料尚不充分，建议查阅景区官方文献。"},
    },
}

_ACTIVE_PERSONA_ID = "default"


def _load_personas() -> dict:
    if os.path.exists(PERSONAS_FILE):
        try:
            with open(PERSONAS_FILE, "r", encoding="utf-8") as f:
                return json.load(f).get("personas", {})
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def _save_personas(personas: dict):
    os.makedirs(os.path.dirname(PERSONAS_FILE), exist_ok=True)
    with open(PERSONAS_FILE, "w", encoding="utf-8") as f:
        json.dump({"personas": personas, "activeId": _ACTIVE_PERSONA_ID}, f, ensure_ascii=False, indent=2)


def _get_all_personas() -> dict:
    personas = _load_personas()
    for k, v in _DEFAULT_PERSONAS.items():
        if k not in personas:
            personas[k] = v
    return personas


class PersonaUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    tone: str | None = None
    systemPrompt: str | None = None
    agentDesc: dict | None = None
    fallbackPolicy: dict | None = None


@router.get("/personas")
def list_personas(request: Request):
    """列出所有人设"""
    trace_id = request.state.trace_id
    personas = _get_all_personas()
    return ok({"items": list(personas.values()), "activeId": _ACTIVE_PERSONA_ID}, trace_id=trace_id)


@router.get("/personas/{persona_id}")
def get_persona(persona_id: str, request: Request):
    """查询人设详情"""
    trace_id = request.state.trace_id
    personas = _get_all_personas()
    persona = personas.get(persona_id)
    if not persona:
        return err(40400, f"人设 {persona_id} 不存在", trace_id)
    return ok(persona, trace_id=trace_id)


@router.put("/personas/{persona_id}")
def update_persona(persona_id: str, body: PersonaUpdateRequest, request: Request):
    """更新人设（持久化到 JSON）"""
    trace_id = request.state.trace_id
    personas = _get_all_personas()
    persona = personas.get(persona_id)
    if not persona:
        return err(40400, f"人设 {persona_id} 不存在", trace_id)
    if body.name is not None:
        persona["name"] = body.name
    if body.description is not None:
        persona["description"] = body.description
    if body.tone is not None:
        persona["tone"] = body.tone
    if body.systemPrompt is not None:
        persona["systemPrompt"] = body.systemPrompt
    if body.agentDesc is not None:
        persona["agentDesc"] = body.agentDesc
    if body.fallbackPolicy is not None:
        persona["fallbackPolicy"] = body.fallbackPolicy
    personas[persona_id] = persona
    _save_personas(personas)
    return ok(persona, trace_id=trace_id)


@router.post("/personas/{persona_id}/activate")
def activate_persona(persona_id: str, request: Request):
    """激活人设"""
    trace_id = request.state.trace_id
    personas = _get_all_personas()
    if persona_id not in personas:
        return err(40400, f"人设 {persona_id} 不存在", trace_id)
    global _ACTIVE_PERSONA_ID
    _ACTIVE_PERSONA_ID = persona_id
    data = {}
    if os.path.exists(PERSONAS_FILE):
        try:
            with open(PERSONAS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    data["activeId"] = persona_id
    os.makedirs(os.path.dirname(PERSONAS_FILE), exist_ok=True)
    with open(PERSONAS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return ok({"activatedId": persona_id, "name": personas[persona_id]["name"]}, trace_id=trace_id)


@router.post("/runtime/reload-persona")
async def reload_persona(request: Request):
    """将活跃人设推送到 Fay"""
    trace_id = request.state.trace_id
    personas = _get_all_personas()
    persona = personas.get(_ACTIVE_PERSONA_ID)
    if not persona:
        return err(40400, f"当前活跃人设 {_ACTIVE_PERSONA_ID} 不存在", trace_id)

    agent_desc = persona.get("agentDesc", {})
    payload = {"config": {"agent": {
        "first_name": agent_desc.get("first_name", "Fay"),
        "sex": agent_desc.get("sex", "女"),
        "age": agent_desc.get("age", "成年"),
        "occupation": agent_desc.get("occupation", "助手"),
        "position": agent_desc.get("position", ""),
        "additional": agent_desc.get("additional", ""),
        "system_prompt": persona.get("systemPrompt", ""),
    }}}

    fay_online = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.FAY_HTTP_URL}/api/submit",
                data={"data": json.dumps(payload, ensure_ascii=False)},
            )
            fay_online = resp.json().get("result") == "successful"
    except Exception:
        pass

    return ok({
        "personaId": _ACTIVE_PERSONA_ID,
        "name": persona["name"],
        "pushed": fay_online,
    }, trace_id=trace_id)
