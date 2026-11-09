(() => {
const $ = s => document.querySelector(s);
const state = {clips:[],selected:-1,playing:false,raf:0,startedAt:0,offset:0,ratio:"9:16",fit:"Isi",filter:"none",brightness:100,contrast:100,saturation:100,speed:1,text:"",textColor:"#ffffff",textSize:44,volume:100};
const canvas=$("#preview"),ctx=canvas.getContext("2d");
const fileInput=$("#fileInput");
let toastTimer;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400)}
function fmt(s){s=Math.max(0,s||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`}
function totalDuration(){return state.clips.reduce((a,c)=>a+c.duration,0)}
function currentGlobal(){return state.offset}
function selected(){return state.clips[state.selected]||null}
function updateLabels(){
 const total=totalDuration();$("#clipCount").textContent=`${state.clips.length} klip`;
 $("#timeReadout").textContent=`${fmt(currentGlobal())} / ${fmt(total)}`;$("#currentTime").textContent=fmt(currentGlobal());
 $("#seek").max=Math.max(1,Math.round(total*10));$("#seek").value=Math.min($("#seek").max,Math.round(currentGlobal()*10));
}
function renderTimeline(){
 const box=$("#timeline");box.innerHTML="";
 if(!state.clips.length){box.innerHTML='<div class="timeline-empty">Klip yang diimpor akan muncul di sini</div>';return}
 state.clips.forEach((c,i)=>{const b=document.createElement("button");b.className="clip"+(i===state.selected?" selected":"");b.innerHTML=`<span class="clip-index">${i+1}</span><strong></strong><small>${fmt(c.duration)} · video</small>`;b.querySelector("strong").textContent=c.name;b.onclick=()=>selectClip(i);box.appendChild(b)});
}
function selectClip(i){state.selected=i;renderTimeline();renderTool();drawFrame();$("#emptyState").classList.add("hidden")}
function addFiles(list){
 const items=[...list].filter(f=>f.type.startsWith("video/"));
 if(!items.length){toast("Pilih file video untuk ditambahkan.");return}
 items.forEach(file=>{
   const url=URL.createObjectURL(file),v=document.createElement("video");
   v.src=url;v.muted=true;v.playsInline=true;v.preload="metadata";
   v.addEventListener("loadedmetadata",()=>{state.clips.push({file,url,video:v,name:file.name,duration:v.duration||0,start:0,end:v.duration||0,rate:1,brightness:100,contrast:100,saturation:100,filter:"none",text:""});if(state.selected<0)state.selected=0;renderTimeline();renderTool();drawFrame();$("#emptyState").classList.add("hidden");updateLabels()},{once:true});
   v.addEventListener("error",()=>toast("Video tidak bisa dibaca browser."),{once:true});
 });
}
function locate(t){
 let x=Math.max(0,t);
 for(let i=0;i<state.clips.length;i++){const c=state.clips[i],d=Math.max(.01,c.end-c.start);if(x<d||i===state.clips.length-1)return {clip:c,index:i,time:c.start+Math.min(x,d)};x-=d}
 return null;
}
function drawFrame(){
 ctx.fillStyle="#08090b";ctx.fillRect(0,0,canvas.width,canvas.height);
 const item=locate(state.offset);if(!item){updateLabels();return}
 const {clip:c,time}=item,v=c.video;
 if(v.readyState>=2){
  try{v.currentTime=time}catch(e){}
  const cw=canvas.width,ch=canvas.height,ratio=v.videoWidth/v.videoHeight;
  let w=cw,h=ch;if(ratio>cw/ch){h=ch;w=h*ratio}else{w=cw;h=w/ratio}
  if(state.fit==="Isi"){w=Math.max(w,cw);h=Math.max(h,ch)}
  ctx.save();ctx.filter=`${c.filter||"none"} brightness(${c.brightness||100}%) contrast(${c.contrast||100}%) saturate(${c.saturation||100}%)`;
  ctx.drawImage(v,(cw-w)/2,(ch-h)/2,w,h);ctx.restore();
  if(c.text){ctx.save();ctx.fillStyle="#0009";ctx.fillRect(24,ch-140,cw-48,72);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font=`bold ${c.textSize||44}px system-ui`;ctx.fillText(c.text,cw/2,ch-92,cw-70);ctx.restore()}
 }
 updateLabels();
}
function renderTool(){
 const c=selected(),host=$("#toolEditor");if(!c){host.innerHTML='<div class="editor-placeholder">Impor video, lalu pilih salah satu klip di timeline.</div>';return}
 host.innerHTML=`<div class="control-row"><label>Awal klip</label><input id="trimStart" type="range" min="0" max="${Math.max(.1,c.duration)}" step=".1" value="${c.start}"><output>${fmt(c.start)}</output></div>
 <div class="control-row"><label>Akhir klip</label><input id="trimEnd" type="range" min="0" max="${Math.max(.1,c.duration)}" step=".1" value="${c.end}"><output>${fmt(c.end)}</output></div>
 <div class="control-row"><label>Kecepatan</label><select id="clipSpeed"><option value=".5">0.5×</option><option value=".75">0.75×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
 <div class="control-row"><label>Filter</label><select id="clipFilter"><option value="none">Asli</option><option value="grayscale(1)">Hitam putih</option><option value="sepia(.75)">Sepia</option><option value="contrast(1.2) saturate(1.25)">Pop</option><option value="saturate(.65)">Pudar</option></select></div>
 <div class="control-row"><label>Kecerahan</label><input id="clipBright" type="range" min="50" max="150" value="${c.brightness}"><output>${c.brightness}%</output></div>
 <div class="control-row"><label>Kontras</label><input id="clipContrast" type="range" min="50" max="150" value="${c.contrast}"><output>${c.contrast}%</output></div>
 <div class="control-row"><label>Teks overlay</label><input id="clipText" type="text" maxlength="60" placeholder="Tulis teks..." value="${escapeHtml(c.text)}"></div>
 <div class="control-row"><label></label><button id="removeClip" class="outline-btn">Hapus klip</button></div>`;
 $("#clipSpeed").value=String(c.rate);$("#clipFilter").value=c.filter;
 const bindRange=(id,key,min=0)=>{$("#"+id).oninput=e=>{c[key]=Number(e.target.value);e.target.nextElementSibling.textContent=e.target.value+"%";drawFrame()}};
 $("#trimStart").oninput=e=>{c.start=Math.min(Number(e.target.value),c.end-.1);e.target.nextElementSibling.textContent=fmt(c.start);drawFrame()};
 $("#trimEnd").oninput=e=>{c.end=Math.max(Number(e.target.value),c.start+.1);e.target.nextElementSibling.textContent=fmt(c.end);renderTimeline();drawFrame()};
 $("#clipSpeed").onchange=e=>{c.rate=Number(e.target.value);renderTimeline()};
 $("#clipFilter").onchange=e=>{c.filter=e.target.value;drawFrame()};
 bindRange("clipBright","brightness");bindRange("clipContrast","contrast");
 $("#clipText").oninput=e=>{c.text=e.target.value;drawFrame()};
 $("#removeClip").onclick=()=>{URL.revokeObjectURL(c.url);state.clips.splice(state.selected,1);state.selected=Math.min(state.selected,state.clips.length-1);renderTimeline();renderTool();drawFrame();updateLabels();if(!state.clips.length)$("#emptyState").classList.remove("hidden")};
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function play(){
 if(!state.clips.length){toast("Impor video dulu.");return}
 if(state.playing){state.playing=false;cancelAnimationFrame(state.raf);$("#playBtn").textContent="▶";return}
 state.playing=true;state.startedAt=performance.now()-state.offset*1000;$("#playBtn").textContent="Ⅱ";
 const tick=now=>{if(!state.playing)return;state.offset=(now-state.startedAt)/1000;if(state.offset>=totalDuration()){state.offset=0;state.playing=false;$("#playBtn").textContent="▶"}drawFrame();state.raf=requestAnimationFrame(tick)};
 state.raf=requestAnimationFrame(tick);
}
function showTool(name){
 document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b.dataset.tool===name));
 const c=selected();if(!c){toast("Pilih klip dulu.");return}
 if(name==="trim")$("#trimStart").focus();
 if(name==="speed")$("#clipSpeed").focus();
 if(name==="filter")$("#clipFilter").focus();
 if(name==="adjust")$("#clipBright").focus();
 if(name==="text")$("#clipText").focus();
 if(name==="audio")toast("Audio terpisah belum tersedia di versi awal.");
}
function openExport(){if(!state.clips.length){toast("Tambahkan video dulu.");return}$("#exportModal").classList.remove("hidden")}
function exportVideo(){
 const clips=state.clips.slice();if(!clips.length)return;
 const W=Number($("#resolution").value),fps=Number($("#fps").value),H=Math.round(W*16/9);
 const out=document.createElement("canvas");out.width=W;out.height=H;const cx=out.getContext("2d");
 const stream=out.captureStream(fps);
 let mime="video/webm;codecs=vp9";if(!MediaRecorder.isTypeSupported(mime))mime="video/webm";
 if(!window.MediaRecorder||!MediaRecorder.isTypeSupported(mime)){toast("Browser ini belum mendukung ekspor video.");return}
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.max(1500000,W*W*3)});
 const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="klip-studio-export.webm";a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);$("#exportStatus").textContent="Selesai. File WebM sudah diunduh.";$("#startExport").disabled=false;$("#startExport").textContent="Mulai ekspor"};
 recorder.start(250);$("#startExport").disabled=true;$("#startExport").textContent="Mengekspor…";$("#exportStatus").textContent="Menyiapkan video…";
 let ci=0,local=0,last=performance.now();
 const draw=now=>{
  const c=clips[ci];if(!c){recorder.stop();return}
  const v=c.video;
  if(v.readyState>=2){
   try{v.currentTime=c.start+local*c.rate}catch(e){}
   cx.fillStyle="#000";cx.fillRect(0,0,W,H);
   const r=v.videoWidth/v.videoHeight,cr=W/H;let dw,dh;if(r>cr){dh=H;dw=H*r}else{dw=W;dh=W/r}
   cx.save();cx.filter=`${c.filter||"none"} brightness(${c.brightness||100}%) contrast(${c.contrast||100}%) saturate(${c.saturation||100}%)`;cx.drawImage(v,(W-dw)/2,(H-dh)/2,dw,dh);cx.restore();
   if(c.text){cx.fillStyle="#0009";cx.fillRect(20,H-110,W-40,65);cx.fillStyle="#fff";cx.textAlign="center";cx.font="bold 34px system-ui";cx.fillText(c.text,W/2,H-68,W-60)}
  }
  const dt=Math.min(.1,(now-last)/1000);last=now;local+=dt;
  if(local>=((c.end-c.start)/c.rate)){ci++;local=0;if(ci<clips.length){clips[ci].video.currentTime=clips[ci].start;clips[ci].video.play().catch(()=>{})}}
  $("#exportStatus").textContent=`Klip ${Math.min(ci+1,clips.length)} dari ${clips.length}`;
  if(ci<clips.length)requestAnimationFrame(draw);else setTimeout(()=>recorder.stop(),500);
 };
 clips.forEach(c=>{c.video.pause();c.video.muted=true});clips[0].video.currentTime=clips[0].start;clips[0].video.play().catch(()=>{});last=performance.now();requestAnimationFrame(draw);
}
$("#addClip").onclick=$("#importBtn").onclick=$("#importEmpty").onclick=()=>{fileInput.value="";fileInput.click()};
fileInput.onchange=e=>addFiles(e.target.files);
$("#playBtn").onclick=play;
$("#seek").oninput=e=>{state.offset=Number(e.target.value)/10;drawFrame()};
$("#ratioBtn").onclick=()=>{state.ratio=state.ratio==="9:16"?"16:9":state.ratio==="16:9"?"1:1":"9:16";$("#ratioBtn").textContent=state.ratio;const [w,h]=state.ratio.split(":").map(Number);canvas.width=720;canvas.height=Math.round(720*h/w);drawFrame()};
$("#fitBtn").onclick=()=>{state.fit=state.fit==="Isi"?"Muat":"Isi";$("#fitBtn").textContent=state.fit;drawFrame()};
document.querySelectorAll(".tool").forEach(b=>b.onclick=()=>showTool(b.dataset.tool));
$("#exportBtn").onclick=$("#exportTop").onclick=openExport;
$("#closeModal").onclick=()=>$("#exportModal").classList.add("hidden");
$("#startExport").onclick=exportVideo;
$("#newProject").onclick=()=>{if(!confirm("Mulai proyek baru? Klip saat ini akan dihapus."))return;state.clips.forEach(c=>URL.revokeObjectURL(c.url));state.clips=[];state.selected=-1;state.offset=0;renderTimeline();renderTool();drawFrame();updateLabels();$("#emptyState").classList.remove("hidden");toast("Proyek baru siap.")};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
drawFrame();renderTimeline();updateLabels();
})();