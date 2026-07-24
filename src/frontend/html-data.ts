export const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IPTV M3U Manager</title>
<style>
:root{--bg:#f5f7fa;--card:#fff;--text:#1a1a2e;--text2:#666;--border:#e8e8e8;--primary:#4f46e5;--primary-hover:#4338ca;--danger:#ef4444;--success:#10b981;--warning:#f59e0b;--radius:12px;--shadow:0 2px 12px rgba(0,0,0,.08)}
@media(prefers-color-scheme:dark){:root{--bg:#0f0f23;--card:#1a1a2e;--text:#e2e8f0;--text2:#94a3b8;--border:#2d2d44;--primary:#818cf8;--primary-hover:#6366f1;--shadow:0 2px 12px rgba(0,0,0,.3)}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.app{max-width:1400px;margin:0 auto;padding:16px}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:24px}
.header h1{font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--primary),#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.btn{padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.15)}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:hover{background:var(--primary-hover)}
.btn-danger{background:var(--danger);color:#fff}
.btn-success{background:var(--success);color:#fff}
.btn-warning{background:var(--warning);color:#fff}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--card)}
.btn-sm{padding:6px 12px;font-size:12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;box-shadow:var(--shadow)}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card-title{font-size:16px;font-weight:600}
.input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:14px;transition:border-color .2s}
.input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,.1)}
textarea.input{min-height:80px;resize:vertical;font-family:monospace;font-size:13px}
select.input{cursor:pointer;appearance:auto}
label{display:block;margin-bottom:6px;font-size:13px;font-weight:500;color:var(--text2)}
.form-group{margin-bottom:16px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500}
.badge-ok{background:#d1fae5;color:#065f46}
.badge-err{background:#fee2e2;color:#991b1b}
.badge-warn{background:#fef3c7;color:#92400e}
.badge-info{background:#e0e7ff;color:#3730a3}
.tabs{display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0}
.tab{padding:10px 20px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;font-size:14px;font-weight:500;color:var(--text2);transition:all .2s}
.tab:hover{color:var(--text)}
.tab.active{border-bottom-color:var(--primary);color:var(--primary)}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);font-size:13px}
.table th{font-size:11px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;background:rgba(79,70,229,.03)}
.table tr:hover{background:rgba(79,70,229,.03)}
.table td img.logo{width:24px;height:24px;border-radius:4px;object-fit:contain}
.flex{display:flex;gap:8px;align-items:center}
.flex-between{display:flex;justify-content:space-between;align-items:center}
.gap-12{gap:12px}
.mt-8{margin-top:8px}
.mt-16{margin-top:16px}
.mb-8{margin-bottom:8px}
.mb-16{margin-bottom:16px}
.text-sm{font-size:13px}
.text-xs{font-size:12px}
.text-muted{color:var(--text2)}
.text-center{text-align:center}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
.modal{background:var(--card);border-radius:16px;padding:24px;max-width:900px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.modal-header h2{font-size:18px;font-weight:600}
.modal-close{width:32px;height:32px;border:none;background:transparent;cursor:pointer;border-radius:8px;font-size:18px;color:var(--text2);display:flex;align-items:center;justify-content:center}
.modal-close:hover{background:var(--border)}
.loading{display:flex;justify-content:center;padding:40px}
.spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:#fff;font-size:14px;z-index:2000;animation:slideIn .3s ease}
.toast-success{background:var(--success)}
.toast-error{background:var(--danger)}
.toast-info{background:var(--primary)}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
.progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.progress-bar-fill{height:100%;background:var(--primary);border-radius:3px;transition:width .3s}
.search-bar{position:relative;margin-bottom:12px}
.search-bar input{padding-left:36px}
.search-bar::before{content:"\\2315";position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px}
.empty{text-align:center;padding:60px 20px;color:var(--text2)}
.empty-icon{font-size:48px;margin-bottom:12px}
.list-item{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;margin-bottom:12px;transition:box-shadow .2s}
.list-item:hover{box-shadow:var(--shadow)}
.list-item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.list-item-title{font-size:15px;font-weight:600}
.list-item-url{font-size:12px;color:var(--text2);word-break:break-all;margin-bottom:6px;font-family:monospace;background:rgba(79,70,229,.05);padding:6px 10px;border-radius:6px}
.list-item-meta{font-size:12px;color:var(--text2);margin-bottom:10px}
.list-item-actions{display:flex;gap:6px;flex-wrap:wrap}
.sub-type-tabs{display:flex;gap:8px;margin-bottom:16px}
.sub-type-tab{padding:8px 20px;border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);transition:all .2s;background:var(--card)}
.sub-type-tab:hover{border-color:var(--primary);color:var(--primary)}
.sub-type-tab.active{border-color:var(--primary);background:var(--primary);color:#fff}
.preview-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;padding:12px;background:rgba(79,70,229,.03);border-radius:8px}
.preview-toolbar .search-bar{margin-bottom:0;flex:1;min-width:200px}
.ch-check{width:16px;height:16px;cursor:pointer;accent-color:var(--primary)}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.status-ok{background:var(--success)}
.status-fail{background:var(--danger)}
.status-pending{background:var(--warning)}
</style>
</head>
<body>
<div id="app" class="app"></div>
<script>
(function(){
var S={auth:false,view:"subs",subs:[],outs:[],tasks:[],channels:[],preview:null,outputDetail:null,selectedSub:0,selectedOutput:0,subTypeTab:"normal"};
var TK="iptv_token";

function api(p,o){
  o=o||{};
  o.headers=o.headers||{};
  o.headers["Content-Type"]="application/json";
  var t=localStorage.getItem(TK);
  if(t)o.headers["Authorization"]="Bearer "+t;
  return fetch(p,o).then(function(r){
    if(!r.ok)return r.json().then(function(e){throw new Error(e.error||"Request failed")});
    return r.json();
  });
}

function toast(msg,type){
  var d=document.createElement("div");
  d.className="toast toast-"+(type||"info");
  d.textContent=msg;
  document.body.appendChild(d);
  setTimeout(function(){d.remove()},3000);
}

function chk(){
  var t=localStorage.getItem(TK);
  if(!t){S.auth=false;render();return}
  api("/api/auth/status").then(function(r){
    S.auth=r.authenticated||false;
    if(!S.auth)localStorage.removeItem(TK);
    render();
    if(S.auth)load();
  }).catch(function(){S.auth=false;render()});
}

function doLogin(){
  var pw=document.getElementById("pw");
  if(!pw||!pw.value)return;
  api("/api/auth/login",{method:"POST",body:JSON.stringify({password:pw.value})}).then(function(r){
    if(r.success&&r.token){
      localStorage.setItem(TK,r.token);
      S.auth=true;
      render();
      setTimeout(load,100);
    }else{toast("密码错误","error")}
  }).catch(function(e){toast(e.message||"登录失败","error")});
}

function doLogout(){
  localStorage.removeItem(TK);
  S.auth=false;
  S.view="subs";
  render();
}

function load(){
  Promise.all([
    api("/subscriptions").catch(function(){return{data:[]}}),
    api("/outputs").catch(function(){return{data:[]}}),
    api("/api/tasks").catch(function(){return{data:[]}})
  ]).then(function(r){
    S.subs=r[0].data||[];
    S.outs=r[1].data||[];
    S.tasks=r[2].data||[];
    render();
  }).catch(function(){render()});
}

function showModal(title,body,onConfirm,onOpen){
  var m=document.createElement("div");
  m.className="modal-overlay";
  var modal=document.createElement("div");
  modal.className="modal";
  var hdr=document.createElement("div");
  hdr.className="modal-header";
  var h2=document.createElement("h2");
  h2.textContent=title;
  var closeBtn=document.createElement("button");
  closeBtn.className="modal-close";
  closeBtn.textContent="\\u2715";
  closeBtn.onclick=function(){m.remove()};
  hdr.appendChild(h2);
  hdr.appendChild(closeBtn);
  var bodyDiv=document.createElement("div");
  bodyDiv.className="modal-body";
  bodyDiv.innerHTML=body;
  var foot=document.createElement("div");
  foot.style.cssText="display:flex;justify-content:flex-end;gap:8px;margin-top:20px";
  var cancelBtn=document.createElement("button");
  cancelBtn.className="btn btn-ghost";
  cancelBtn.textContent="取消";
  cancelBtn.onclick=function(){m.remove()};
  var confirmBtn=document.createElement("button");
  confirmBtn.className="btn btn-primary";
  confirmBtn.textContent="确定";
  confirmBtn.onclick=function(){
    if(onConfirm){
      var r=onConfirm();
      if(r!==false)m.remove();
    }else m.remove();
  };
  foot.appendChild(cancelBtn);
  foot.appendChild(confirmBtn);
  modal.appendChild(hdr);
  modal.appendChild(bodyDiv);
  modal.appendChild(foot);
  m.appendChild(modal);
  m.addEventListener("click",function(e){if(e.target===m)m.remove()});
  document.body.appendChild(m);
  if(onOpen)onOpen();
}

function showConfirm(msg,cb){showModal("确认操作","<p>"+msg+"</p>",function(){cb();return true})}

function esc(s){return s?s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):''}

function render(){
  var a=document.getElementById("app");
  if(!a)return;
  if(!S.auth){
    a.innerHTML='<div style="max-width:400px;margin:80px auto"><div class="card"><div style="text-align:center;margin-bottom:24px"><h1 style="font-size:28px;margin-bottom:8px">IPTV M3U Manager</h1><p class="text-muted text-sm">订阅聚合与过滤工具</p></div><div class="form-group"><label>管理密码</label><input type="password" id="pw" class="input" placeholder="请输入管理密码"></div><button class="btn btn-primary" style="width:100%;padding:12px" id="loginBtn">登 录</button></div></div>';
    document.getElementById("loginBtn").onclick=function(){doLogin()};
    document.getElementById("pw").onkeydown=function(e){if(e.key==="Enter")doLogin()};
    return;
  }
  var h='<div class="header"><h1>IPTV M3U Manager</h1><div class="flex"><span class="text-sm text-muted">Cloudflare Workers</span><button class="btn btn-ghost btn-sm" id="logoutBtn">退出</button></div></div>';
  h+='<div class="tabs">';
  h+='<div class="tab'+(S.view==="subs"?" active":"")+'" data-v="subs">订阅源</div>';
  h+='<div class="tab'+(S.view==="outs"?" active":"")+'" data-v="outs">聚合源</div>';
  h+='<div class="tab'+(S.view==="tasks"?" active":"")+'" data-v="tasks">任务</div>';
  h+='</div><div id="content"></div>';
  a.innerHTML=h;
  document.getElementById("logoutBtn").onclick=function(){doLogout()};
  var tabs=a.querySelectorAll(".tab");
  for(var i=0;i<tabs.length;i++){
    tabs[i].onclick=function(){S.view=this.getAttribute("data-v");render();if(S.view!=="output-detail"&&S.view!=="sub-channels")load()};
  }
  renderContent();
}

function renderContent(){
  var c=document.getElementById("content");
  if(!c)return;
  if(S.view==="subs")renderSubs(c);
  else if(S.view==="sub-channels")renderSubChannels(c);
  else if(S.view==="outs")renderOutputs(c);
  else if(S.view==="output-detail")renderOutputDetail(c);
  else if(S.view==="tasks")renderTasks(c);
}

// === Subscriptions List ===
function renderSubs(c){
  var h='<div class="card-header"><div class="card-title">\\u{1F4E5} 订阅源 ('+S.subs.length+')</div><button class="btn btn-primary" id="addSubBtn">+ 添加订阅源</button></div>';
  if(S.subs.length===0){
    h+='<div class="empty"><div class="empty-icon">\\u{1F4FA}</div><div>暂无订阅源</div><div class="text-sm text-muted mt-8">点击上方按钮添加第一个订阅源</div></div>';
  }else{
    S.subs.forEach(function(s){
      var isGit=s.url.indexOf(".git")!==-1||s.url.indexOf("github.com")!==-1;
      h+='<div class="list-item">';
      h+='<div class="list-item-header"><div class="list-item-title">'+esc(s.name)+'</div><div class="flex gap-12"><span class="badge '+(s.is_enabled?"badge-ok":"badge-err")+'">'+(s.is_enabled?"启用":"禁用")+'</span><span class="badge badge-info">'+(isGit?"Git 仓库":"普通订阅")+'</span></div></div>';
      h+='<div class="list-item-url" title="'+esc(s.url)+'">'+esc(s.url)+'</div>';
      h+='<div class="list-item-meta">'+(s.last_update_status||"未同步")+(s.last_updated?" | "+esc(s.last_updated):"")+(s.auto_update_minutes>0?" | 自动更新: 每"+s.auto_update_minutes+"分钟":"")+'</div>';
      h+='<div class="list-item-actions">';
      h+='<button class="btn btn-primary btn-sm" data-action="sync" data-id="'+s.id+'">\\u{1F504} 同步</button>';
      h+='<button class="btn btn-ghost btn-sm" data-action="view-ch" data-id="'+s.id+'">\\u{1F4FA} 频道</button>';
      h+='<button class="btn btn-ghost btn-sm" data-action="edit-sub" data-id="'+s.id+'">\\u{270F}\\uFE0F 修改</button>';
      h+='<button class="btn btn-ghost btn-sm" data-action="toggle-sub" data-id="'+s.id+'">'+(s.is_enabled?"\\u{1F512} 禁用":"\\u{1F513} 启用")+'</button>';
      h+='<button class="btn btn-danger btn-sm" data-action="del-sub" data-id="'+s.id+'">\\u{1F5D1}\\uFE0F 删除</button>';
      h+='</div></div>';
    });
  }
  c.innerHTML=h;
  document.getElementById("addSubBtn").onclick=function(){showAddSubModal()};
}

function renderSubChannels(c){
  var sub=S.subs.find(function(x){return x.id===S.selectedSub});
  var h='<div class="flex-between mb-16"><div class="flex gap-12"><button class="btn btn-ghost btn-sm" id="backSubBtn">\\u2190 返回</button><h3>'+(sub?esc(sub.name):"")+' - 频道列表</h3></div><span class="text-sm text-muted">共 '+S.channels.length+' 个频道</span></div>';
  h+='<div class="search-bar"><input class="input" id="chSearch" placeholder="搜索频道..."></div>';
  h+='<div class="card"><table class="table"><thead><tr><th>名称</th><th>分组</th><th>状态</th><th>操作</th></tr></thead><tbody id="ch-list">';
  S.channels.forEach(function(ch){
    h+='<tr><td>'+esc(ch.name)+'</td><td>'+esc(ch["group"]||"-")+'</td><td><span class="badge '+(ch.is_enabled?"badge-ok":"badge-err")+'">'+(ch.is_enabled?"启用":"禁用")+'</span></td><td><button class="btn btn-ghost btn-sm" data-action="toggle-ch" data-id="'+ch.id+'">切换</button></td></tr>';
  });
  h+='</tbody></table></div>';
  c.innerHTML=h;
  document.getElementById("backSubBtn").onclick=function(){S.view="subs";render();load()};
  document.getElementById("chSearch").oninput=function(){filterSubChannels(this.value)};
}

function filterSubChannels(q){
  var rows=document.querySelectorAll("#ch-list tr");
  for(var i=0;i<rows.length;i++){
    rows[i].style.display=rows[i].textContent.toLowerCase().indexOf(q.toLowerCase())>=0?"":"none";
  }
}

// === Outputs List ===
function renderOutputs(c){
  var h='<div class="card-header"><div class="card-title">\\u{1F4E6} 聚合源 ('+S.outs.length+')</div><button class="btn btn-primary" id="addOutBtn">+ 创建聚合</button></div>';
  if(S.outs.length===0){
    h+='<div class="empty"><div class="empty-icon">\\u{1F4E6}</div><div>暂无聚合源</div><div class="text-sm text-muted mt-8">创建聚合源来管理和导出频道列表</div></div>';
  }else{
    S.outs.forEach(function(o){
      h+='<div class="list-item">';
      h+='<div class="list-item-header"><div class="list-item-title">'+esc(o.name)+' <span class="badge '+(o.is_enabled?"badge-ok":"badge-err")+'">'+(o.is_enabled?"运行中":"已禁用")+'</span></div></div>';
      h+='<div class="list-item-url">'+location.origin+'/m3u/'+esc(o.slug)+' <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;margin-left:8px" data-action="copy-m3u" data-slug="'+esc(o.slug)+'">复制</button></div>';
      h+='<div class="list-item-meta">';
      h+=(o.filter_regex&&o.filter_regex!==".*"?"正则: "+esc(o.filter_regex)+" | ":"");
      h+='\\u{1F4FA} 频道: '+(o.member_total||0)+' 总计  \\u{2705} '+(o.member_enabled||0)+' 启用  \\u{274C} '+(o.member_disabled||0)+' 禁用';
      h+=' (来源: '+JSON.parse(o.subscription_ids||"[]").length+')';
      h+='</div>';
      h+='<div class="list-item-meta">';
      h+=(o.last_updated?"最后同步: "+esc(o.last_updated):"从未同步");
      h+=(o.last_request_time?" | 最近请求: "+esc(o.last_request_time):" | 最近请求: 从未");
      h+='</div>';
      h+='<div class="list-item-actions">';
      h+='<button class="btn btn-ghost btn-sm" data-action="edit-out" data-id="'+o.id+'">\\u{270F}\\uFE0F 修改</button>';
      h+='<button class="btn btn-ghost btn-sm" data-action="toggle-out" data-id="'+o.id+'">'+(o.is_enabled?"\\u{1F512} 禁用":"\\u{1F513} 启用")+'</button>';
      h+='<button class="btn btn-primary btn-sm" data-action="refresh-out" data-id="'+o.id+'">\\u{1F504} 刷新源</button>';
      h+='<button class="btn btn-success btn-sm" data-action="preview-out" data-id="'+o.id+'">\\u{1F441} 预览</button>';
      h+='<button class="btn btn-danger btn-sm" data-action="del-out" data-id="'+o.id+'">\\u{1F5D1}\\uFE0F 删除</button>';
      h+='</div></div>';
    });
  }
  c.innerHTML=h;
  document.getElementById("addOutBtn").onclick=function(){showAddOutputModal()};
}

// === Output Detail (Preview with Channel Selection) ===
function renderOutputDetail(c){
  var o=S.outputDetail;
  var p=S.preview;
  if(!o){c.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}
  var totalChannels=0;
  var allChs=[];
  if(p&&p.groups){
    p.groups.forEach(function(g){totalChannels+=g.count;g.channels.forEach(function(ch){ch._group=g.name;allChs.push(ch)})});
  }
  var enabledCount=allChs.filter(function(ch){return ch.is_enabled}).length;
  var h='<div class="flex-between mb-16"><div class="flex gap-12"><button class="btn btn-ghost btn-sm" id="backOutBtn">\\u2190 返回</button><h3>'+esc(o.name)+'</h3></div><div class="flex gap-12"><button class="btn btn-primary btn-sm" data-action="copy-m3u" data-slug="'+esc(o.slug)+'">复制 M3U 链接</button></div></div>';

  // Toolbar
  h+='<div class="preview-toolbar">';
  h+='<div class="search-bar"><input class="input" id="previewSearch" placeholder="搜索频道名称..."></div>';
  h+='<label style="display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap"><input type="checkbox" id="autoToggleChk" class="ch-check"> 根据结果自动启用/禁用</label>';
  h+='<button class="btn btn-warning btn-sm" id="quickDetectBtn">\\u{1F680} 快速检测</button>';
  h+='<button class="btn btn-danger btn-sm" id="deepDetectBtn">\\u{1F4FA} 深度检测</button>';
  h+='</div>';

  // Selection controls
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  h+='<button class="btn btn-primary btn-sm" id="selectAllBtn">全选</button>';
  h+='<button class="btn btn-ghost btn-sm" id="invertSelectBtn">反选</button>';
  h+='<button class="btn btn-success btn-sm" id="selectEnabledBtn">全选启用</button>';
  h+='<button class="btn btn-ghost btn-sm" id="selectDisabledBtn">全选禁用</button>';
  h+='<button class="btn btn-success btn-sm" id="enableSelectedBtn">启用选中</button>';
  h+='<button class="btn btn-danger btn-sm" id="disableSelectedBtn">禁用选中</button>';
  h+='</div>';

  // Channel table
  h+='<div class="card" style="padding:0;overflow-x:auto"><table class="table" id="previewTable"><thead><tr>';
  h+='<th style="width:40px"><input type="checkbox" id="checkAll" class="ch-check"></th>';
  h+='<th style="width:40px">Logo</th>';
  h+='<th>名称</th>';
  h+='<th>tvg-id</th>';
  h+='<th>分组</th>';
  h+='<th>来源</th>';
  h+='<th>可用性</th>';
  h+='<th style="width:60px">操作</th>';
  h+='</tr></thead><tbody id="preview-body">';

  allChs.forEach(function(ch){
    var logoHtml=ch.logo?'<img class="logo" src="'+esc(ch.logo)+'" onerror="this.style.display=\\'none\\'">':'<span style="display:inline-block;width:24px"></span>';
    var subName="";
    S.subs.forEach(function(s){if(s.id===ch.subscription_id)subName=s.name});
    var statusHtml=ch.check_status===1?'<span class="status-dot status-ok"></span>\\u{2705} '+(ch.check_date||""):(ch.check_status===2?'<span class="status-dot status-fail"></span>\\u{274C} 失败':'<span class="status-dot status-pending"></span> -');

    h+='<tr data-ch-id="'+ch.id+'">';
    h+='<td><input type="checkbox" class="ch-check ch-select" data-id="'+ch.id+'" '+(ch.is_enabled?"checked":"")+'></td>';
    h+='<td>'+logoHtml+'</td>';
    h+='<td>'+esc(ch.name)+'</td>';
    h+='<td class="text-muted">'+esc(ch.tvg_name||"-")+'</td>';
    h+='<td>'+esc(ch._group||"-")+'</td>';
    h+='<td class="text-muted">'+esc(subName)+'</td>';
    h+='<td>'+statusHtml+'</td>';
    h+='<td><button class="btn '+(ch.is_enabled?"btn-danger":"btn-success")+' btn-sm ch-toggle-btn" data-id="'+ch.id+'">'+(ch.is_enabled?"禁用":"启用")+'</button></td>';
    h+='</tr>';
  });

  h+='</tbody></table></div>';

  // Footer stats
  h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;color:var(--text2);font-size:13px">';
  h+='<span>共 '+totalChannels+' 个频道 / 已启用 '+enabledCount+' 个 (已选 <span id="selectedCount">'+enabledCount+'</span> 个)</span>';
  h+='</div>';

  c.innerHTML=h;
  document.getElementById("backOutBtn").onclick=function(){S.view="outs";render();load()};

  // Search filter
  var ps=document.getElementById("previewSearch");
  if(ps)ps.oninput=function(){filterPreviewTable(this.value)};

  // Check all
  var checkAll=document.getElementById("checkAll");
  if(checkAll)checkAll.onchange=function(){
    var checked=this.checked;
    document.querySelectorAll(".ch-select").forEach(function(cb){cb.checked=checked});
    updateSelectedCount();
  };

  // Select all
  var selAllBtn=document.getElementById("selectAllBtn");
  if(selAllBtn)selAllBtn.onclick=function(){document.querySelectorAll(".ch-select").forEach(function(cb){cb.checked=true});updateSelectedCount()};

  // Invert
  var invBtn=document.getElementById("invertSelectBtn");
  if(invBtn)invBtn.onclick=function(){document.querySelectorAll(".ch-select").forEach(function(cb){cb.checked=!cb.checked});updateSelectedCount()};

  // Select enabled
  var selEnBtn=document.getElementById("selectEnabledBtn");
  if(selEnBtn)selEnBtn.onclick=function(){
    allChs.forEach(function(ch){
      var cb=document.querySelector('.ch-select[data-id="'+ch.id+'"]');
      if(cb)cb.checked=ch.is_enabled?true:false;
    });
    updateSelectedCount();
  };

  // Select disabled
  var selDisBtn=document.getElementById("selectDisabledBtn");
  if(selDisBtn)selDisBtn.onclick=function(){
    allChs.forEach(function(ch){
      var cb=document.querySelector('.ch-select[data-id="'+ch.id+'"]');
      if(cb)cb.checked=ch.is_enabled?false:true;
    });
    updateSelectedCount();
  };

  // Enable selected
  var enSelBtn=document.getElementById("enableSelectedBtn");
  if(enSelBtn)enSelBtn.onclick=function(){batchToggleChannels(true)};

  // Disable selected
  var disSelBtn=document.getElementById("disableSelectedBtn");
  if(disSelBtn)disSelBtn.onclick=function(){batchToggleChannels(false)};

  // Individual toggle buttons
  document.querySelectorAll(".ch-toggle-btn").forEach(function(btn){
    btn.onclick=function(){toggleChannel(parseInt(this.getAttribute("data-id")))}
  });

  // Update count on checkbox change
  document.querySelectorAll(".ch-select").forEach(function(cb){
    cb.onchange=function(){updateSelectedCount()};
  });

  // Quick detect
  var qdBtn=document.getElementById("quickDetectBtn");
  if(qdBtn)qdBtn.onclick=function(){toast("快速检测功能开发中","info")};

  // Deep detect
  var ddBtn=document.getElementById("deepDetectBtn");
  if(ddBtn)ddBtn.onclick=function(){toast("深度检测功能开发中","info")};
}

function updateSelectedCount(){
  var count=0;
  document.querySelectorAll(".ch-select").forEach(function(cb){if(cb.checked)count++});
  var el=document.getElementById("selectedCount");
  if(el)el.textContent=count;
}

function filterPreviewTable(q){
  var rows=document.querySelectorAll("#preview-body tr");
  for(var i=0;i<rows.length;i++){
    rows[i].style.display=rows[i].textContent.toLowerCase().indexOf(q.toLowerCase())>=0?"":"none";
  }
}

function batchToggleChannels(enable){
  var ids=[];
  document.querySelectorAll(".ch-select:checked").forEach(function(cb){ids.push(parseInt(cb.getAttribute("data-id")))});
  if(ids.length===0){toast("请先选择频道","error");return}
  var promises=ids.map(function(id){return api("/channels/"+id+"/toggle",{method:"POST"})});
  Promise.all(promises).then(function(){toast("已批量"+(enable?"启用":"禁用")+" "+ids.length+" 个频道","success");loadOutputDetail(S.selectedOutput)}).catch(function(e){toast(e.message,"error")});
}

function renderTasks(c){
  var h='<div class="card-header"><div class="card-title">\\u{23F3} 任务列表 ('+S.tasks.length+')</div><button class="btn btn-ghost btn-sm" id="refreshTasksBtn">刷新</button></div>';
  if(S.tasks.length===0)h+='<div class="empty"><div class="empty-icon">\\u23F3</div><div>暂无任务</div></div>';
  else{
    h+='<div class="card"><table class="table"><thead><tr><th>名称</th><th>状态</th><th>进度</th><th>消息</th><th>时间</th></tr></thead><tbody>';
    S.tasks.forEach(function(t){
      var cls=t.status==="success"?"badge-ok":t.status==="failure"?"badge-err":t.status==="running"?"badge-info":"badge-warn";
      h+='<tr><td>'+esc(t.name)+'</td><td><span class="badge '+cls+'">'+t.status+'</span></td><td><div class="progress-bar" style="width:100px"><div class="progress-bar-fill" style="width:'+t.progress+'%"></div></div></td><td class="text-sm">'+esc(t.message)+'</td><td class="text-xs text-muted">'+esc(t.created_at||"")+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  c.innerHTML=h;
  document.getElementById("refreshTasksBtn").onclick=function(){load()};
}

// === Add Subscription Modal (with tabs) ===
function showAddSubModal(){
  S.subTypeTab="normal";
  var body='<div class="sub-type-tabs"><div class="sub-type-tab active" id="stab-normal" onclick="window._switchSubTab(\\'normal\\')">\\u{1F517} 普通订阅</div><div class="sub-type-tab" id="stab-git" onclick="window._switchSubTab(\\'git\\')">\\u{1F4C1} Git 仓库</div></div>';
  body+='<div id="sub-form-normal">';
  body+='<div class="form-group"><label>名称 (例如: 卫视精品)</label><input id="m-name" class="input" placeholder="输入订阅源名称"></div>';
  body+='<div class="form-group"><label>M3U URL (多个地址请用英文逗号隔开)</label><textarea id="m-url" class="input" placeholder="https://example.com/playlist.m3u" style="min-height:60px"></textarea></div>';
  body+='<div class="form-group"><label>User-Agent (可选，推荐选择下方常用 UA)</label><select id="m-ua" class="input">';
  body+='<option value="AptvPlayer/1.4.1">AptvPlayer/1.4.1 - APTV (iOS/Apple TV) - 推荐</option>';
  body+='<option value="Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.2.0 Mobile Safari/537.36">TiviMate/5.2.0 (Android 15) - TiviMate (Android TV) - 推荐</option>';
  body+='<option value="Mozilla/5.0">Mozilla/5.0 - 默认 (Browser)</option>';
  body+='<option value="VLC/3.0.18 LibVLC/3.0.18">VLC/3.0.18 - VLC Media Player</option>';
  body+='<option value="PotPlayer/1.7">PotPlayer/1.7 - PotPlayer (Windows)</option>';
  body+='</select></div>';
  body+='<div class="form-row"><div class="form-group"><label>自动更新间隔</label><select id="m-interval" class="input"><option value="0">关闭 (手动刷新)</option><option value="30">每 30 分钟</option><option value="60">每 1 小时</option><option value="180">每 3 小时</option><option value="360">每 6 小时</option><option value="720">每 12 小时</option><option value="1440">每 24 小时</option></select></div><div class="form-group"><label>EPG 地址 (可选)</label><input id="m-epg" class="input" placeholder="https://example.com/epg.xml"></div></div>';
  body+='</div>';
  body+='<div id="sub-form-git" style="display:none">';
  body+='<div class="form-group"><label>名称 (例如: 卫视精品)</label><input id="m-name-git" class="input" placeholder="输入订阅源名称"></div>';
  body+='<div class="form-group"><label>Git 仓库 URL (例如: https://github.com/YueChan/Live.git)</label><input id="m-url-git" class="input" placeholder="https://github.com/xxx/xxx.git"></div>';
  body+='<div class="form-row"><div class="form-group"><label>自动更新间隔</label><select id="m-interval-git" class="input"><option value="0">关闭 (手动刷新)</option><option value="60">每 1 小时</option><option value="360">每 6 小时</option><option value="720">每 12 小时</option><option value="1440">每 24 小时</option></select></div></div>';
  body+='</div>';

  showModal("添加订阅源",body,function(){
    var isGit=S.subTypeTab==="git";
    var n=document.getElementById(isGit?"m-name-git":"m-name").value;
    var u=document.getElementById(isGit?"m-url-git":"m-url").value;
    if(!n||!u){toast("请填写名称和地址","error");return false}
    var data={name:n,url:u};
    if(!isGit){
      data.user_agent=document.getElementById("m-ua").value;
      data.auto_update_minutes=parseInt(document.getElementById("m-interval").value)||0;
      data.epg_url=document.getElementById("m-epg").value||"";
    }else{
      data.auto_update_minutes=parseInt(document.getElementById("m-interval-git").value)||0;
    }
    api("/subscriptions",{method:"POST",body:JSON.stringify(data)}).then(function(){toast("订阅源已添加","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
  });
}

function switchSubTab(tab){
  S.subTypeTab=tab;
  var normalForm=document.getElementById("sub-form-normal");
  var gitForm=document.getElementById("sub-form-git");
  var normalTab=document.getElementById("stab-normal");
  var gitTab=document.getElementById("stab-git");
  if(tab==="normal"){
    normalForm.style.display="";gitForm.style.display="none";
    normalTab.className="sub-type-tab active";gitTab.className="sub-type-tab";
  }else{
    normalForm.style.display="none";gitForm.style.display="";
    normalTab.className="sub-type-tab";gitTab.className="sub-type-tab active";
  }
}
window._switchSubTab=switchSubTab;

function showEditSubModal(id){
  var s=S.subs.find(function(x){return x.id===id});
  if(!s)return;
  var isGit=s.url.indexOf(".git")!==-1||s.url.indexOf("github.com")!==-1;
  var body='<div class="form-group"><label>订阅名称</label><input id="m-name" class="input" value="'+esc(s.name)+'"></div>';
  body+='<div class="form-group"><label>'+(isGit?"Git 仓库 URL":"M3U/TXT 地址")+'</label><textarea id="m-url" class="input">'+esc(s.url)+'</textarea></div>';
  if(!isGit){
    body+='<div class="form-group"><label>User Agent</label><input id="m-ua" class="input" value="'+esc(s.user_agent)+'"></div>';
  }
  body+='<div class="form-row"><div class="form-group"><label>自动同步(分钟)</label><input id="m-interval" class="input" type="number" value="'+s.auto_update_minutes+'" min="0"></div>';
  if(!isGit){
    body+='<div class="form-group"><label>EPG 链接</label><input id="m-epg" class="input" value="'+esc(s.epg_url||"")+'"></div>';
  }
  body+='</div>';
  showModal("编辑订阅源",body,function(){
    var data={name:document.getElementById("m-name").value,url:document.getElementById("m-url").value,auto_update_minutes:parseInt(document.getElementById("m-interval").value)||0};
    if(!isGit){
      data.user_agent=document.getElementById("m-ua").value;
      data.epg_url=document.getElementById("m-epg").value;
    }
    api("/subscriptions/"+id,{method:"PUT",body:JSON.stringify(data)}).then(function(){toast("已更新","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
  });
}

function showAddOutputModal(){
  var body='<div class="form-group"><label>聚合名称</label><input id="m-name" class="input" placeholder="我的聚合"></div>';
  body+='<div class="form-group"><label>URL 标识 (slug)</label><input id="m-slug" class="input" placeholder="my-aggregate"></div>';
  body+='<div class="form-group"><label>关联订阅源</label><div id="m-subs"></div></div>';
  body+='<div class="form-group"><label>EPG 链接</label><input id="m-epg" class="input" placeholder="https://example.com/epg.xml"></div>';
  body+='<div class="form-row"><div class="form-group"><label>来源后缀</label><select id="m-suffix" class="input"><option value="0">否</option><option value="1">是</option></select></div><div class="form-group"><label>正则过滤</label><input id="m-regex" class="input" value=".*"></div></div>';
  showModal("创建聚合源",body,function(){
    var subs=[];
    document.querySelectorAll("#m-subs input:checked").forEach(function(cb){subs.push(parseInt(cb.value))});
    var n=document.getElementById("m-name").value;
    var s=document.getElementById("m-slug").value||n.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"output-"+Date.now();
    if(!n){toast("请填写聚合名称","error");return false}
    api("/outputs",{method:"POST",body:JSON.stringify({name:n,slug:s,subscription_ids:JSON.stringify(subs),epg_url:document.getElementById("m-epg").value,include_source_suffix:parseInt(document.getElementById("m-suffix").value)||0,filter_regex:document.getElementById("m-regex").value||".*"})}).then(function(){toast("聚合源已创建","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
  },function(){
    var h="";
    S.subs.forEach(function(s){h+='<label style="display:flex;align-items:center;padding:6px 0;cursor:pointer"><input type="checkbox" value="'+s.id+'" class="checkbox"> <span style="margin-left:8px">'+esc(s.name)+'</span></label>'});
    document.getElementById("m-subs").innerHTML=h||'<div class="text-muted text-sm">暂无订阅源</div>';
  });
}

function showEditOutputModal(id){
  var o=S.outs.find(function(x){return x.id===id});
  if(!o)return;
  var body='<div class="form-group"><label>聚合名称</label><input id="m-name" class="input" value="'+esc(o.name)+'"></div>';
  body+='<div class="form-group"><label>URL 标识</label><input id="m-slug" class="input" value="'+esc(o.slug)+'"></div>';
  body+='<div class="form-group"><label>关联订阅源</label><div id="m-subs"></div></div>';
  body+='<div class="form-group"><label>EPG 链接</label><input id="m-epg" class="input" value="'+esc(o.epg_url||"")+'"></div>';
  body+='<div class="form-row"><div class="form-group"><label>来源后缀</label><select id="m-suffix" class="input"><option value="0"'+(!o.include_source_suffix?" selected":"")+'>否</option><option value="1"'+(o.include_source_suffix?" selected":"")+'>是</option></select></div><div class="form-group"><label>正则过滤</label><input id="m-regex" class="input" value="'+esc(o.filter_regex||".*")+'"></div></div>';
  body+='<div class="form-group"><label>关键字筛选 (JSON)</label><textarea id="m-keywords" class="input">'+esc(o.keywords||"[]")+'</textarea></div>';
  showModal("编辑聚合源",body,function(){
    var subs=[];
    document.querySelectorAll("#m-subs input:checked").forEach(function(cb){subs.push(parseInt(cb.value))});
    api("/outputs/"+id,{method:"PUT",body:JSON.stringify({name:document.getElementById("m-name").value,slug:document.getElementById("m-slug").value,subscription_ids:JSON.stringify(subs),epg_url:document.getElementById("m-epg").value,include_source_suffix:parseInt(document.getElementById("m-suffix").value)||0,filter_regex:document.getElementById("m-regex").value||".*",keywords:document.getElementById("m-keywords").value||"[]"})}).then(function(){toast("已更新","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
  },function(){
    var selected=JSON.parse(o.subscription_ids||"[]");
    var h="";
    S.subs.forEach(function(s){h+='<label style="display:flex;align-items:center;padding:6px 0;cursor:pointer"><input type="checkbox" value="'+s.id+'" class="checkbox"'+(selected.indexOf(s.id)!==-1?" checked":"")+'> <span style="margin-left:8px">'+esc(s.name)+'</span></label>'});
    document.getElementById("m-subs").innerHTML=h||'<div class="text-muted text-sm">暂无订阅源</div>';
  });
}

// === Actions ===
function syncSub(id){api("/subscriptions/"+id+"/refresh",{method:"POST"}).then(function(){toast("同步已启动","info");setTimeout(load,2000)}).catch(function(e){toast(e.message,"error")})}
function delSub(id){showConfirm("确定删除此订阅源？",function(){api("/subscriptions/"+id,{method:"DELETE"}).then(function(){toast("已删除","success");load()}).catch(function(e){toast(e.message,"error")})})}
function toggleSub(id){api("/subscriptions/"+id,{method:"PUT",body:JSON.stringify({is_enabled:0})}).then(function(){load()}).catch(function(e){toast(e.message,"error")})}
function viewSubChannels(id){S.selectedSub=id;S.view="sub-channels";render();api("/subscriptions/"+id+"/channels").then(function(r){S.channels=r.data||[];renderContent()}).catch(function(e){toast(e.message,"error")})}
function toggleChannel(id){api("/channels/"+id+"/toggle",{method:"POST"}).then(function(){if(S.view==="sub-channels")viewSubChannels(S.selectedSub);else if(S.view==="output-detail")loadOutputDetail(S.selectedOutput)}).catch(function(e){toast(e.message,"error")})}

function editOutput(id){showEditOutputModal(id)}
function delOutput(id){showConfirm("确定删除此聚合源？",function(){api("/outputs/"+id,{method:"DELETE"}).then(function(){toast("已删除","success");load()}).catch(function(e){toast(e.message,"error")})})}
function refreshOutput(id){api("/outputs/"+id+"/refresh",{method:"POST"}).then(function(){toast("刷新完成","success");load()}).catch(function(e){toast(e.message,"error")})}
function toggleOutput(id){
  var o=S.outs.find(function(x){return x.id===id});
  if(!o)return;
  api("/outputs/"+id,{method:"PUT",body:JSON.stringify({is_enabled:o.is_enabled?0:1})}).then(function(){load()}).catch(function(e){toast(e.message,"error")});
}
function previewOutput(id){S.selectedOutput=id;S.view="output-detail";render();loadOutputDetail(id)}
function loadOutputDetail(id){
  Promise.all([api("/outputs/"+id),api("/outputs/"+id+"/export-preview")]).then(function(r){
    S.outputDetail=r[0].data;
    S.preview=r[1].data;
    renderContent();
  }).catch(function(e){toast(e.message,"error")});
}
function copyM3uUrl(slug){navigator.clipboard.writeText(location.origin+"/m3u/"+slug).then(function(){toast("M3U 链接已复制","success")}).catch(function(){toast("复制失败","error")})}

// === Event Delegation ===
document.addEventListener("click",function(e){
  var t=e.target;
  var action=t.getAttribute("data-action");
  if(!action)return;
  var id=parseInt(t.getAttribute("data-id"))||0;
  var slug=t.getAttribute("data-slug")||"";
  var mode=t.getAttribute("data-mode")||"";
  switch(action){
    case"sync":syncSub(id);break;
    case"view-ch":viewSubChannels(id);break;
    case"edit-sub":showEditSubModal(id);break;
    case"del-sub":delSub(id);break;
    case"toggle-sub":toggleSub(id);break;
    case"toggle-ch":toggleChannel(id);break;
    case"preview-out":previewOutput(id);break;
    case"refresh-out":refreshOutput(id);break;
    case"copy-m3u":copyM3uUrl(slug);break;
    case"edit-out":editOutput(id);break;
    case"del-out":delOutput(id);break;
    case"toggle-out":toggleOutput(id);break;
    case"layout":break;
    case"ai-group":break;
    case"ai-sort":break;
    case"ai-detect":break;
  }
});

chk();
})();
</script>
</body>
</html>`;
