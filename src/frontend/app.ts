// IPTV M3U Manager - Frontend App
// Simplified vanilla JS SPA (no React build required)

const API_BASE = '';

interface State {
  authenticated: boolean;
  currentView: 'subscriptions' | 'outputs' | 'settings' | 'tasks';
  subscriptions: any[];
  outputs: any[];
  tasks: any[];
  loading: boolean;
}

const state: State = {
  authenticated: false,
  currentView: 'subscriptions',
  subscriptions: [],
  outputs: [],
  tasks: [],
  loading: false,
};

// === API Client ===
async function api(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response.json();
}

// === Auth ===
async function checkAuth() {
  const res = await api('/api/auth/status');
  state.authenticated = res.data?.authenticated ?? false;
  render();
}

async function login(password: string) {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (res.success) {
    state.authenticated = true;
    render();
  } else {
    alert('密码错误');
  }
}

async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  state.authenticated = false;
  render();
}

// === Data Loading ===
async function loadSubscriptions() {
  const res = await api('/subscriptions');
  state.subscriptions = res.data || [];
  render();
}

async function loadOutputs() {
  const res = await api('/outputs');
  state.outputs = res.data || [];
  render();
}

async function loadTasks() {
  const res = await api('/api/tasks');
  state.tasks = res.data || [];
  render();
}

// === Subscription Actions ===
async function addSubscription(name: string, url: string) {
  await api('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ name, url }),
  });
  await loadSubscriptions();
}

async function refreshSubscription(id: number) {
  await api(`/subscriptions/${id}/refresh`, { method: 'POST' });
  await loadSubscriptions();
}

async function deleteSubscription(id: number) {
  if (!confirm('确定删除此订阅源？')) return;
  await api(`/subscriptions/${id}`, { method: 'DELETE' });
  await loadSubscriptions();
}

