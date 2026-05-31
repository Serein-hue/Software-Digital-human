#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Shared registry for MCP tool metadata.

Stores tool metadata from MCP servers so the system can query
available tools without re-requesting from every server.
"""

from __future__ import annotations

import json
import os
import threading
from typing import Any, Callable, Dict, List, Optional

_lock = threading.RLock()

# server_id -> list of tool entries
# Each tool entry: {name, description, input_schema, enabled, available, ...}
_server_tools: Dict[int, List[Dict[str, Any]]] = {}

# Persist enabled/disabled states
_STATES_FILE = os.path.join(os.path.dirname(__file__), "data", "mcp_tool_states.json")


def _load_states() -> Dict[str, Dict[str, bool]]:
    """Load persisted tool enabled states. {server_id_str: {tool_name: bool}}"""
    try:
        if os.path.exists(_STATES_FILE):
            with open(_STATES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_states() -> None:
    """Persist current tool enabled states."""
    states: Dict[str, Dict[str, bool]] = {}
    for sid, tools in _server_tools.items():
        tool_states = {}
        for t in tools:
            name = t.get("name")
            if name and not t.get("unavailable", False):
                tool_states[name] = t.get("enabled", True)
        if tool_states:
            states[str(sid)] = tool_states
    try:
        os.makedirs(os.path.dirname(_STATES_FILE), exist_ok=True)
        with open(_STATES_FILE, "w", encoding="utf-8") as f:
            json.dump(states, f, ensure_ascii=False, indent=4)
    except Exception:
        pass


def set_server_tools(
    server_id: int,
    tools: List[Dict[str, Any]],
    enabled_lookup: Optional[Callable[[str], bool]] = None,
) -> None:
    """Cache tools for a server, restoring persisted enabled states.

    Args:
        server_id: MCP server ID.
        tools: List of tool metadata dicts (must contain 'name').
        enabled_lookup: Optional callable(str) -> bool to determine
            the initial enabled state. Falls back to persisted state,
            then to True.
    """
    saved_states = _load_states().get(str(server_id), {})
    entries: List[Dict[str, Any]] = []
    for tool in tools:
        name = tool.get("name", "")
        entry = dict(tool)
        entry["server_id"] = server_id
        entry["available"] = True
        entry["unavailable"] = False
        # Priority: persisted state > enabled_lookup > True
        if name in saved_states:
            entry["enabled"] = saved_states[name]
        elif enabled_lookup:
            try:
                entry["enabled"] = bool(enabled_lookup(name))
            except Exception:
                entry["enabled"] = True
        else:
            entry["enabled"] = True
        entries.append(entry)
    with _lock:
        _server_tools[server_id] = entries


def get_server_tools(
    server_id: int,
    include_disabled: bool = True,
    include_unavailable: bool = False,
) -> List[Dict[str, Any]]:
    """Return tools for a given server.

    Args:
        server_id: MCP server ID.
        include_disabled: If True, include disabled tools.
        include_unavailable: If True, include unavailable tools.

    Returns:
        List of tool metadata dicts.
    """
    with _lock:
        tools = list(_server_tools.get(server_id, []))
    if not include_disabled:
        tools = [t for t in tools if t.get("enabled", True)]
    if not include_unavailable:
        tools = [t for t in tools if not t.get("unavailable", False)]
    return tools


def get_enabled_tools() -> List[Dict[str, Any]]:
    """Return all enabled, available tools across all servers."""
    with _lock:
        result: List[Dict[str, Any]] = []
        for tools in _server_tools.values():
            for t in tools:
                if t.get("enabled", True) and not t.get("unavailable", False):
                    result.append(t)
        return result


def update_tool_enabled(server_id: int, tool_name: str, enabled: bool) -> bool:
    """Toggle a single tool's enabled state. Returns True if found."""
    with _lock:
        tools = _server_tools.get(server_id, [])
        for t in tools:
            if t.get("name") == tool_name:
                t["enabled"] = enabled
                _save_states()
                return True
    return False


def mark_all_unavailable(server_id: int) -> None:
    """Mark all tools for a server as unavailable (e.g. on disconnect)."""
    with _lock:
        tools = _server_tools.get(server_id, [])
        for t in tools:
            t["unavailable"] = True
            t["available"] = False


def remove_server(server_id: int) -> None:
    """Remove all tool entries for a server."""
    with _lock:
        _server_tools.pop(server_id, None)
