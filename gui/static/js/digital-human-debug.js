(function () {
  const state = {
    humanWs: null,
    panelWs: null,
    audioWs: null,
    statusTimer: null,
    runTimer: null,
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function timestamp() {
    return new Date().toLocaleTimeString("zh-CN", { hour12: false });
  }

  function username() {
    const input = $("#username");
    return ((input && input.value) || "User").trim() || "User";
  }

  function primaryText() {
    const top = ($("#messageText") && $("#messageText").value) || "";
    const bottom = ($("#bottomMessageText") && $("#bottomMessageText").value) || "";
    return (bottom.trim() || top.trim());
  }

  function wsUrl(port) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:${port}`;
  }

  function log(type, message, payload) {
    const logEl = $("#eventLog");
    if (!logEl) {
      return;
    }

    const line = document.createElement("div");
    line.className = `log-line ${type || ""}`;
    const suffix =
      payload === undefined
        ? ""
        : `\n${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}`;
    line.textContent = `[${timestamp()}] ${message}${suffix}`;
    logEl.prepend(line);

    while (logEl.children.length > 300) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  function api(path, options = {}) {
    return fetch(path, options).then(async (response) => {
      const text = await response.text();
      let data = text;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = text;
      }

      if (!response.ok) {
        const detail =
          typeof data === "object" ? data.message || data.error || response.statusText : data;
        throw new Error(detail);
      }

      return data;
    });
  }

  function postJson(path, body) {
    return api(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  }

  function postFormData(path, body) {
    const form = new URLSearchParams();
    form.set("data", JSON.stringify(body || {}));
    return api(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  }

  function setStatus(name, online) {
    const enabled = Boolean(online);
    const label = enabled ? "在线" : "离线";

    const pill = document.querySelector(`[data-status-dot="${name}"]`);
    if (pill) {
      pill.classList.toggle("connected", enabled);
    }

    const text = document.querySelector(`[data-status-text="${name}"]`);
    if (text) {
      text.textContent = label;
      text.classList.toggle("online", enabled);
    }
  }

  function updateRobot(src, stateText) {
    const indicator = $("#sidebarLive2dIndicator");
    const status = $("#sidebarStatus");

    if (stateText) {
      if (status) status.textContent = stateText;
      if ($("#previewState")) $("#previewState").textContent = stateText;
    }

    // Update indicator styling based on state
    if (indicator) {
      if (stateText === "播报中" || stateText === "状态更新") {
        indicator.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
      } else {
        indicator.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }
    }
  }

  function updateStatus() {
    return api(`/api/get-system-status?username=${encodeURIComponent(username())}`)
      .then((data) => {
        setStatus("server", data.server);
        setStatus("digital_human", data.digital_human);
        setStatus("remote_audio", data.remote_audio);
        log("recv", "系统状态", data);
        return data;
      })
      .catch((error) => log("error", `系统状态获取失败: ${error.message}`));
  }

  function updateRunStatus() {
    return api("/api/get-run-status", { method: "POST" })
      .then((data) => {
        const text = data && data.status ? "服务运行中" : "服务未启动";
        if ($("#runStatus")) {
          $("#runStatus").value = text;
        }
        return data;
      })
      .catch((error) => {
        if ($("#runStatus")) {
          $("#runStatus").value = "状态获取失败";
        }
        log("error", `运行状态获取失败: ${error.message}`);
      });
  }

  function applyIncoming(data, source) {
    log("recv", `${source} 收到消息`, data);

    if (!data || typeof data !== "object") {
      return;
    }

    if (data.robot) {
      updateRobot(data.robot, "状态更新");
    }

    if (data.panelMsg !== undefined) {
      const msg = data.panelMsg || "-";
      $("#panelMessage").textContent = msg;
      $("#panelTopMsg").textContent = msg;
    }

    if (data.panelReply && data.panelReply.content !== undefined) {
      $("#lastText").textContent = data.panelReply.content || "-";
    }

    const payload = data.Data || data.data;
    if (payload && typeof payload === "object") {
      if (payload.Text) {
        $("#lastText").textContent = payload.Text;
      }

      if (payload.Value && payload.Key !== "audio") {
        $("#lastText").textContent = payload.Value;
      }

      if (payload.HttpValue || (payload.Value && payload.Key === "audio")) {
        $("#lastAudio").textContent = payload.HttpValue || payload.Value;
      }

      if (payload.Key === "log" && payload.Value) {
        $("#panelTopMsg").textContent = payload.Value;
      }
    }

    if (data.is_connect !== undefined) {
      setStatus("digital_human", data.is_connect);
    }

    if (data.remote_audio_connect !== undefined) {
      setStatus("remote_audio", data.remote_audio_connect);
    }
  }

  function registerWs(socket, kind) {
    const register = { Username: username(), Output: true };
    socket.send(JSON.stringify(register));
    log("send", `${kind} WS 注册用户`, register);
  }

  function openWs(kind, port) {
    const key = `${kind}Ws`;
    const current = state[key];
    if (current && current.readyState === WebSocket.OPEN) {
      registerWs(current, kind);
      log("recv", `${kind} WS 已连接`);
      return;
    }

    if (current) {
      current.close();
    }

    const url = wsUrl(port);
    const socket = new WebSocket(url);
    state[key] = socket;

    socket.onopen = () => {
      log("recv", `${kind} WS 已连接: ${url}`);
      registerWs(socket, kind);
      updateStatus();
    };

    socket.onmessage = (event) => {
      let data = event.data;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }
      applyIncoming(data, kind);
    };

    socket.onerror = () => log("error", `${kind} WS 连接错误: ${url}`);
    socket.onclose = () => {
      log("recv", `${kind} WS 已断开`);
      updateStatus();
    };
  }

  function connectAll() {
    openWs("human", 10002);
    openWs("panel", 10003);
    updateStatus();
  }

  function sendChat(text) {
    const msg = (text || primaryText()).trim();
    if (!msg) {
      log("error", "交互文本不能为空");
      return Promise.resolve();
    }

    return postFormData("/api/send", { username: username(), msg })
      .then((data) => {
        $("#lastText").textContent = msg;
        $("#panelTopMsg").textContent = "已发送到Fay，等待数字人响应...";
        log("send", "已发送到Fay", data);
        return data;
      })
      .catch((error) => log("error", `发送失败: ${error.message}`));
  }

  function transparentPass() {
    const text = primaryText();
    if (!text) {
      log("error", "直接播报文本不能为空");
      return;
    }

    postJson("/transparent-pass", { user: username(), text, queue: false })
      .then((data) => {
        $("#lastText").textContent = text;
        $("#panelTopMsg").textContent = "已提交直接播报";
        updateRobot("/robot/Speaking.jpg", "播报中");
        log("send", "直接播报已提交", data);
      })
      .catch((error) => log("error", `直接播报失败: ${error.message}`));
  }

  function sendSimple(path, payload, label) {
    postJson(path, payload)
      .then((data) => {
        $("#panelTopMsg").textContent = `${label}已提交`;
        log("send", label, data);
      })
      .catch((error) => log("error", `${label}失败: ${error.message}`));
  }

  function startLive() {
    api("/api/start-live", { method: "POST" })
      .then((data) => {
        $("#runStatus").value = "服务运行中";
        $("#panelTopMsg").textContent = "服务已启动，可以实时交互";
        connectAll();
        log("send", "启动服务", data);
      })
      .catch((error) => log("error", `启动服务失败: ${error.message}`));
  }

  function sendRawHuman() {
    const socket = state.humanWs;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      log("error", "数字人 WS 未连接");
      return;
    }

    const raw = $("#rawHumanMessage").value.trim();
    if (!raw) {
      log("error", "原始 WS 消息不能为空");
      return;
    }

    socket.send(raw);
    log("send", "已发送原始数字人 WS 消息", raw);
  }

  function probeAudio() {
    const socket = new WebSocket(wsUrl(9001));
    state.audioWs = socket;

    socket.onopen = () => {
      setStatus("remote_audio", true);
      log("recv", "音频桥 WS 已连接");
      socket.close();
    };
    socket.onerror = () => log("error", "音频桥 WS 探测失败");
    socket.onclose = () => {
      log("recv", "音频桥 WS 已关闭");
      updateStatus();
    };
  }

  function sendBottom() {
    const input = $("#bottomMessageText");
    const text = (input.value || "").trim();
    if (!text) {
      return;
    }
    $("#messageText").value = text;
    input.value = "";
    sendChat(text);
  }

  function bindTabs() {
    $$(".debug-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab;
        $$(".debug-tab").forEach((item) => item.classList.toggle("active", item === tab));
        $$(".debug-tab-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.tabPanel === name);
        });
      });
    });
  }

  function bindActions() {
    document.body.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) {
        return;
      }

      const action = target.dataset.action;
      if (action === "connect-all") connectAll();
      if (action === "connect-human") openWs("human", 10002);
      if (action === "connect-panel") openWs("panel", 10003);
      if (action === "probe-audio") probeAudio();
      if (action === "refresh-status") {
        updateStatus();
        updateRunStatus();
      }
      if (action === "start-live") startLive();
      if (action === "send-chat") sendChat();
      if (action === "transparent-pass") transparentPass();
      if (action === "greet") {
        sendSimple("/to-greet", { username: username(), observation: "debug page" }, "打招呼");
      }
      if (action === "wake") {
        sendSimple("/to-wake", { username: username(), observation: "debug page" }, "唤醒");
      }
      if (action === "stop-talking") {
        sendSimple("/to-stop-talking", { username: username() }, "打断");
      }
      if (action === "send-raw-human") sendRawHuman();
      if (action === "send-bottom") sendBottom();
      if (action === "clear-log") $("#eventLog").innerHTML = "";
    });

    $("#bottomMessageText").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendBottom();
      }
    });

    $("#username").addEventListener("change", () => {
      connectAll();
      updateStatus();
    });
  }

  function init() {
    $("#humanWsUrl").textContent = wsUrl(10002);
    $("#panelWsUrl").textContent = wsUrl(10003);
    $("#audioWsUrl").textContent = wsUrl(9001);
    updateRobot(null, "待机");
    bindTabs();
    bindActions();
    connectAll();
    updateRunStatus();
    state.statusTimer = window.setInterval(updateStatus, 3000);
    state.runTimer = window.setInterval(updateRunStatus, 8000);

    window.addEventListener("beforeunload", () => {
      window.clearInterval(state.statusTimer);
      window.clearInterval(state.runTimer);
      if (state.humanWs) state.humanWs.close();
      if (state.panelWs) state.panelWs.close();
      if (state.audioWs) state.audioWs.close();
    });
  }

  init();
})();
