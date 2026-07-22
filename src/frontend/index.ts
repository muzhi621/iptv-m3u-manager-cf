// Frontend assets embedded as strings for Cloudflare Workers
export const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPTV M3U Manager</title>
  <style>
    :root{--bg:#f5f5f5;--card:#fff;--text:#333;--border:#e0e0e0;--primary:#1890ff;--danger:#ff4d4f;--success:#52c41a;--warning:#faad14}
    @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--card:#2a2a2a;--text:#e0e0e0;--border:#404040}}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text)}
    .container{max-width:1200px;margin:0 auto;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:20px}
    .header h1{font-size:24px}
    .btn{padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:14px;transition:opacity .2s}
    .btn:hover{opacity:.85}
    .btn-primary{background:var(--primary);color:#fff}
    .btn-danger{background:var(--danger);color:#fff}
    .btn-success{background:var(--success);color:#fff}
    .btn-sm{padding:4px 10px;font-size:12px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:16px}
    .card h3{margin-bottom:12px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
    .input{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-size:14px}
    .input:focus{outline:none;border-color:var(--primary)}
    .label{display:block;margin-bottom:4px;font-size:13px;color:#888}
    .form-group{margin-bottom:12px}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px}
    .badge-ok{background:#f6ffed;color:#52c41a}
    .badge-error{background:#fff2f0;color:#ff4d4f}
    .badge-pending{background:#fff7e6;color:#faad14}
    .table{width:100%;border-collapse:collapse}
    .table th,.table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border)}
    .table th{font-weight:600;font-size:13px;color:#888}
    .tabs{display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border)}
    .tab{padding:8px 16px;cursor:pointer;border-bottom:2px solid transparent;font-size:14px}
    .tab.active{border-bottom-color:var(--primary);color:var(--primary)}
    .flex{display:flex;gap:8px;align-items:center}
    .flex-between{display:flex;justify-content:space-between;align-items:center}
    .loading{text-align:center;padding:40px;color:#888}
    @media(max-width:768px){.grid{grid-template-columns:1fr}.header h1{font-size:18px}}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
const API_BASE='';
let state={authenticated:false,currentView:'subscriptions',subscriptions:[],outputs:[],tasks:[]};
async function api(path,options={}){const r=await fetch(API_BASE+path,{...options,headers:{'Content-Type':'application/json',...options.headers},credentials:'include'});return r.json()}
async function checkAuth(){const r=await api('/api/auth/status');state.authenticated=r.data?.authenticated??false;render()}
async function login(p){const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:p})});if(r.success){state.authenticated=true;render()}else alert('密码错误')}
async function logout(){await api('/api/auth/logout',{method:'POST'});state.authenticated=false;render()}
async function loadData(){const[subs,outs,tasks]=await Promise.all([api('/subscriptions'),api('/outputs'),api('/api/tasks')]);state.subscriptions=subs.data||[];state.outputs=outs.data||[];state.tasks=tasks.data||[];render()}
async function addSub(){const n=prompt('订阅名称:');if(!n)return;const u=prompt('M3U/TXT地址:');if(!u)return;await api('/subscriptions',{method:'POST',body:JSON.stringify({name:n,url:u})});await loadData()}
async function delSub(id){if(!confirm('确定删除?'))return;await api('/subscriptions/'+id,{method:'DELETE'});await loadData()}
async function syncSub(id){await api('/subscriptions/'+id+'/refresh',{method:'POST'});alert('同步已启动');setTimeout(loadData,2000)}
async function addOutput(){const n=prompt('聚合名称:');if(!n)return;const s=n.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'output-'+Date.now();await api('/outputs',{method:'POST',body:JSON.stringify({name:n,slug:s})});await loadData()}
async function delOutput(id){if(!confirm('确定删除?'))return;await api('/outputs/'+id,{method:'DELETE'});await loadData()}
function esc(s){return s?s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):''}
function render(){
const a=document.getElementById('app');
if(!state.authenticated){a.innerHTML='<div class="container" style="max-width:400px;margin-top:100px"><div class="card"><h3 style="text-align:center;margin-bottom:20px">IPTV M3U Manager</h3><div class="form-group"><label class="label">管理密码</label><input type="password" id="pw" class="input" placeholder="请输入密码"></div><button class="btn btn-primary" style="width:100%" onclick="doLogin()">登录</button></div></div>';return}
a.innerHTML='<div class="container"><div class="header"><h1>IPTV M3U Manager</h1><div class="flex"><span style="font-size:13px;color:#888">Cloudflare Workers</span><button class="btn btn-sm" onclick="logout()">退出</button></div></div><div class="tabs"><div class="tab '+(state.currentView==='subscriptions'?'active':'')+'" onclick="switchView(\'subscriptions\')">订阅源</div><div class="tab '+(state.currentView==='outputs'?'active':'')+'" onclick="switchView(\'outputs\')">聚合源</div><div class="tab '+(state.currentView==='tasks'?'active':'')+'" onclick="switchView(\'tasks\')">任务</div></div><div id="content">'+renderContent()+'</div></div>';
}
function renderContent(){
if(state.currentView==='subscriptions')return'<div class="flex-between" style="margin-bottom:16px"><h3>订阅源 ('+state.subscriptions.length+')</h3><button class="btn btn-primary" onclick="addSub()">添加订阅</button></div>'+(state.subscriptions.length===0?'<div class="card loading">暂无订阅源</div>':'')+'<div class="grid">'+state.subscriptions.map(s=>'<div class="card"><div class="flex-between" style="margin-bottom:8px"><strong>'+esc(s.name)+'</strong><span class="badge '+(s.is_enabled?'badge-ok':'badge-error')+'">'+(s.is_enabled?'启用':'禁用')+'</span></div><div style="font-size:12px;color:#888;margin-bottom:8px;word-break:break-all">'+esc(s.url)+'</div><div style="font-size:12px;color:#888;margin-bottom:12px">'+(s.last_update_status||'未同步')+'</div><div class="flex"><button class="btn btn-primary btn-sm" onclick="syncSub('+s.id+')">同步</button><button class="btn btn-danger btn-sm" onclick="delSub('+s.id+')">删除</button></div></div>').join('')+'</div>';
if(state.currentView==='outputs')return'<div class="flex-between" style="margin-bottom:16px"><h3>聚合源 ('+state.outputs.length+')</h3><button class="btn btn-primary" onclick="addOutput()">创建聚合</button></div>'+(state.outputs.length===0?'<div class="card loading">暂无聚合源</div>':'')+'<div class="grid">'+state.outputs.map(o=>'<div class="card"><div class="flex-between" style="margin-bottom:8px"><strong>'+esc(o.name)+'</strong><span class="badge '+(o.is_enabled?'badge-ok':'badge-error')+'">'+(o.is_enabled?'启用':'禁用')+'</span></div><div style="font-size:12px;color:#888;margin-bottom:8px">/m3u/'+esc(o.slug)+'</div><div style="font-size:13px;margin-bottom:4px">频道: '+(o.member_enabled||0)+' / '+(o.member_total||0)+'</div><div style="font-size:12px;color:#888;margin-bottom:12px">'+(o.last_update_status||'未更新')+'</div><div class="flex"><button class="btn btn-danger btn-sm" onclick="delOutput('+o.id+')">删除</button></div></div>').join('')+'</div>';
if(state.currentView==='tasks')return'<h3 style="margin-bottom:16px">任务列表 ('+state.tasks.length+')</h3>'+(state.tasks.length===0?'<div class="card loading">暂无任务</div>':'')+'<div class="card"><table class="table"><thead><tr><th>名称</th><th>状态</th><th>进度</th><th>消息</th></tr></thead><tbody">'+state.tasks.map(t=>'<tr><td>'+esc(t.name)+'</td><td><span class="badge '+(t.status==='success'?'badge-ok':t.status==='failure'?'badge-error':'badge-pending')+'">'+t.status+'</span></td><td>'+t.progress+'%</td><td style="font-size:12px">'+esc(t.message)+'</td></tr>').join('')+'</tbody></table></div>';
return'';
}
function doLogin(){login(document.getElementById('pw').value)}
function switchView(v){state.currentView=v;loadData()}
window.doLogin=doLogin;window.logout=logout;window.switchView=switchView;window.addSub=addSub;window.delSub=delSub;window.syncSub=syncSub;window.addOutput=addOutput;window.delOutput=delOutput;
checkAuth().then(()=>{if(state.authenticated)loadData()});
  </script>
</body>
</html>`;
