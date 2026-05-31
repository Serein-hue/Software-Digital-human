#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Shared in-process registry for MCP tool metadata.

MCP clients refresh tool definitions asynchronously. This module keeps the
latest snapshot available to Flask routes, prompt injection, and the aggregated
MCP server without forcing each caller to reconnect to the upstream server.
"""

from __future__ import annotations

import threading
import time
from typing import Any, Callable, Dict, List, Optional

_lock = threading.RLock()
_server_tools: Dict[int, List[Dict[str, Any]]] = {}


def _clone_tool(tool: Dict[str, Any]) -> Dict[str, Any]:
    cloned = dict(tool)
    schema = cloned.get("inputSchema")
    cloned["inputSchema"] = dict(schema) if isinstance(schema, dict) else {}
    return cloned


def _normalize_tool(
    server_id: int,
    tool: Dict[str, Any],
    enabled_lookup: Optional[Callable[[str], bool]] = None,
) -> Optional[Dict[str, Any]]:
    name = str(tool.get("name", "")).strip()
    if not name:
        return None

    if enabled_lookup is not None:
        try:
            enabled = bool(enabled_lookup(name))
        except Exception:
            enabled = bool(tool.get("enabled", True))
    else:
        enabled = bool(tool.get("enabled", True))

    return {
        "server_id": int(server_id),
        "name": name,
        "description": str(tool.get("description", "") or ""),
        "inputSchema": dict(tool.get("inputSchema") or {})
        if isinstance(tool.get("inputSchema"), dict)
        else {},
        "enabled": enabled,
        "available": bool(tool.get("available", True)),
        "last_checked": time.time(),
    }


def set_server_tools(
    server_id: int,
    tools: List[Dict[str, Any]],
    enabled_lookup: Optional[Callable[[str], bool]] = None,
) -> None:
    """Replace one server's tool snapshot."""
    normalized: List[Dict[str, Any]] = []
    for tool in tools or []:
        if not isinstance(tool, dict):
            continue
        item = _normalize_tool(server_id, tool, enabled_lookup)
        if item:
            normalized.append(item)

    with _lock:
        _server_tools[int(server_id)] = normalized


def get_server_tools(
    server_id: int,
    *,
    include_disabled: bool = False,
    include_unavailable: bool = True,
) -> List[Dict[str, Any]]:
    """Return a filtered copy of one server's cached tool snapshot."""
    with _lock:
        tools = list(_server_tools.get(int(server_id), []))

    result: List[Dict[str, Any]] = []
    for tool in tools:
        if not include_disabled and not tool.get("enabled", True):
            continue
        if not include_unavailable and not tool.get("available", True):
            continue
        result.append(_clone_tool(tool))
    return result


def get_enabled_tools() -> List[Dict[str, Any]]:
    """Return all enabled and currently available tools."""
    with _lock:
        tools = [tool for snapshot in _server_tools.values() for tool in snapshot]

    return [
        _clone_tool(tool)
        for tool in tools
        if tool.get("enabled", True) and tool.get("available", True)
    ]


def update_tool_enabled(server_id: int, tool_name: str, enabled: bool) -> bool:
    """Update a cached tool enabled flag. Returns True when the tool exists."""
    with _lock:
        for tool in _server_tools.get(int(server_id), []):
            if tool.get("name") == tool_name:
                tool["enabled"] = bool(enabled)
                tool["last_checked"] = time.time()
                return True
    return False


def mark_all_unavailable(server_id: int) -> None:
    """Mark a server's cached tools unavailable without forgetting metadata."""
    with _lock:
        for tool in _server_tools.get(int(server_id), []):
            tool["available"] = False
            tool["last_checked"] = time.time()


def remove_server(server_id: int) -> None:
    """Remove all cached tools for a server."""
    with _lock:
        _server_tools.pop(int(server_id), None)
