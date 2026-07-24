// Frontend - Modern IPTV M3U Manager UI
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
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--card)}
.btn-sm{padding:6px 12px;font-size:12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px;box-shadow:var(--shadow)}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card-title{font-size:16px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-size:14px;transition:border-color .2s}
.input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,.1)}
textarea.input{min-height:80px;resize:vertical;font-family:monospace;font-size:13px}
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
.table th,.table td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--border)}
.table th{font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.5px}
.table tr:hover{background:rgba(79,70,229,.03)}
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
.modal{background:var(--card);border-radius:16px;padding:24px;max-width:640px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
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
.switch{position:relative;width:40px;height:22px;display:inline-block}
.switch input{opacity:0;width:0;height:0}
.switch .slider{position:absolute;inset:0;background:var(--border);border-radius:22px;cursor:pointer;transition:.3s}
.switch .slider:before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s}
.switch input:checked+.slider{background:var(--primary)}
.switch input:checked+.slider:before{transform:translateX(18px)}
.progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.progress-bar-fill{height:100%;background:var(--primary);border-radius:3px;transition:width .3s}
.search-bar{position:relative;margin-bottom:16px}
.search-bar input{padding-left:36px}
.search-bar::before{content:"";position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px}
.empty{text-align:center;padding:60px 20px;color:var(--text2)}
.empty-icon{font-size:48px;margin-bottom:12px}
.preview-group{margin-bottom:16px}
.preview-group-title{font-weight:600;font-size:14px;padding:8px 0;border-bottom:1px solid var(--border);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.preview-channel{display:flex;align-items:center;padding:8px 12px;border-radius:8px;margin-bottom:4px;transition:background .15s}
.preview-channel:hover{background:rgba(79,70,229,.05)}
.preview-channel .name{flex:1;font-size:13px}
.preview-channel .epg{font-size:11px;color:var(--text2);margin-left:8px}
</style>
</head>
<body>
<div id="app" class="app"></div>
<script>
(function(){
var S={auth:false,view:"subs",subs:[],outs:[],tasks:[],channels:[],preview:null,outputDetail:null};
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
  closeBtn.textContent="\u2715";
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

function renderSubs(c){
  var h='<div class="card-header"><div class="card-title">订阅源 ('+S.subs.length+')</div><button class="btn btn-primary" id="addSubBtn">+ 添加订阅</button></div>';
  if(S.subs.length===0)h+='<div class="empty"><div class="empty-icon">\u{1F4FA}</div><div>暂无订阅源</div><div class="text-sm text-muted mt-8">点击上方按钮添加第一个订阅源</div></div>';
  else{h+='<div class="grid">';
  S.subs.forEach(function(s){
    h+='<div class="card"><div class="flex-between mb-8"><strong>'+esc(s.name)+'</strong><span class="badge '+(s.is_enabled?"badge-ok":"badge-err")+'">'+(s.is_enabled?"启用":"禁用")+'</span></div>';
    h+='<div class="text-xs text-muted truncate mb-8" title="'+esc(s.url)+'">'+esc(s.url)+'</div>';
    h+='<div class="text-xs text-muted mb-8">'+(s.last_update_status||"未同步")+'</div>';
    h+='<div class="flex gap-12">';
    h+='<button class="btn btn-primary btn-sm" data-action="sync" data-id="'+s.id+'">同步</button>';
    h+='<button class="btn btn-ghost btn-sm" data-action="view-ch" data-id="'+s.id+'">频道</button>';
    h+='<button class="btn btn-ghost btn-sm" data-action="edit-sub" data-id="'+s.id+'">编辑</button>';
    h+='<button class="btn btn-danger btn-sm" data-action="del-sub" data-id="'+s.id+'">删除</button>';
    h+='</div></div>';
  });
  h+='</div>';}
  c.innerHTML=h;
  document.getElementById("addSubBtn").onclick=function(){showAddSubModal()};
}

function renderSubChannels(c){
  var sub=S.subs.find(function(x){return x.id===S.selectedSub});
  var h='<div class="flex-between mb-16"><div class="flex gap-12"><button class="btn btn-ghost btn-sm" id="backSubBtn">← 返回</button><h3>'+(sub?esc(sub.name):"")+' - 频道列表</h3></div><span class="text-sm text-muted">共 '+S.channels.length+' 个频道</span></div>';
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

function renderOutputs(c){
  var h='<div class="card-header"><div class="card-title">聚合源 ('+S.outs.length+')</div><button class="btn btn-primary" id="addOutBtn">+ 创建聚合</button></div>';
  if(S.outs.length===0)h+='<div class="empty"><div class="empty-icon">\u{1F4E6}</div><div>暂无聚合源</div><div class="text-sm text-muted mt-8">创建聚合源来管理和导出频道列表</div></div>';
  else{h+='<div class="grid">';
  S.outs.forEach(function(o){
    h+='<div class="card" data-action="view-out" data-id="'+o.id+'" style="cursor:pointer">';
    h+='<div class="flex-between mb-8"><strong>'+esc(o.name)+'</strong><span class="badge '+(o.is_enabled?"badge-ok":"badge-err")+'">'+(o.is_enabled?"启用":"禁用")+'</span></div>';
    h+='<div class="text-xs text-muted mb-8">/m3u/'+esc(o.slug)+'</div>';
    h+='<div class="flex gap-12 mb-8"><span class="text-sm">频道: '+(o.member_enabled||0)+' / '+(o.member_total||0)+'</span></div>';
    h+='<div class="text-xs text-muted mb-8">'+(o.last_update_status||"未更新")+'</div>';
    h+='<div class="flex gap-12">';
    h+='<button class="btn btn-ghost btn-sm" data-action="refresh-out" data-id="'+o.id+'">刷新</button>';
    h+='<button class="btn btn-ghost btn-sm" data-action="copy-m3u" data-slug="'+esc(o.slug)+'">复制链接</button>';
    h+='<button class="btn btn-ghost btn-sm" data-action="edit-out" data-id="'+o.id+'">编辑</button>';
    h+='<button class="btn btn-danger btn-sm" data-action="del-out" data-id="'+o.id+'">删除</button>';
    h+='</div></div>';
  });
  h+='</div>';}
  c.innerHTML=h;
  document.getElementById("addOutBtn").onclick=function(){showAddOutputModal()};
}

function renderOutputDetail(c){
  var o=S.outputDetail;
  var p=S.preview;
  if(!o){c.innerHTML='<div class="loading"><div class="spinner"></div></div>';return}
  var h='<div class="flex-between mb-16"><div class="flex gap-12"><button class="btn btn-ghost btn-sm" id="backOutBtn">← 返回</button><h3>'+esc(o.name)+'</h3><span class="badge badge-info">/m3u/'+esc(o.slug)+'</span></div><div class="flex gap-12"><button class="btn btn-primary btn-sm" data-action="copy-m3u" data-slug="'+esc(o.slug)+'">复制 M3U 链接</button><button class="btn btn-ghost btn-sm" data-action="edit-out" data-id="'+o.id+'">编辑配置</button></div></div>';
  h+='<div class="card mb-16"><div class="flex-between mb-8"><div class="flex gap-12">';
  h+='<button class="btn btn-sm '+(o.layout_mode==="rules"?"btn-primary":"btn-ghost")+'" data-action="layout" data-id="'+o.id+'" data-mode="rules">手动分组</button>';
  h+='<button class="btn btn-sm '+(o.layout_mode==="explicit"?"btn-primary":"btn-ghost")+'" data-action="layout" data-id="'+o.id+'" data-mode="explicit">AI 分组</button>';
  h+='</div><div class="flex gap-12">';
  h+='<button class="btn btn-ghost btn-sm" data-action="ai-group" data-id="'+o.id+'">AI 整理</button>';
  h+='<button class="btn btn-ghost btn-sm" data-action="ai-sort" data-id="'+o.id+'">AI 排序</button>';
  h+='<button class="btn btn-ghost btn-sm" data-action="ai-detect" data-id="'+o.id+'">AI 检测</button>';
  h+='</div></div>';
  h+='<div class="search-bar"><input class="input" id="previewSearch" placeholder="搜索频道..."></div></div>';
  if(p&&p.groups){
    p.groups.forEach(function(g){
      h+='<div class="preview-group"><div class="preview-group-title"><span>'+esc(g.name)+' ('+g.count+')</span></div>';
      g.channels.forEach(function(ch){
        h+='<div class="preview-channel">';
        h+='<span class="name">'+esc(ch.name)+'</span>';
        h+='<span class="epg">'+esc(ch.epg_program||"")+'</span>';
        h+='<label class="switch"><input type="checkbox" '+(ch.is_enabled?"checked":"")+' data-action="toggle-ch" data-id="'+ch.id+'"><span class="slider"></span></label>';
        h+='</div>';
      });
      h+='</div>';
    });
  }else{
    h+='<div class="empty"><div class="empty-icon">\u{1F4CB}</div><div>暂无预览数据</div><div class="text-sm text-muted mt-8">请先配置聚合源并刷新</div></div>';
  }
  c.innerHTML=h;
  document.getElementById("backOutBtn").onclick=function(){S.view="outs";render();load()};
  var ps=document.getElementById("previewSearch");
  if(ps)ps.oninput=function(){filterPreview(this.value)};
}

function renderTasks(c){
  var h='<div class="card-header"><div class="card-title">任务列表 ('+S.tasks.length+')</div><button class="btn btn-ghost btn-sm" id="refreshTasksBtn">刷新</button></div>';
  if(S.tasks.length===0)h+='<div class="empty"><div class="empty-icon">\u23F3</div><div>暂无任务</div></div>';
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

// === Modals ===
function showAddSubModal(){
  var body='<div class="form-group"><label>订阅名称</label><input id="m-name" class="input" placeholder="我的订阅"></div>';
  body+='<div class="form-group"><label>M3U/TXT 地址</label><textarea id="m-url" class="input" placeholder="https://example.com/playlist.m3u"></textarea></div>';
  body+='<div class="form-row"><div class="form-group"><label>User Agent</label><input id="m-ua" class="input" value="AptvPlayer/1.4.1"></div><div class="form-group"><label>自动同步(分钟)</label><input id="m-interval" class="input" type="number" value="0" min="0"></div></div>';
  body+='<div class="form-group"><label>EPG 链接</label><input id="m-epg" class="input" placeholder="https://example.com/epg.xml"></div>';
  showModal("添加订阅源",body,function(){
    var n=document.getElementById("m-name").value;
    var u=document.getElementById("m-url").value;
    if(!n||!u){toast("请填写名称和地址","error");return false}
    api("/subscriptions",{method:"POST",body:JSON.stringify({name:n,url:u,user_agent:document.getElementById("m-ua").value,auto_update_minutes:parseInt(document.getElementById("m-interval").value)||0,epg_url:document.getElementById("m-epg").value})}).then(function(){toast("订阅源已添加","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
  });
}

function showEditSubModal(id){
  var s=S.subs.find(function(x){return x.id===id});
  if(!s)return;
  var body='<div class="form-group"><label>订阅名称</label><input id="m-name" class="input" value="'+esc(s.name)+'"></div>';
  body+='<div class="form-group"><label>M3U/TXT 地址</label><textarea id="m-url" class="input">'+esc(s.url)+'</textarea></div>';
  body+='<div class="form-row"><div class="form-group"><label>User Agent</label><input id="m-ua" class="input" value="'+esc(s.user_agent)+'"></div><div class="form-group"><label>自动同步(分钟)</label><input id="m-interval" class="input" type="number" value="'+s.auto_update_minutes+'" min="0"></div></div>';
  body+='<div class="form-group"><label>EPG 链接</label><input id="m-epg" class="input" value="'+esc(s.epg_url||"")+'"></div>';
  showModal("编辑订阅源",body,function(){
    api("/subscriptions/"+id,{method:"PUT",body:JSON.stringify({name:document.getElementById("m-name").value,url:document.getElementById("m-url").value,user_agent:document.getElementById("m-ua").value,auto_update_minutes:parseInt(document.getElementById("m-interval").value)||0,epg_url:document.getElementById("m-epg").value})}).then(function(){toast("已更新","success");load();return true}).catch(function(e){toast(e.message,"error");return false});
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
function addSub(){showAddSubModal()}
function editSub(id){showEditSubModal(id)}
function syncSub(id){api("/subscriptions/"+id+"/refresh",{method:"POST'}).then(function(){toast("同步已启动","info");setTimeout(load,2000)}).catch(function(e){toast(e.message,"error")})}
function delSub(id){showConfirm("确定删除此订阅源？",function(){api("/subscriptions/"+id,{method:"DELETE"}).then(function(){toast("已删除","success");load()}).catch(function(e){toast(e.message,"error")})})}
function viewSubChannels(id){S.selectedSub=id;S.view="sub-channels";render();api("/subscriptions/"+id+"/channels").then(function(r){S.channels=r.data||[];renderContent()}).catch(function(e){toast(e.message,"error")})}
function toggleChannel(id){api("/channels/"+id+"/toggle",{method:"POST"}).then(function(){if(S.view==="sub-channels")viewSubChannels(S.selectedSub);else if(S.view==="output-detail")loadOutputDetail(S.selectedOutput)}).catch(function(e){toast(e.message,"error")})}
function filterPreview(q){
  var items=document.querySelectorAll(".preview-channel");
  for(var i=0;i<items.length;i++){
    items[i].style.display=items[i].textContent.toLowerCase().indexOf(q.toLowerCase())>=0?"":"none";
  }
}

function addOutput(){showAddOutputModal()}
function editOutput(id){showEditOutputModal(id)}
function delOutput(id){showConfirm("确定删除此聚合源？",function(){api("/outputs/"+id,{method:"DELETE"}).then(function(){toast("已删除","success");load()}).catch(function(e){toast(e.message,"error")})})}
function refreshOutput(id){api("/outputs/"+id+"/refresh",{method:"POST"}).then(function(){toast("刷新完成","success");load()}).catch(function(e){toast(e.message,"error")})}
function viewOutput(id){S.selectedOutput=id;S.view="output-detail";render();loadOutputDetail(id)}
function loadOutputDetail(id){
  Promise.all([api("/outputs/"+id),api("/outputs/"+id+"/export-preview")]).then(function(r){
    S.outputDetail=r[0].data;
    S.preview=r[1].data;
    renderContent();
  }).catch(function(e){toast(e.message,"error")});
}
function layoutMode(id,mode){api("/outputs/"+id+"/layout-mode",{method:"POST",body:JSON.stringify({mode:mode})}).then(function(){toast("布局已切换","success");loadOutputDetail(id)}).catch(function(e){toast(e.message,"error")})}
function aiGroup(id){toast("AI 分组中...","info");api("/api/ai/group",{method:"POST",body:JSON.stringify({output_id:id})}).then(function(r){if(r.success){toast("AI 分组完成","success");loadOutputDetail(id)}else toast(r.error||"AI 分组失败","error")}).catch(function(e){toast(e.message,"error")})}
function aiSort(id){toast("AI 排序中...","info");api("/api/ai/sort",{method:"POST",body:JSON.stringify({output_id:id})}).then(function(r){if(r.success){toast("AI 排序完成","success");loadOutputDetail(id)}else toast(r.error||"AI 排序失败","error")}).catch(function(e){toast(e.message,"error")})}
function aiDetect(id){toast("AI 视觉检测中...","info");api("/api/ai/detect",{method:"POST",body:JSON.stringify({output_id:id})}).then(function(r){if(r.success){toast("检测完成","success");loadOutputDetail(id)}else toast(r.error||"检测失败","error")}).catch(function(e){toast(e.message,"error")})}
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
    case"edit-sub":editSub(id);break;
    case"del-sub":delSub(id);break;
    case"toggle-ch":toggleChannel(id);break;
    case"view-out":viewOutput(id);break;
    case"refresh-out":refreshOutput(id);break;
    case"copy-m3u":copyM3uUrl(slug);break;
    case"edit-out":editOutput(id);break;
    case"del-out":delOutput(id);break;
    case"layout":layoutMode(id,mode);break;
    case"ai-group":aiGroup(id);break;
    case"ai-sort":aiSort(id);break;
    case"ai-detect":aiDetect(id);break;
  }
});

chk();
})();
</script>
</body>
</html>`;
