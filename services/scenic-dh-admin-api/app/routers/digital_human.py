"""数字人配置接口 — 形象 / 音色 / 表情 — 返回 mock 数据便于前端演示"""

from fastapi import APIRouter, Request
from app.schemas.common import ok

router = APIRouter(tags=["Digital Human Config"])

_MOCK_AVATARS = [
    {"id": "classic-guide", "name": "经典导游", "style": "现代职业", "description": "端庄大方的职业导游形象，适合历史文化类景区", "gradient": "linear-gradient(135deg, #155d58, #15bba0)"},
    {"id": "hanfu-scholar", "name": "汉服书生", "style": "古风国潮", "description": "身着汉服的文人雅士，适合诗词文化类讲解", "gradient": "linear-gradient(135deg, #3a2a1a, #5a3a2a)"},
    {"id": "tibetan-lama", "name": "藏文化向导", "style": "民族特色", "description": "藏传佛教文化主题形象，适合五印坛城等藏式景点", "gradient": "linear-gradient(135deg, #5a1a3a, #8a2a4a)"},
    {"id": "monk-zen", "name": "禅意僧人", "style": "佛教文化", "description": "庄严肃穆的僧侣形象，适合寺院和佛教文化讲解", "gradient": "linear-gradient(135deg, #2a3a1a, #4a5a3a)"},
    {"id": "child-buddy", "name": "灵山童童", "style": "亲子萌趣", "description": "活泼可爱的卡通形象，适合亲子路线和儿童互动", "gradient": "linear-gradient(135deg, #e89460, #b4522c)"},
    {"id": "modern-host", "name": "时尚主播", "style": "现代时尚", "description": "年轻活力的现代主播风，适合年轻游客群体", "gradient": "linear-gradient(135deg, #1a3a5a, #3a5a8a)"},
]

_MOCK_VOICES = [
    {"id": "default", "name": "标准女声", "desc": "温柔知性，语速适中"},
    {"id": "male-deep", "name": "浑厚男声", "desc": "庄重沉稳，适合历史讲解"},
    {"id": "female-sweet", "name": "甜美女生", "desc": "清新活泼，适合亲子互动"},
    {"id": "elder-warm", "name": "慈祥长者", "desc": "和蔼可亲，适合文化深度游"},
]


@router.get("/digital-human/avatars")
def list_avatars(request: Request):
    """列出可用的数字人形象"""
    trace_id = request.state.trace_id
    return ok({"items": _MOCK_AVATARS}, trace_id=trace_id)


@router.get("/digital-human/voices")
def list_voices(request: Request):
    """列出可用的音色预设"""
    trace_id = request.state.trace_id
    return ok({"items": _MOCK_VOICES}, trace_id=trace_id)
