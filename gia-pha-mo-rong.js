
/* Chuyên mục tưởng niệm, bia mộ và chế độ xem toàn cảnh.
   Dữ liệu mới vẫn ghi trong gp_stories/gp_documents JSON hiện hành. */
(function(){
 'use strict';
 if(!Array.isArray(CATEGORIES))return;
 if(!CATEGORIES.includes('Tưởng niệm'))CATEGORIES.push('Tưởng niệm');
 const originalNavigate=navigate;
 navigate=function(to){
   if(!['memorials','graves'].includes(to))return originalNavigate(to);
   state.view=to;
   $$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+to));
   $$('[data-view]').forEach(b=>b.classList.toggle('nav-active',b.dataset.view===to));
   $('.main-nav')?.classList.remove('menu-open');
   $('#mobile-menu')?.setAttribute('aria-expanded','false');
   window.scrollTo({top:0,behavior:'instant'});
 };
 const originalRenderStories=renderStories;
 renderStories=function(){
   const original=state.stories;
   state.stories=original.filter(s=>s.category!=='Tưởng niệm');
   if(state.storyFilter==='Tưởng niệm')state.storyFilter='Tất cả';
   try{originalRenderStories()}finally{state.stories=original;}
 };
 const originalStoryForm=storyForm;
 storyForm=function(s){
   let result=originalStoryForm(s);
   const time=s?.createdAt||new Date().toISOString();
   result=result.replace('data-kind="story">','data-kind="story"><input type="hidden" name="createdAt" value="'+safe(time)+'">');
   result=result.replace('Ngày tháng / niên đại','Ngày tháng / ngày giỗ (Âm lịch nếu có)');
   result=result.replace('Lời dẫn ngắn','Lời dẫn / thông tin tưởng niệm');
   return result;
 };
 const originalDocumentForm=documentForm;
 documentForm=function(d){
   let result=originalDocumentForm(d);
   result=result.replace(/(<select[^>]*name="type"[^>]*>)([\s\S]*?)(<\/select>)/,
     (_,begin,options,end)=>begin+options+'<option value="Thông tin bia mộ" '+(d?.type==='Thông tin bia mộ'?'selected':'')+'>Thông tin bia mộ</option>'+end);
   const x=d||{};
   const relatives=optionList(x.personId,state.persons.slice().sort(byName).map(p=>({value:p.id,label:p.name})));
   const extra='<div class="grave-extra" id="grave-extra" '+(x.type==='Thông tin bia mộ'?'':'hidden')+'>'
      +field('Người được an táng','personId',null,{select:relatives})
      +field('Vị trí mộ / nghĩa trang','graveLocation',x.graveLocation,{full:true})
      +field('Ngày an táng (nếu rõ)','burialDate',x.burialDate)
      +field('Nội dung khắc trên bia','inscription',x.inscription,{long:true,full:true,rows:5})
      +'</div>';
   result=result.replace('<div class="form-field full"><label class="form-check"><input type="checkbox" name="public"',extra+'<div class="form-field full"><label class="form-check"><input type="checkbox" name="public"');
   return result;
 };
 function currentMemorials(){
   return state.stories.map((s,i)=>({s,i})).filter(x=>x.s.category==='Tưởng niệm'&&x.s.public!==false)
     .sort((a,b)=>(Date.parse(b.s.createdAt||'')||0)-(Date.parse(a.s.createdAt||'')||0)||b.i-a.i)
     .map(x=>x.s);
 }
 function portraitOf(s){
   const linked=person(s.personId);
   const cover=mediaCover('stories',s.id)||(linked?mediaCover('persons',linked.id):null);
   return urlSafe(cover?.signedUrl||linked?.photo||'');
 }
 function portraitHTML(s){
   const url=portraitOf(s);
   return url?'<img src="'+safe(url)+'" alt="Chơn dung '+safe(person(s.personId)?.name||s.title)+'" loading="lazy">':'<span class="fallback" aria-hidden="true">✥</span>';
 }
 function renderHomeMemorial(){
   const target=$('#home-memorial');if(!target)return;
   const s=currentMemorials()[0];
   if(!s){target.innerHTML='<div class="heritage-empty">Chưa có bài tưởng niệm công khai. Sau khi đăng bài Tưởng niệm trong mục Quản trị, chơn dung và thông tin mới nhất sẽ tự hiện tại đây.</div>';return;}
   const p=person(s.personId),name=p?.name||'',date=s.date||'';
   target.innerHTML='<article class="heritage-card"><div class="heritage-portrait">'+portraitHTML(s)+'</div>'+
     '<div class="heritage-info"><span class="eyebrow-mini">BÀI TƯỞNG NIỆM GẦN NHẤT</span><h3>'+safe(s.title)+'</h3>'+
     (name?'<p class="heritage-meta">'+safe(name)+' · '+safe(years(p))+'</p>':'')+
     (date?'<p class="heritage-meta">Ngày giỗ / tưởng niệm: '+safe(date)+'</p>':'')+
     '<p>'+safe(s.summary||text(s.content).slice(0,185))+'</p>'+
     '<div class="heritage-actions"><button class="btn btn-primary" type="button" data-detail-story="'+safe(s.id)+'">Xem chi tiết</button>'+
     '<button class="btn btn-outline" type="button" data-go="memorials">Xem các bài tưởng niệm khác</button></div></div></article>';
 }
 let visibleMemorials=12;
 function renderMemorialList(){
   const list=$('#memorial-list');if(!list)return;
   const posts=currentMemorials();
   list.innerHTML=posts.slice(0,visibleMemorials).map(s=>
     '<button type="button" class="heritage-mini" data-detail-story="'+safe(s.id)+'">'+
     '<span class="heritage-mini-image">'+portraitHTML(s)+'</span>'+
     '<span class="heritage-mini-content"><small>TƯỞNG NIỆM'+(s.date?' · '+safe(s.date):'')+'</small><strong>'+safe(s.title)+'</strong>'+
     '<p>'+safe(s.summary||text(s.content).slice(0,115))+'</p><span class="read-link">Xem chi tiết →</span></span></button>'
   ).join('')||'<div class="heritage-empty">Chưa có bài tưởng niệm công khai.</div>';
   $('#memorial-more').hidden=posts.length<=visibleMemorials;
 }
 function graves(){
   return state.documents.filter(d=>d.public!==false&&['Thông tin bia mộ','Văn bia, mộ chí'].includes(d.type))
     .slice().sort((a,b)=>text(a.title).localeCompare(text(b.title),'vi'));
 }
 function graveCover(d){
   const media=mediaCover('documents',d.id);
   const fallback=/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(d.url||'')?d.url:'';
   return urlSafe(media?.signedUrl||fallback||'');
 }
 function renderGraveList(){
   const list=$('#grave-list');if(!list)return;
   list.innerHTML=graves().map(d=>{
     const photo=graveCover(d),name=person(d.personId)?.name||'';
     return '<button type="button" class="heritage-mini" data-grave="'+safe(d.id)+'">'+
       '<span class="heritage-mini-image">'+(photo?'<img src="'+safe(photo)+'" alt="Bia mộ '+safe(name||d.title)+'" loading="lazy">':'▧')+'</span>'+
       '<span class="heritage-mini-content"><small>'+safe(name||'BIA MỘ GIA TỘC')+'</small><strong>'+safe(d.title)+'</strong>'+
       '<p>'+safe(d.graveLocation||d.description||'Đang bổ sung vị trí và nội dung văn bia.')+'</p><span class="read-link">Xem thông tin →</span></span></button>';
   }).join('')||'<div class="heritage-empty">Chưa có thông tin bia mộ công khai. Người quản trị có thể thêm trong Tư liệu & Bia mộ.</div>';
 }
 function detailGrave(id){
   const d=state.documents.find(x=>x.id===id);if(!d)return;
   const p=person(d.personId);
   const fields=[['Người được an táng',p?.name],['Địa điểm an táng',d.graveLocation],['Ngày an táng',d.burialDate],['Ghi chép',d.description],['Văn bia',d.inscription],['Nguồn tư liệu',d.source]]
     .filter(([,value])=>text(value));
   const url=urlSafe(d.url);
   openDetail('<div class="detail-top"><span class="overline">THÔNG TIN BIA MỘ</span><h2>'+safe(d.title)+'</h2></div>'+
     '<div class="detail-body"><div class="detail-grid">'+fields.map(([k,v])=>'<div class="detail-field"><label>'+safe(k)+'</label><div>'+safe(v)+'</div></div>').join('')+'</div>'+
     galleryHtml('documents',id)+(url?'<p><a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">Mở tư liệu liên hệ ↗</a></p>':'')+
     (p?'<div class="related-links"><button type="button" data-detail-person="'+safe(p.id)+'">Hồ sơ '+safe(p.name)+'</button></div>':'')+
     (isAdmin()?'<div class="detail-actions"><button type="button" class="btn btn-primary" data-edit-grave="'+safe(d.id)+'">Sửa thông tin bia mộ</button></div>':'')+'</div>');
 }
 const originalRenderAll=renderAll;
 renderAll=function(){
   originalRenderAll();
   renderHomeMemorial();
   renderMemorialList();
   renderGraveList();
 };
 const originalSetTreeZoom=setTreeZoom;
 const originalRenderTree=renderTree;
 const originalCenterTreeAxis=centerTreeAxis;
 function applyTreeZoom(value,whole=false){
   const sc=$('#tree-scroll'),canvas=$('#tree-canvas'),box=$('#tree-zoom-box');
   const n=Number(value);
   if(!sc||!canvas||!box||!Number.isFinite(n))return;
   state.treeWholeView=whole;
   state.zoom=Math.max(0.05,Math.min(200,Math.round(n*100)/100));
   const z=state.zoom/100,w=parseFloat(canvas.style.width)||0,h=parseFloat(canvas.style.height)||0;
   $('#zoom-number').textContent=state.zoom<1?state.zoom.toFixed(2)+'%':state.zoom.toFixed(1).replace(/\.0$/,'')+'%';
   $('#tree-zoom').value=String(state.zoom);
   canvas.style.transform='scale('+z+')';
   box.style.width=w*z+'px';box.style.height=h*z+'px';
   centerTreeAxis();
 }
 centerTreeAxis=function(){
   const sc=$('#tree-scroll'),box=$('#tree-zoom-box'),canvas=$('#tree-canvas');
   if(!sc||!box||!canvas||!sc.clientWidth)return;
   const scale=state.zoom/100,w=parseFloat(canvas.style.width)||0;
   const firstY=parseFloat(canvas.dataset.contentTop)||0;
   const lastY=parseFloat(canvas.dataset.contentBottom)||parseFloat(canvas.style.height)||0;
   const scaledHeight=Math.max(0,(lastY-firstY)*scale);
   const mobile=window.matchMedia('(max-width:760px)').matches;
   sc.style.height=(mobile?Math.max(285,Math.min(460,Math.round(scaledHeight+112))):Math.max(390,Math.min(600,Math.round(scaledHeight+120))))+'px';
   const scaledW=w*scale;
   const root=(parseFloat(canvas.dataset.focusX)||w/2)*scale;
   const offsetX=state.treeWholeView?Math.max(0,(sc.clientWidth-scaledW)/2):Math.max(0,sc.clientWidth/2-root);
   box.style.marginLeft=offsetX+'px';box.style.marginRight='0px';
   sc.scrollLeft=state.treeWholeView?0:Math.max(0,root+offsetX-sc.clientWidth/2);
   const midpoint=(firstY+lastY)*scale/2;
   const fits=scaledHeight+45<=sc.clientHeight;
   box.style.marginTop=(fits?Math.max(0,sc.clientHeight/2-midpoint):0)+'px';
   box.style.marginBottom='0px';
   sc.scrollTop=fits?0:Math.max(0,firstY*scale-30);
 };
 setTreeZoom=function(value){applyTreeZoom(value,false);};
 renderTree=function(){
   originalRenderTree();
   if(state.treeWholeView)fitWholeTree();
 };
 function fitWholeTree(){
   const sc=$('#tree-scroll'),canvas=$('#tree-canvas');
   const w=parseFloat(canvas?.style.width)||0,h=parseFloat(canvas?.style.height)||0;
   if(!w||!h||!sc?.clientWidth)return;
   const maxHeight=window.matchMedia('(max-width:760px)').matches?460:600;
   const scale=Math.min((sc.clientWidth-26)/w,(maxHeight-45)/h,1.6);
   applyTreeZoom(Math.max(0.05,Math.floor(scale*10000)/100),true);
 }
 document.addEventListener('click',e=>{
   const t=e.target.closest('button');if(!t)return;
   if(t.id==='tree-fit'){fitWholeTree();return;}
   if(t.id==='memorial-more'){visibleMemorials+=12;renderMemorialList();return;}
   if(t.matches('[data-grave]')){detailGrave(t.dataset.grave);return;}
   if(t.matches('[data-edit-grave]')){openEdit('document',t.dataset.editGrave);return;}
 },false);
 document.addEventListener('change',e=>{
   if(e.target.id==='field-type'){
     const fields=$('#grave-extra');if(fields)fields.hidden=e.target.value!=='Thông tin bia mộ';
   }
 },false);
 const reset=$('#tree-reset');
 reset?.addEventListener('click',e=>{
   e.stopPropagation();
   state.treeWholeView=false;
   state.zoom=window.matchMedia('(max-width:760px)').matches?65:100;
   renderTree();
 },false);
 $('#tree-root')?.addEventListener('change',()=>{state.treeWholeView=false;},true);
 window.addEventListener('resize',()=>{if(state.view==='tree'&&state.treeWholeView)fitWholeTree();});
 window.addEventListener('hashchange',()=>{
   const page=location.hash.slice(1);
   if(['memorials','graves'].includes(page))navigate(page);
 });
 if(['memorials','graves'].includes(location.hash.slice(1)))navigate(location.hash.slice(1));
 renderHomeMemorial();renderMemorialList();renderGraveList();
})();
