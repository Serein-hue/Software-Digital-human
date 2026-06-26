/** 数字人监控页面 — Fay 运行时状态看板 + 播报控制 + 运行日志 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Mic, MicOff, Speaker, Volume2, Wifi, WifiOff,
  Radio, RadioTower, List, Send, RefreshCw, Trash2,
  AlertTriangle, CheckCircle, XCircle, Clock, Loader2,
  Terminal, MessageSquare, Play, Square,
} from 'lucide-react'
import { useT } from '../../i18n'
import {
  fetchRuntimeStatus,
  fetchQueueStatus,
  sendBroadcast,
  toggleMicrophone,
  clearQueue,
  type RuntimeStatus,
} from '../../api/admin'

// ── 事件日志类型 ─────────────────────────────────────────────────────

interface EventLog {
  id: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  time: string
}

let eventId = 0

function now(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function addLog(
  type: EventLog['type'],
  message: string,
  setter: React.Dispatch<React.SetStateAction<EventLog[]>>,
) {
  const id = `evt-${++eventId}`
  setter((prev) => [{ id, type, message, time: now() }, ...prev].slice(0, 100))
}

// ── 主组件 ────────────────────────────────────────────────────────────

export default function DigitalHumanMonitor() {
  const t = useT()
  const [status, setStatus] = useState<RuntimeStatus | null>(null)
  const [queueLen, setQueueLen] = useState(0)
  const [loading, setLoading] = useState(true)
  const [broadcastText, setBroadcastText] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingMic, setTogglingMic] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [logs, setLogs] = useState<EventLog[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 状态轮询 ──────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    const [s, q] = await Promise.all([
      fetchRuntimeStatus(),
      fetchQueueStatus(),
    ])
    if (s) setStatus(s)
    if (q) setQueueLen(q.queueLength)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [refresh])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (autoRefresh) {
      pollRef.current = setInterval(refresh, 10_000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [autoRefresh, refresh])

  // ── 操作处理器 ──────────────────────────────────────────────────

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return
    setSending(true)
    try {
      const result = await sendBroadcast(broadcastText.trim())
      if (result) {
        addLog('success', `广播已发送: "${broadcastText.trim().slice(0, 40)}..."`, setLogs)
        setBroadcastText('')
      } else {
        addLog('error', '广播发送失败', setLogs)
      }
    } catch {
      addLog('error', '广播发送异常', setLogs)
    } finally {
      setSending(false)
    }
  }

  const handleToggleMic = async () => {
    setTogglingMic(true)
    try {
      const result = await toggleMicrophone()
      if (result) {
        const state = result.microphone === 'on' ? '开启' : result.microphone === 'off' ? '关闭' : result.microphone
        addLog('info', `麦克风${state}`, setLogs)
        refresh()
      } else {
        addLog('error', '麦克风切换失败', setLogs)
      }
    } catch {
      addLog('error', '麦克风切换异常', setLogs)
    } finally {
      setTogglingMic(false)
    }
  }

  const handleClearQueue = async () => {
    setClearing(true)
    try {
      const result = await clearQueue()
      if (result) {
        addLog('success', '播报队列已清空', setLogs)
        setQueueLen(0)
      } else {
        addLog('error', '清队失败', setLogs)
      }
    } catch {
      addLog('error', '清队异常', setLogs)
    } finally {
      setClearing(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <motion.div
        className="dhmon-root"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="dashboard-head">
          <div>
            <h2>数字人监控</h2>
            <span>Fay 运行时状态 · 播报控制 · 运行日志</span>
          </div>
        </div>
        <div className="kb-loading">
          <Loader2 size={28} className="spin" />
          <span>连接 Fay 运行时...</span>
        </div>
      </motion.div>
    )
  }

  const fayOnline = status?.fayOnline ?? false

  return (
    <motion.div
      className="dhmon-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="dashboard-head">
        <div>
          <h2>数字人监控</h2>
          <span>Fay 运行时状态 · 播报控制 · 运行日志</span>
        </div>
        <div className="dhmon-head-actions">
          <label className="dhmon-auto-refresh">
            <RefreshCw size={13} className={autoRefresh ? 'spin' : ''} />
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>自动刷新</span>
          </label>
          <button type="button" className="dhmon-btn" onClick={refresh}>
            <RefreshCw size={14} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* ── 状态卡片行 ─────────────────────────────────────────── */}
      <div className="dhmon-status-grid">
        <div className={`dhmon-status-card ${fayOnline ? 'ok' : 'err'}`}>
          <div className="dhmon-status-icon">
            {fayOnline ? <Radio size={20} /> : <WifiOff size={20} />}
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">Fay 核心</span>
            <strong>{fayOnline ? '在线' : '离线'}</strong>
          </div>
          <span className={`dhmon-status-dot ${fayOnline ? 'on' : 'off'}`} />
        </div>

        <div className={`dhmon-status-card ${status?.digitalHumanConnected ? 'ok' : 'err'}`}>
          <div className="dhmon-status-icon">
            <Activity size={20} />
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">数字人连接</span>
            <strong>{status?.digitalHumanConnected ? '已连接' : '未连接'}</strong>
          </div>
          <span className={`dhmon-status-dot ${status?.digitalHumanConnected ? 'on' : 'off'}`} />
        </div>

        <div className={`dhmon-status-card ${status?.ttsOnline ? 'ok' : 'err'}`}>
          <div className="dhmon-status-icon">
            <Volume2 size={20} />
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">TTS 语音</span>
            <strong>{status?.ttsOnline ? '可用' : '不可用'}</strong>
          </div>
          <span className={`dhmon-status-dot ${status?.ttsOnline ? 'on' : 'off'}`} />
        </div>

        <div className={`dhmon-status-card ${status?.mcpOnline ? 'ok' : 'err'}`}>
          <div className="dhmon-status-icon">
            <RadioTower size={20} />
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">MCP 服务</span>
            <strong>{status?.mcpOnline ? '在线' : '离线'}</strong>
          </div>
          <span className={`dhmon-status-dot ${status?.mcpOnline ? 'on' : 'off'}`} />
        </div>

        <div className={`dhmon-status-card ${status?.speaking ? 'speaking' : 'idle'}`}>
          <div className="dhmon-status-icon">
            <Speaker size={20} />
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">播报状态</span>
            <strong>{status?.speaking ? '播报中' : '空闲'}</strong>
          </div>
        </div>

        <div className="dhmon-status-card">
          <div className="dhmon-status-icon">
            <List size={20} />
          </div>
          <div className="dhmon-status-body">
            <span className="dhmon-status-label">队列长度</span>
            <strong>{queueLen}</strong>
          </div>
          {queueLen > 0 && <span className="dhmon-queue-badge">{queueLen}</span>}
        </div>
      </div>

      {/* ── 错误消息 ───────────────────────────────────────────── */}
      {status?.lastError && (
        <div className="dhmon-error-banner">
          <AlertTriangle size={16} />
          <span>{status.lastError}</span>
        </div>
      )}

      {/* ── 操作面板 + 日志 ────────────────────────────────────── */}
      <div className="dhmon-bottom-grid">
        {/* 控制面板 */}
        <div className="dhmon-panel">
          <h3 className="dhmon-panel-title">
            <Terminal size={16} />
            <span>运行控制</span>
          </h3>

          {/* 广播发送 */}
          <div className="dhmon-broadcast-box">
            <div className="dhmon-broadcast-input-wrap">
              <MessageSquare size={14} />
              <input
                type="text"
                className="dhmon-broadcast-input"
                placeholder="输入广播内容，按 Enter 发送..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendBroadcast()}
                disabled={sending || !fayOnline}
              />
            </div>
            <button
              type="button"
              className="dhmon-btn dhmon-btn-primary"
              onClick={handleSendBroadcast}
              disabled={sending || !broadcastText.trim() || !fayOnline}
            >
              {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              <span>{sending ? '发送中...' : '发送广播'}</span>
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="dhmon-actions">
            <button
              type="button"
              className={`dhmon-action-btn ${status?.speaking ? 'active' : ''}`}
              onClick={handleToggleMic}
              disabled={togglingMic || !fayOnline}
            >
              {togglingMic ? (
                <Loader2 size={16} className="spin" />
              ) : status?.speaking ? (
                <MicOff size={16} />
              ) : (
                <Mic size={16} />
              )}
              <span>{status?.speaking ? '关闭麦克风' : '开启麦克风'}</span>
            </button>
            <button
              type="button"
              className="dhmon-action-btn danger"
              onClick={handleClearQueue}
              disabled={clearing || queueLen === 0}
            >
              {clearing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              <span>清空队列</span>
            </button>
          </div>
        </div>

        {/* 运行日志 */}
        <div className="dhmon-panel">
          <h3 className="dhmon-panel-title">
            <Terminal size={16} />
            <span>运行日志</span>
            {logs.length > 0 && (
              <button
                type="button"
                className="dhmon-log-clear"
                onClick={() => setLogs([])}
                title="清除日志"
              >
                <Trash2 size={12} />
              </button>
            )}
          </h3>
          <div className="dhmon-log-container">
            {logs.length === 0 ? (
              <div className="dhmon-log-empty">
                <Terminal size={24} />
                <span>暂无日志，执行操作后将在此显示</span>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    className={`dhmon-log-entry dhmon-log-${log.type}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="dhmon-log-time">{log.time}</span>
                    {log.type === 'success' && <CheckCircle size={12} />}
                    {log.type === 'error' && <XCircle size={12} />}
                    {log.type === 'warning' && <AlertTriangle size={12} />}
                    {log.type === 'info' && <Clock size={12} />}
                    <span className="dhmon-log-msg">{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