// === Output Actions ===
async function addOutput(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `output-${Date.now()}`;
  await api('/outputs', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
  await loadOutputs();
}

async function deleteOutput(id: number) {
  if (!confirm('确定删除此聚合源？')) return;
  await api(`/outputs/${id}`, { method: 'DELETE' });
  await loadOutputs();
}

async function refreshOutput(id: number) {
  await api(`/outputs/${id}/refresh`, { method: 'POST' });
  await loadOutputs();
}

// === Render ===
function render() {
  const app = document.getElementById('app')!;
  if (!state.authenticated) {
    app.innerHTML = renderLogin();
    bindLoginEvents();
    return;
  }

  app.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>IPTV M3U Manager</h1>
        <div class="flex">
          <span style="font-size:13px;color:#888">Cloudflare Workers</span>
          <button class="btn btn-sm" onclick="logout()">退出</button>
        </div>
      </div>
      <div class="tabs">
        <div class="tab ${state.currentView === 'subscriptions' ? 'active' : ''}" onclick="switchView('subscriptions')">订阅源</div>
        <div class="tab ${state.currentView === 'outputs' ? 'active' : ''}" onclick="switchView('outputs')">聚合源</div>
        <div class="tab ${state.currentView === 'tasks' ? 'active' : ''}" onclick="switchView('tasks')">任务</div>
        <div class="tab ${state.currentView === 'settings' ? 'active' : ''}" onclick="switchView('settings')">设置</div>
      </div>
      <div id="content">${renderContent()}</div>
    </div>
  `;
}

function renderLogin(): string {
  return `
    <div class="container" style="max-width:400px;margin-top:100px">
      <div class="card">
        <h3 style="text-align:center;margin-bottom:20px">IPTV M3U Manager</h3>
        <div class="form-group">
          <label class="label">管理密码</label>
          <input type="password" id="login-password" class="input" placeholder="请输入密码">
        </div>
        <button class="btn btn-primary" style="width:100%" id="login-btn">登录</button>
      </div>
    </div>
  `;
}

function renderContent(): string {
  switch (state.currentView) {
    case 'subscriptions': return renderSubscriptions();
    case 'outputs': return renderOutputs();
    case 'tasks': return renderTasks();
    case 'settings': return renderSettings();
    default: return '';
  }
}

function renderSubscriptions(): string {
  return `
    <div class="flex-between" style="margin-bottom:16px">
      <h3>订阅源 (${state.subscriptions.length})</h3>
      <button class="btn btn-primary" onclick="showAddSubModal()">添加订阅</button>
    </div>
    ${state.subscriptions.length === 0 ? '<div class="card loading">暂无订阅源，点击上方按钮添加</div>' : ''}
    <div class="grid">
      ${state.subscriptions.map((sub: any) => `
        <div class="card">
          <div class="flex-between" style="margin-bottom:8px">
            <strong>${escapeHtml(sub.name)}</strong>
            <span class="badge ${sub.is_enabled ? 'badge-ok' : 'badge-error'}">${sub.is_enabled ? '启用' : '禁用'}</span>
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:8px;word-break:break-all">${escapeHtml(sub.url)}</div>
          <div style="font-size:12px;color:#888;margin-bottom:12px">
            ${sub.last_update_status || '未同步'}
          </div>
          <div class="flex">
            <button class="btn btn-primary btn-sm" onclick="refreshSubscription(${sub.id})">同步</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSubscription(${sub.id})">删除</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOutputs(): string {
  return `
    <div class="flex-between" style="margin-bottom:16px">
      <h3>聚合源 (${state.outputs.length})</h3>
      <button class="btn btn-primary" onclick="showAddOutputModal()">创建聚合</button>
    </div>
    ${state.outputs.length === 0 ? '<div class="card loading">暂无聚合源，点击上方按钮创建</div>' : ''}
    <div class="grid">
      ${state.outputs.map((out: any) => `
        <div class="card">
          <div class="flex-between" style="margin-bottom:8px">
            <strong>${escapeHtml(out.name)}</strong>
            <span class="badge ${out.is_enabled ? 'badge-ok' : 'badge-error'}">${out.is_enabled ? '启用' : '禁用'}</span>
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:8px">
            /m3u/${escapeHtml(out.slug)}
          </div>
          <div style="font-size:13px;margin-bottom:4px">
            频道: ${out.member_enabled || 0} / ${out.member_total || 0}
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:12px">
            ${out.last_update_status || '未更新'}
          </div>
          <div class="flex">
            <button class="btn btn-success btn-sm" onclick="refreshOutput(${out.id})">刷新</button>
            <button class="btn btn-danger btn-sm" onclick="deleteOutput(${out.id})">删除</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTasks(): string {
  return `
    <div class="flex-between" style="margin-bottom:16px">
      <h3>任务列表 (${state.tasks.length})</h3>
      <button class="btn btn-sm" onclick="loadTasks()">刷新</button>
    </div>
    ${state.tasks.length === 0 ? '<div class="card loading">暂无任务</div>' : ''}
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>名称</th>
            <th>状态</th>
            <th>进度</th>
            <th>消息</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          ${state.tasks.map((task: any) => `
            <tr>
              <td>${escapeHtml(task.name)}</td>
              <td><span class="badge ${task.status === 'success' ? 'badge-ok' : task.status === 'failure' ? 'badge-error' : 'badge-pending'}">${task.status}</span></td>
              <td>${task.progress}%</td>
              <td style="font-size:12px">${escapeHtml(task.message)}</td>
              <td style="font-size:12px;color:#888">${task.created_at || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSettings(): string {
  return `
    <h3 style="margin-bottom:16px">系统设置</h3>
    <div class="card">
      <h4>LLM 配置</h4>
      <div class="form-group">
        <label class="label">文本模型 Base URL</label>
        <input type="text" id="llm-text-url" class="input" placeholder="https://api.openai.com">
      </div>
      <div class="form-group">
        <label class="label">文本模型 API Key</label>
        <input type="password" id="llm-text-key" class="input" placeholder="sk-...">
      </div>
      <div class="form-group">
        <label class="label">文本模型名称</label>
        <input type="text" id="llm-text-model" class="input" placeholder="gpt-3.5-turbo">
      </div>
      <div class="form-group">
        <label class="label">视觉模型 Base URL</label>
        <input type="text" id="llm-vision-url" class="input" placeholder="https://api.openai.com">
      </div>
      <div class="form-group">
        <label class="label">视觉模型 API Key</label>
        <input type="password" id="llm-vision-key" class="input" placeholder="sk-...">
      </div>
      <div class="form-group">
        <label class="label">视觉模型名称</label>
        <input type="text" id="llm-vision-model" class="input" placeholder="gpt-4-vision-preview">
      </div>
      <button class="btn btn-primary" onclick="saveLlmSettings()">保存 LLM 设置</button>
    </div>
  `;
}

// === Modal Helpers ===
function showAddSubModal() {
  const name = prompt('订阅源名称:');
  if (!name) return;
  const url = prompt('M3U/TXT 地址 (多个用逗号分隔):');
  if (!url) return;
  addSubscription(name, url);
}

function showAddOutputModal() {
  const name = prompt('聚合源名称:');
  if (!name) return;
  addOutput(name);
}

async function saveLlmSettings() {
  const textUrl = (document.getElementById('llm-text-url') as HTMLInputElement)?.value;
  const textKey = (document.getElementById('llm-text-key') as HTMLInputElement)?.value;
  const textModel = (document.getElementById('llm-text-model') as HTMLInputElement)?.value;
  const visionUrl = (document.getElementById('llm-vision-url') as HTMLInputElement)?.value;
  const visionKey = (document.getElementById('llm-vision-key') as HTMLInputElement)?.value;
  const visionModel = (document.getElementById('llm-vision-model') as HTMLInputElement)?.value;

  await api('/api/settings/llm', {
    method: 'PUT',
    body: JSON.stringify({
      text: { base_url: textUrl, api_key: textKey, model: textModel },
      vision: { base_url: visionUrl, api_key: visionKey, model: visionModel },
    }),
  });
  alert('保存成功');
}

// === Utils ===
function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// === Global Functions ===
(window as any).switchView = (view: string) => {
  state.currentView = view as any;
  if (view === 'subscriptions') loadSubscriptions();
  else if (view === 'outputs') loadOutputs();
  else if (view === 'tasks') loadTasks();
  render();
};

(window as any).login = login;
(window as any).logout = logout;
(window as any).refreshSubscription = refreshSubscription;
(window as any).deleteSubscription = deleteSubscription;
(window as any).refreshOutput = refreshOutput;
(window as any).deleteOutput = deleteOutput;
(window as any).showAddSubModal = showAddSubModal;
(window as any).showAddOutputModal = showAddOutputModal;
(window as any).saveLlmSettings = saveLlmSettings;
(window as any).loadTasks = loadTasks;

// === Init ===
function bindLoginEvents() {
  const btn = document.getElementById('login-btn');
  const input = document.getElementById('login-password') as HTMLInputElement;
  if (btn && input) {
    btn.onclick = () => login(input.value);
    input.onkeydown = (e) => { if (e.key === 'Enter') login(input.value); };
  }
}

// Start
checkAuth().then(() => {
  if (state.authenticated) {
    loadSubscriptions();
    loadOutputs();
  }
});
