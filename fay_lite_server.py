#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""轻量 Fay API 服务器 — 景区数字人运行时"""

import json, logging, os, uuid
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fay-lite")

app = Flask(__name__)
CORS(app)

_running = True
_messages = []
_config = {
    "agent": {"first_name": "Fay", "sex": "女", "age": "成年", "occupation": "景区导游",
              "position": "灵山胜境数字人导游", "goal": "为游客提供优质导览服务",
              "additional": "热情友好、乐于助人",
              "system_prompt": "你是灵山胜境景区的AI数字人导游，名叫Fay。"},
    "audio": {"mic_enabled": False},
}


@app.route("/", methods=["GET"])
def index():
    return jsonify({"service": "Fay Digital Human", "version": "2.0.0", "status": "running"})


@app.route("/api/get-run-status", methods=["POST"])
def get_run_status():
    return json.dumps({"status": _running})


@app.route("/api/get-system-status", methods=["GET"])
def get_system_status():
    return jsonify({"server": True, "digital_human": False, "remote_audio": False})


@app.route("/api/send", methods=["POST"])
def send_message():
    data = request.values.get("data")
    if not data:
        return jsonify({"result": "error", "message": "未提供数据"})
    try:
        info = json.loads(data)
        msg = info.get("msg", "")
        logger.info("[播报] %s", msg)
        _messages.append({"id": str(uuid.uuid4())[:8], "content": msg, "timestamp": datetime.now().isoformat()})
        return jsonify({"result": "successful"})
    except Exception as e:
        return jsonify({"result": "error", "message": str(e)}), 500


@app.route("/api/submit", methods=["POST"])
def submit_config():
    data = request.values.get("data")
    if not data:
        return jsonify({"result": "error", "message": "未提供数据"})
    try:
        config_data = json.loads(data)
        if "config" in config_data:
            for key, value in config_data["config"].items():
                _config[key] = value
        logger.info("[配置更新] %s", json.dumps(config_data, ensure_ascii=False))
        return jsonify({"result": "successful"})
    except Exception as e:
        return jsonify({"result": "error", "message": str(e)}), 500


@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    """TTS 合成 — 使用 edge_tts 将文本转为音频"""
    import asyncio, edge_tts, tempfile, base64

    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    voice = data.get("voice", "zh-CN-XiaoxiaoNeural")
    if not text.strip():
        return jsonify({"result": "error", "message": "text required"}), 400

    async def _tts():
        communicate = edge_tts.Communicate(text=text[:500], voice=voice, rate="+15%")
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            await communicate.save(tmp.name)
            tmp.seek(0)
            return base64.b64encode(tmp.read()).decode()

    try:
        audio_b64 = asyncio.run(_tts())
        return jsonify({"result": "successful", "audio_base64": audio_b64, "format": "mp3"})
    except Exception as e:
        logger.error("TTS error: %s", e)
        return jsonify({"result": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FAY_PORT", "5000"))
    logger.info("Fay Lite server on 0.0.0.0:%d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
