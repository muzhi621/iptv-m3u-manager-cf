// Frontend assets - simple HTML without template literal issues
export const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPTV M3U Manager</title>
  <style>
    :root{--bg:#f5f5f5;--card:#fff;--text:#333;--border:#e0e0e0;--primary:#1890ff;--danger:#ff4d4f;--success:#52c41a}
    @media(prefers-color-scheme:dark){:root{--bg:#1a1a1a;--card:#2a2a2a;--text:#e0e0e0;--border:#404040}}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text)}
    .ct{max-width:1200px;margin:0 auto;padding:20px}
    .hd{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);margin-bottom:20px}
    .hd h1{font-size:24px}
    .btn{padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:14px;transition:opacity .2s}
    .btn:hover{opacity:.85}
    .bp{background:var(--primary);color:#fff}
    .bd{background:var(--danger);color:#fff}
    .bs{background:var(--success);color:#fff}
    .bm{padding:4px 10px;font-size:12px}
    .cd{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:16px}
    .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
    .ip{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--text);font-size:14px}
    .ip:focus{outline:none;border-color:var(--primary)}
    .lb{display:block;margin-bottom:4px;font-size:13px;color:#888}
    .fg{margin-bottom:12px}
    .bg{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px}
    .bgo{background:#f6ffed;color:#52c41a}
    .bge{background:#fff2f0;color:#ff4d4f}
    .fl{display:flex;gap:8px;align-items:center}
    .fb{display:flex;justify-content:space-between;align-items:center}
    .ld{text-align:center;padding:40px;color:#888}
    .tb{width:100%;border-collapse:collapse}
    .tb th,.tb td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border)}
    .tb th{font-weight:600;font-size:13px;color:#888}
    .ts{display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border)}
    .ti{padding:8px 16px;cursor:pointer;border-bottom:2px solid transparent;font-size:14px}
    .ti.ac{border-bottom-color:var(--primary);color:var(--primary)}
    @media(max-width:768px){.gr{grid-template-columns:1fr}.hd h1{font-size:18px}}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
(function(){
var S={auth:false,view:'subs',subs:[],outs:[],tasks:[]};

function api(p,o){
  o=o||{};
  o.headers=o.headers||{};
  o.headers['Content-Type']='application/json';
  o.credentials='include';
  return fetch(p,o).then(function(r){return r.json()});
}

function chk(){
  api('/api/auth/status').then(function(r){
    S.auth=r.data?r.data.authenticated:false;
    render();
  }).catch(function(){render()});
}

function login(){
  var pw=document.getElementById('pw');
  if(!pw)return;
  api('/api/auth/login',{method:'POST',body:JSON.stringify({password:pw.value})}).then(function(r){
    if(r.success){S.auth=true;render();load()}
    else alert('密码错误');
  });
}

function logout(){
  api('/api/auth/logout',{method:'POST'}).then(function(){S.auth=false;render()});
}

function load(){
  Promise.all([
    api('/subscriptions').catch(function(){return{data:[]}}),
    api('/outputs').catch(function(){return{data:[]}}),
    api('/api/tasks').catch(function(){return{data:[]}})
  ]).then(function(r){
    S.subs=r[0].data||[];
    S.outs=r[1].data||[];
    S.tasks=r[2].data||[];
    render();
  }).catch(function(){render()});
}

function addSub(){
  var n=prompt('订阅名称:');
  if(!n)return;
  var u=prompt('M3U/TXT地址:');
  if(!u)return;
  api('/subscriptions',{method:'POST',body:JSON.stringify({name:n,url:u})}).then(load);
}

function delSub(id){
  if(!confirm('确定删除?'))return;
  api('/subscriptions/'+id,{method:'DELETE'}).then(load);
}

function syncSub(id){
  api('/subscriptions/'+id+'/refresh',{method:'POST'}).then(function(){
    alert('同步已启动');
    setTimeout(load,2000);
  });
}

function addOutput(){
  var n=prompt('聚合名称:');
  if(!n)return;
  var s=n.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'output-'+Date.now();
  api('/outputs',{method:'POST',body:JSON.stringify({name:n,slug:s})}).then(load);
}

function delOutput(id){
  if(!confirm('确定删除?'))return;
  api('/outputs/'+id,{method:'DELETE'}).then(load);
}

function esc(s){return s?s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):''}

function render(){
  var a=document.getElementById('app');
  if(!a)return;
  if(!S.auth){
    a.innerHTML='<div class="ct" style="max-width:400px;margin-top:100px"><div class="cd"><h3 style="text-align:center;margin-bottom:20px">IPTV M3U Manager</h3><div class="fg"><label class="lb">管理密码</label><input type="password" id="pw" class="ip" placeholder="请输入密码"></div><button class="btn bp" style="width:100%" id="lbtn">登录</button></div></div>';
    document.getElementById('lbtn').onclick=login;
    return;
  }
  var h='<div class="ct"><div class="hd"><h1>IPTV M3U Manager</h1><div class="fl"><span style="font-size:13px;color:#888">Cloudflare Workers</span><button class="btn bm" id="obtn">退出</button></div></div>';
  h+='<div class="ts">';
  h+='<div class="ti'+(S.view==='subs'?' ac':'')+'" data-v="subs">订阅源</div>';
  h+='<div class="ti'+(S.view==='outs'?' ac':'')+'" data-v="outs">聚合源</div>';
  h+='<div class="ti'+(S.view==='tasks'?' ac':'')+'" data-v="tasks">任务</div>';
  h+='</div><div id="ct">'+content()+'</div></div>';
  a.innerHTML=h;
  document.getElementById('obtn').onclick=logout;
  var tabs=a.querySelectorAll('.ti');
  for(var i=0;i<tabs.length;i++){
    tabs[i].onclick=function(){S.view=this.getAttribute('data-v');load()};
  }
}

function content(){
  if(S.view==='subs'){
    var h='<div class="fb" style="margin-bottom:16px"><h3>订阅源 ('+S.subs.length+')</h3><button class="btn bp" id="asub">添加订阅</button></div>';
    if(S.subs.length===0)h+='<div class="cd ld">暂无订阅源</div>';
    h+='<div class="gr">';
    for(var i=0;i<S.subs.length;i++){
      var s=S.subs[i];
      h+='<div class="cd"><div class="fb" style="margin-bottom:8px"><strong>'+esc(s.name)+'</strong><span class="bg bgo">'+(s.is_enabled?'启用':'禁用')+'</span></div>';
      h+='<div style="font-size:12px;color:#888;margin-bottom:8px;word-break:break-all">'+esc(s.url)+'</div>';
      h+='<div style="font-size:12px;color:#888;margin-bottom:12px">'+(s.last_update_status||'未同步')+'</div>';
      h+='<div class="fl"><button class="btn bp bm" data-sync="'+s.id+'">同步</button><button class="btn bd bm" data-dels="'+s.id+'">删除</button></div></div>';
    }
    h+='</div>';
    return h;
  }
  if(S.view==='outs'){
    var h='<div class="fb" style="margin-bottom:16px"><h3>聚合源 ('+S.outs.length+')</h3><button class="btn bp" id="aout">创建聚合</button></div>';
    if(S.outs.length===0)h+='<div class="cd ld">暂无聚合源</div>';
    h+='<div class="gr">';
    for(var i=0;i<S.outs.length;i++){
      var o=S.outs[i];
      h+='<div class="cd"><div class="fb" style="margin-bottom:8px"><strong>'+esc(o.name)+'</strong><span class="bg bgo">'+(o.is_enabled?'启用':'禁用')+'</span></div>';
      h+='<div style="font-size:12px;color:#888;margin-bottom:8px">/m3u/'+esc(o.slug)+'</div>';
      h+='<div style="font-size:13px;margin-bottom:4px">频道: '+(o.member_enabled||0)+' / '+(o.member_total||0)+'</div>';
      h+='<div style="font-size:12px;color:#888;margin-bottom:12px">'+(o.last_update_status||'未更新')+'</div>';
      h+='<div class="fl"><button class="btn bd bm" data-delo="'+o.id+'">删除</button></div></div>';
    }
    h+='</div>';
    return h;
  }
  if(S.view==='tasks'){
    var h='<h3 style="margin-bottom:16px">任务列表 ('+S.tasks.length+')</h3>';
    if(S.tasks.length===0)h+='<div class="cd ld">暂无任务</div>';
    else{
      h+='<div class="cd"><table class="tb"><thead><tr><th>名称</th><th>状态</th><th>进度</th><th>消息</th></tr></thead><tbody>';
      for(var i=0;i<S.tasks.length;i++){
        var t=S.tasks[i];
        var cls=t.status==='success'?'bgo':t.status==='failure'?'bge':'';
        h+='<tr><td>'+esc(t.name)+'</td><td><span class="bg '+cls+'">'+t.status+'</span></td><td>'+t.progress+'%</td><td style="font-size:12px">'+esc(t.message)+'</td></tr>';
      }
      h+='</tbody></table></div>';
    }
    return h;
  }
  return '';
}

// Event delegation
document.addEventListener('click',function(e){
  var t=e.target;
  if(t.id==='asub')addSub();
  if(t.id==='aout')addOutput();
  if(t.getAttribute('data-sync'))syncSub(parseInt(t.getAttribute('data-sync')));
  if(t.getAttribute('data-dels'))delSub(parseInt(t.getAttribute('data-dels')));
  if(t.getAttribute('data-delo'))delOutput(parseInt(t.getAttribute('data-delo')));
});

chk();
})();
  </script>
</body>
</html>`;
