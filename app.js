/* HUỲNH TỘC GIA PHẢ — Bản đầu tiên, 03-11-2026.
   - Cây thế hệ tính từ quan hệ cha/mẹ, không gán đời thủ công.
   - Người còn sống không được công khai nếu chưa có sự chấp thuận.
   - Thư viện dùng bucket private, đường dẫn ảnh ký hạn 15 phút.
   - Chỉ dữ liệu đã công bố được đưa lên trang công khai.
*/
(() => {
  'use strict';
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const ESC = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => n==null?'':String(n);
  const escapeAttr = ESC;
  const cfg = window.FAMILY_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey&&/^https:\/\//i.test(cfg.supabaseUrl));
  const BUCKET = 'family-photos';
  const MAX_IMAGE = 6*1024*1024;
  const MAX_BATCH = 20;
  const imgExt = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const categories = ['Nguồn cội','Gia sử','Gia phong','Tư liệu'];
  const demo = {
    people:[
      {id:'d1',full_name:'Thủy tổ (minh họa)',alias:'',gender:'male',birth_year:1828,death_year:1901,is_living:false,consent_public:false,published:true,branch:'Tổ hệ',father_id:null,mother_id:null,biography:'Đây là nhân vật minh họa giao diện. Không sử dụng làm nguồn thông tin gia hệ thực tế.',date_notes:'',sources:'DỮ LIỆU MINH HỌA – chưa đối chiếu.'},
      {id:'d2',full_name:'Bà tổ (minh họa)',alias:'',gender:'female',birth_year:1832,death_year:1906,is_living:false,consent_public:false,published:true,branch:'Tổ hệ',father_id:null,mother_id:null,biography:'Đây là nhân vật minh họa quan hệ phối ngẫu.',date_notes:'',sources:'DỮ LIỆU MINH HỌA.'},
      {id:'d3',full_name:'Con trưởng (minh họa)',alias:'',gender:'male',birth_year:1855,death_year:1925,is_living:false,consent_public:false,published:true,branch:'Chi trưởng',father_id:'d1',mother_id:'d2',biography:'Ví dụ vị trí đời thứ hai.',date_notes:'',sources:'DỮ LIỆU MINH HỌA.'},
      {id:'d4',full_name:'Con thứ (minh họa)',alias:'',gender:'male',birth_year:1859,death_year:1933,is_living:false,consent_public:false,published:true,branch:'Chi thứ',father_id:'d1',mother_id:'d2',biography:'Ví dụ vị trí đời thứ hai.',date_notes:'',sources:'DỮ LIỆU MINH HỌA.'},
      {id:'d5',full_name:'Hậu duệ (minh họa)',alias:'',gender:'female',birth_year:1884,death_year:1959,is_living:false,consent_public:false,published:true,branch:'Chi trưởng',father_id:'d3',mother_id:null,biography:'Ví dụ vị trí đời thứ ba.',date_notes:'',sources:'DỮ LIỆU MINH HỌA.'},
      {id:'d6',full_name:'Đời tiếp nối (minh họa)',alias:'',gender:'male',birth_year:1912,death_year:1982,is_living:false,consent_public:false,published:true,branch:'Chi trưởng',father_id:null,mother_id:'d5',biography:'Ví dụ vị trí đời thứ tư.',date_notes:'',sources:'DỮ LIỆU MINH HỌA.'}
    ],
    unions:[{id:'u1',person_a_id:'d1',person_b_id:'d2'}],
    stories:[
      {id:'s1',title:'Lời tựa Phả Ký – Bản phác thảo',category:'Nguồn cội',summary:'Mấy lời mở đầu cho công việc chép phả, tìm lại gốc tích và ghi nhớ ân đức tiền nhân.',body:'Con người có tổ có tông, như cây có cội, như sông có nguồn.\n\nTrang phả ký này được lập ra để làm nơi khảo cứu và chép lại những chuyện đã qua, từ gốc tích của ông bà đến dấu chân con cháu trải mấy đời sinh sống.\n\nĐây là BẢN VIẾT MẪU, chưa phải lời tựa chính thức của dòng họ. Khi có đủ tài liệu, người biên tập sẽ thay bằng nội dung đã được gia tộc đối chiếu.',sources:'Dữ liệu minh họa giao diện',related_person_id:null,published:true,created_at:'2026-11-03T10:00:00Z'},
      {id:'s2',title:'Ghi chép các thế hệ – Bản minh họa',category:'Gia sử',summary:'Một ví dụ về cách trình bày sự tích, niên đại và những dấu mốc trong gia sử.',body:'Mỗi chi phái đều có những chặng đường riêng, nhưng cùng trở về một mạch nguồn.\n\nTrong các bài gia sử, nên ghi ngày tháng âm – dương lịch, chỉ rõ văn kiện làm chứng, đồng thời giữ nguyên những chi tiết chưa rõ để khảo cứu sau.\n\nNỘI DUNG NÀY CHỈ ĐỂ THỬ GIAO DIỆN.',sources:'Dữ liệu minh họa giao diện',related_person_id:null,published:true,created_at:'2026-11-02T10:00:00Z'},
      {id:'s3',title:'Giữ lễ nghĩa và gia phong – Bản minh họa',category:'Gia phong',summary:'Ghi lại những lời giáo huấn, nếp nhà và tấm lòng hiếu kính tổ tiên.',body:'Kính trên, nhường dưới, thương yêu quyến thuộc, giữ đạo nghĩa giữa đời.\n\nNỘI DUNG NÀY CHỈ ĐỂ THỬ GIAO DIỆN.',sources:'Dữ liệu minh họa giao diện',related_person_id:null,published:true,created_at:'2026-11-01T10:00:00Z'}
    ],
    assets:[]
  };
  const state = {
    db:null, admin:false, user:null,
    people:[], unions:[], stories:[], assets:[], demo:!configured,
    treeZoom:1, branch:'all', query:'', storyFilter:'all',
    editorKind:'person', editorId:null,
    pendingCover:null, pendingGallery:[], actionBusy:false, closingDetail:false
  };
  let toastTimer=null;
  function toast(message){
    const el=$('#toast');el.textContent=message;el.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4300);
  }
  const yearRange=p=>{
    const a=p.birth_year,b=p.death_year;
    if(a&&b)return `${a}–${b}`;
    if(a&&p.is_living)return `Sanh ${a}`;
    if(a)return `${a}–?`;
    if(b)return `?–${b}`;
    return 'Đang bổ sung niên đại';
  };
  const personById=id=>state.people.find(p=>p.id===id);
  const storyById=id=>state.stories.find(p=>p.id===id);
  const safeImage=url=>{
    if(!url)return '';
    try {const p=new URL(url);return p.protocol==='https:'?p.href:''}catch{return ''}
  };
  const assetsFor=(type,id,kind)=>state.assets.filter(a=>a.owner_type===type&&a.owner_id===id&&(!kind||a.kind===kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.created_at||'').localeCompare(String(b.created_at||'')));
  const coverFor=(type,id)=>assetsFor(type,id,'cover')[0]?.signedUrl||'';
  const galleryFor=(type,id)=>assetsFor(type,id,'gallery');
  const lastNameInitial=name=>(name||'H').trim().split(/\s+/).pop()?.charAt(0)?.toUpperCase()||'H';
  const personVisible = p => state.admin || (p.published && (!p.is_living||p.consent_public));
  const storyVisible = s => state.admin || s.published;
  const publicPeople=()=>state.people.filter(personVisible);
  const publicStories=()=>state.stories.filter(storyVisible);
  function genMap(people=publicPeople()){
    const index=new Map(people.map(p=>[p.id,p])), memo=new Map(), stack=new Set();
    function find(id){
      if(memo.has(id))return memo.get(id);
      if(stack.has(id))return 1;
      const person=index.get(id);if(!person)return 0;
      stack.add(id);
      const parentG=[person.father_id,person.mother_id].map(pid=>pid&&pid!==id?find(pid):0);
      stack.delete(id);
      const gen=Math.min(30,1+Math.max(0,...parentG));memo.set(id,gen);return gen;
    }
    people.forEach(p=>find(p.id));
    // Người phối ngẫu không rõ cha mẹ được đặt cùng đời với người phối ngẫu đã có dòng cha mẹ.
    for(let pass=0;pass<2;pass++)for(const u of state.unions){
      const a=index.get(u.person_a_id),b=index.get(u.person_b_id);if(!a||!b)continue;
      const ag=+(memo.get(a.id)||1),bg=+(memo.get(b.id)||1);
      if(ag>bg && !b.father_id&&!b.mother_id)memo.set(b.id,ag);
      if(bg>ag && !a.father_id&&!a.mother_id)memo.set(a.id,bg);
    }
    return memo;
  }
  function renderCounts(){
    const ppl=publicPeople().filter(p=>p.published),stories=publicStories().filter(p=>p.published);
    const generations=genMap(ppl);
    $('#stat-people').textContent=ppl.length;
    $('#stat-generations').textContent=Math.max(0,...generations.values());
    $('#stat-branches').textContent=new Set(ppl.map(p=>p.branch).filter(Boolean)).size;
    $('#stat-stories').textContent=stories.length;
  }
  function updateBranches(){
    const control=$('#tree-branch');const current=control.value;
    const branches=[...new Set(publicPeople().map(p=>p.branch).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
    control.innerHTML='<option value="all">Tất cả chi phái</option>'+branches.map(b=>`<option value="${escapeAttr(b)}">${ESC(b)}</option>`).join('');
    control.value=branches.includes(current)?current:'all';state.branch=control.value;
  }
  function drawTreeEdges(){
    const canvas=$('#tree-canvas');const svg=$('#tree-lines');if(!svg||!canvas)return;
    const zoom=state.treeZoom;
    const cr=canvas.getBoundingClientRect();
    const coords=new Map();
    $$('.tree-person',canvas).forEach(e=>{
      const r=e.getBoundingClientRect();
      coords.set(e.dataset.personId,{x:(r.left-cr.left+r.width/2)/zoom,y:(r.top-cr.top)/zoom,bottom:(r.bottom-cr.top)/zoom,height:r.height/zoom});
    });
    const width=canvas.offsetWidth,height=canvas.offsetHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));
    const paths=[];const visible=publicPeople();
    for(const p of visible){
      const child=coords.get(p.id);if(!child)continue;
      for(const parentId of [p.father_id,p.mother_id]){
        const par=coords.get(parentId);if(!par||par.bottom>=child.y)continue;
        const mid=par.bottom+(child.y-par.bottom)*.49;
        paths.push(`<path d="M ${par.x} ${par.bottom} V ${mid} H ${child.x} V ${child.y}" fill="none" stroke="#9eb3a4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
    }
    for(const u of state.unions){
      const a=coords.get(u.person_a_id),b=coords.get(u.person_b_id);
      if(!a||!b||Math.abs(a.y-b.y)>30)continue;
      const y=Math.min(a.y+a.height/2,b.y+b.height/2);
      paths.push(`<path d="M ${a.x} ${y} H ${b.x}" stroke="#b6a07d" stroke-width="1.4" stroke-dasharray="4,7" opacity=".7"/>`);
    }
    svg.innerHTML=paths.join('');
  }
  function renderTree(){
    const all=publicPeople();const filtered=state.branch==='all'?all:all.filter(p=>p.branch===state.branch);
    const selectedIds=new Set(filtered.map(p=>p.id));
    const gens=genMap(all);
    const grouped=new Map();
    filtered.forEach(p=>{const gen=gens.get(p.id)||1;if(!grouped.has(gen))grouped.set(gen,[]);grouped.get(gen).push(p)});
    const keys=[...grouped.keys()].sort((a,b)=>a-b);
    const canvas=$('#tree-canvas');
    if(!keys.length){canvas.innerHTML='<div class="tree-placeholder">Chưa có hồ sơ thuộc chi phái đang chọn. Đăng nhập quản trị để bắt đầu lập phả.</div>';$('#tree-count').textContent='0 hồ sơ';return}
    const q=state.query.trim().toLocaleLowerCase('vi');
    const rows=keys.map(gen=>{
      const members=grouped.get(gen).sort((a,b)=>(a.birth_year||9999)-(b.birth_year||9999)||(a.full_name||'').localeCompare(b.full_name||'','vi'));
      return `<div class="generation-row"><div class="generation-label">ĐỜI THỨ ${gen}</div><div class="generation-members">${members.map(p=>{
        const match=!q||(p.full_name+' '+(p.alias||'')).toLocaleLowerCase('vi').includes(q);
        const root=!p.father_id&&!p.mother_id;
        return `<button type="button" class="tree-person ${root?'is-root':''} ${q?(match?'search-hit':'search-dim'):''}" data-person-id="${ESC(p.id)}" data-open-person="${ESC(p.id)}" aria-label="Xem hồ sơ ${ESC(p.full_name)}"><span class="tree-initial">${ESC(lastNameInitial(p.full_name))}</span><strong class="tree-name">${ESC(p.full_name)}</strong><span class="tree-years">${ESC(yearRange(p))}</span><span class="tree-branch">${ESC(p.branch||'Chưa xác định chi')}</span></button>`;
      }).join('')}</div></div>`;
    }).join('');
    canvas.innerHTML=`<svg id="tree-lines" aria-hidden="true"></svg>${rows}`;
    canvas.style.zoom=state.treeZoom;
    $('#tree-count').textContent=`${filtered.length} hồ sơ · ${keys.length} thế hệ hiển thị`;
    requestAnimationFrame(drawTreeEdges);
  }
  function renderStories(){
    const rows=publicStories().filter(s=>state.storyFilter==='all'||s.category===state.storyFilter);
    const target=$('#story-grid');
    target.innerHTML=rows.length?rows.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).map(s=>{
      const url=safeImage(coverFor('story',s.id));
      return `<article class="story-card"><div class="story-thumb ${url?'':'empty'}">${url?`<img src="${ESC(url)}" alt="Ảnh bìa ${ESC(s.title)}" loading="lazy">`:''}</div><div class="story-copy"><span class="story-label">${ESC(s.category||'PHẢ KÝ')} · ${ESC(s.created_at?new Date(s.created_at).toLocaleDateString('vi-VN'):'')}</span><h3>${ESC(s.title)}</h3><p>${ESC(s.summary||'Một trang ghi chép trong kho gia sử dòng họ.')}</p><button class="story-open" data-open-story="${ESC(s.id)}" type="button">Đọc phả ký ↗</button></div></article>`;
    }).join(''):'<div class="empty-state"><strong>Chưa có bài phả ký</strong>Những câu chuyện về nguồn cội và gia sử sẽ được bổ sung tại đây.</div>';
  }
  function renderPeople(){
    const visible=publicPeople();const gen=genMap(visible);
    const people=visible.sort((a,b)=>(gen.get(a.id)||1)-(gen.get(b.id)||1)||(a.birth_year||9999)-(b.birth_year||9999)).slice(0,12);
    $('#people-grid').innerHTML=people.length?people.map(p=>{
      const portrait=safeImage(coverFor('person',p.id));
      return `<article class="person-card"><div class="person-pic">${portrait?`<img src="${ESC(portrait)}" alt="Di ảnh ${ESC(p.full_name)}" loading="lazy">`:`<span class="person-initial" aria-hidden="true">${ESC(lastNameInitial(p.full_name))}</span>`}</div><div class="person-info"><small>ĐỜI THỨ ${gen.get(p.id)||1} · ${ESC(p.branch||'CHƯA PHÂN CHI')}</small><h3>${ESC(p.full_name)}</h3><p>${ESC(yearRange(p))}</p><button type="button" data-open-person="${ESC(p.id)}">Xem hồ sơ ↗</button></div></article>`;
    }).join(''):'<div class="empty-state"><strong>Chưa có hồ sơ công khai</strong>Ban biên tập đang sưu tầm và đối chiếu gia hệ.</div>';
  }
  function renderAll(){updateBranches();renderCounts();renderTree();renderStories();renderPeople();if(state.admin)renderEditorRecords()}
  const showName=p=>p?`${p.full_name} (${yearRange(p)})`:'Chưa rõ';
  function renderDetailGallery(type,id){
    const rows=galleryFor(type,id).filter(x=>safeImage(x.signedUrl));
    if(!rows.length)return '';
    return `<section class="detail-subsection"><h3>Hình ảnh và tư liệu liên hệ <span class="source-tag">${rows.length} ảnh</span></h3><div class="detail-gallery">${rows.map((a,i)=>`<figure><button data-view-image="${ESC(a.id)}" aria-label="Xem ảnh thứ ${i+1}" type="button"><img src="${ESC(a.signedUrl)}" alt="${ESC(a.caption||'Tư liệu số '+(i+1))}" loading="lazy"></button><figcaption>${ESC(a.caption||`Tư liệu số ${i+1}`)}</figcaption></figure>`).join('')}</div></section>`;
  }
  function openPerson(id){
    const p=personById(id);if(!p||!personVisible(p))return;
    const generations=genMap(publicPeople());
    const image=safeImage(coverFor('person',id));
    const parents=[p.father_id,p.mother_id].map(personById).filter(x=>x&&personVisible(x));
    const partners=state.unions.filter(u=>u.person_a_id===id||u.person_b_id===id).map(u=>personById(u.person_a_id===id?u.person_b_id:u.person_a_id)).filter(x=>x&&personVisible(x));
    const children=publicPeople().filter(x=>x.father_id===id||x.mother_id===id).sort((a,b)=>(a.birth_year||9999)-(b.birth_year||9999));
    const related=publicStories().filter(s=>s.related_person_id===id);
    const chips = people => people.length?`<div class="detail-links">${people.map(x=>`<button type="button" class="detail-chip" data-open-person="${ESC(x.id)}">${ESC(x.full_name)}</button>`).join('')}</div>`:'<p style="color:#899087;font-size:12px">Chưa có dữ liệu liên hệ.</p>';
    $('#detail-content').innerHTML=`<div class="detail-eyebrow">HỒ SƠ GIA PHẢ · ĐỜI THỨ ${generations.get(id)||1}</div><h2>${ESC(p.full_name)}</h2><p class="detail-meta">${ESC(yearRange(p))} · ${ESC(p.branch||'Chưa phân chi')}</p><div class="detail-cover">${image?`<img src="${ESC(image)}" alt="Di ảnh ${ESC(p.full_name)}">`:`<span class="cover-initial">${ESC(lastNameInitial(p.full_name))}</span>`}</div>${image?`<button type="button" class="detail-chip" data-view-image="${ESC(assetsFor('person',id,'cover')[0]?.id)}">⤢ Xem di ảnh lớn</button>`:''}<div class="detail-subsection"><h3>Thân thế và tiểu sử</h3><p class="detail-body">${ESC(p.biography||'Tư liệu tiểu sử đang được sưu khảo.')}</p></div>${p.alias?`<p class="detail-meta">Tên khác: ${ESC(p.alias)}</p>`:''}${p.date_notes?`<p class="detail-meta">Ngày Âm – Dương lịch: ${ESC(p.date_notes)}</p>`:''}<section class="detail-subsection"><h3>Cha mẹ</h3>${chips(parents)}</section><section class="detail-subsection"><h3>Phối ngẫu</h3>${chips(partners)}</section><section class="detail-subsection"><h3>Con cái</h3>${chips(children)}</section>${related.length?`<section class="detail-subsection"><h3>Phả ký liên hệ</h3><div class="detail-links">${related.map(s=>`<button class="detail-chip" data-open-story="${ESC(s.id)}">${ESC(s.title)}</button>`).join('')}</div></section>`:''}${renderDetailGallery('person',id)}<div class="detail-source"><strong>NGUỒN TƯ LIỆU VÀ GHI CHÚ</strong>\n${ESC(p.sources||'Chưa cập nhật nguồn tư liệu.')}</div>`;
    openOverlay('detail');
  }
  function openStory(id){
    const s=storyById(id);if(!s||!storyVisible(s))return;
    const cover=safeImage(coverFor('story',id));const linked=personById(s.related_person_id);
    $('#detail-content').innerHTML=`<div class="detail-eyebrow">PHẢ KÝ · ${ESC(s.category||'GIA SỬ')}</div><h2>${ESC(s.title)}</h2><p class="detail-meta">${ESC(s.created_at?new Date(s.created_at).toLocaleDateString('vi-VN'):'')}</p>${cover?`<div class="detail-cover"><img src="${ESC(cover)}" alt="Ảnh bìa ${ESC(s.title)}"></div>`:''}<p class="detail-summary">${ESC(s.summary||'')}</p><div class="detail-body">${ESC(s.body||'Nội dung đang được bổ sung.')}</div>${linked&&personVisible(linked)?`<section class="detail-subsection"><h3>Nhân vật liên hệ</h3><button type="button" class="detail-chip" data-open-person="${ESC(linked.id)}">${ESC(linked.full_name)} ↗</button></section>`:''}${renderDetailGallery('story',id)}<div class="detail-source"><strong>TÀI LIỆU ĐỐI CHIẾU</strong>\n${ESC(s.sources||'Chưa cập nhật nguồn khảo chứng.')}</div>`;
    openOverlay('detail');
  }
  const openOverlay=type=>{const el=$(`#${type}-overlay`);el.hidden=false;document.body.classList.add('modal-open');$(`.${type}-panel`,el)?.scrollTo(0,0);$(`.${type}-panel`,el)?.focus({preventScroll:true})};
  const closeOverlay=type=>{const el=$(`#${type}-overlay`);el.hidden=true;if($('#admin-overlay').hidden&&$('#detail-overlay').hidden)document.body.classList.remove('modal-open')};
  function openImage(id){
    const asset=state.assets.find(a=>a.id===id);if(!asset||!safeImage(asset.signedUrl))return;
    const el=document.createElement('div');el.className='image-lightbox';el.id='image-lightbox';el.setAttribute('role','dialog');el.setAttribute('aria-label','Ảnh tư liệu nguyên bản');
    el.innerHTML=`<div class="lightbox-bar"><span>${ESC(asset.caption||'Ảnh tư liệu gia phả')}</span><button type="button" data-close-image aria-label="Đóng ảnh">×</button></div><div class="lightbox-photo"><img src="${ESC(asset.signedUrl)}" alt="${ESC(asset.caption||'Ảnh tư liệu')}"></div><div class="lightbox-foot"><button type="button" data-zoom-photo>⤢ Phóng to</button><a href="${ESC(asset.signedUrl)}" download target="_blank" rel="noopener noreferrer">Mở / lưu ảnh gốc ↗</a></div>`;
    document.body.appendChild(el);document.body.classList.add('modal-open');
    $('[data-zoom-photo]',el).addEventListener('click',()=>$('.lightbox-photo',el).classList.toggle('zoomed'));
    $('[data-close-image]',el).addEventListener('click',closeImage);
  }
  function closeImage(){const el=$('#image-lightbox');if(el)el.remove();if($('#admin-overlay').hidden&&$('#detail-overlay').hidden)document.body.classList.remove('modal-open')}

  /* DATA AND AUTH */
  async function isSiteAdmin(){
    if(!state.db||!state.user)return false;
    const {data,error}=await state.db.rpc('family_is_admin');
    return !error&&data===true;
  }
  async function loadData(){
    if(!state.db){state.people=demo.people.map(x=>({...x}));state.stories=demo.stories.map(x=>({...x}));state.unions=demo.unions.map(x=>({...x}));state.assets=[];state.demo=true;$('#demo-banner').hidden=false;renderAll();return;}
    try{
      const names=['family_people','family_stories','family_unions','family_assets'];
      const result=await Promise.all(names.map(n=>state.db.from(n).select('*').limit(3000)));
      const problems=result.map((r,i)=>r.error?`${names[i]}: ${r.error.message}`:'').filter(Boolean);
      if(problems.length)throw Error(problems.join(' | '));
      state.people=result[0].data||[];state.stories=result[1].data||[];
      state.unions=result[2].data||[];state.assets=result[3].data||[];
      await Promise.all(state.assets.map(async a=>{
        if(!a.storage_path)return;
        try {const {data,error}=await state.db.storage.from(BUCKET).createSignedUrl(a.storage_path,900);if(!error&&data?.signedUrl)a.signedUrl=data.signedUrl;}catch{}
      }));
      state.demo=false;$('#demo-banner').hidden=true;renderAll();
    }catch(error){console.error('[Gia phả] Lỗi đọc cơ sở dữ liệu:',error);toast('Không đọc được dữ liệu Supabase: '+error.message)}
  }
  async function initDB(){
    if(!configured){await loadData();return}
    try{
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      state.db=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
      const {data:{session}}=await state.db.auth.getSession();state.user=session?.user||null;
      state.admin=await isSiteAdmin();
      await loadData();syncAdminUI();
      state.db.auth.onAuthStateChange((event,session)=>{
        if(event==='SIGNED_OUT'){state.user=null;state.admin=false;syncAdminUI();loadData()}
      });
    }catch(error){console.error(error);toast('Không kết nối được Supabase. Kiểm tra config.js và kết nối mạng.');await loadData()}
  }
  function syncAdminUI(){
    $('#admin-login-panel').hidden=state.admin;
    $('#admin-workspace').hidden=!state.admin;
    if(state.admin){$('#admin-email').textContent=state.user?.email||'Quản trị viên';renderEditor();renderEditorRecords()}
  }
  async function login(e){
    e.preventDefault();const status=$('#login-status');
    if(!state.db){status.textContent='Hiện đang ở chế độ xem thử. Hãy tạo dự án Supabase và điền config.js để bật quản trị.';return}
    const form=e.currentTarget;const btn=$('button[type="submit"]',form);btn.disabled=true;status.textContent='Đang xác thực…';
    try {
      const {data,error}=await state.db.auth.signInWithPassword({email:form.elements.email.value.trim(),password:form.elements.password.value});
      if(error)throw error;
      state.user=data.user;state.admin=await isSiteAdmin();
      if(!state.admin)throw Error('Tài khoản chưa được cấp quyền quản trị trong bảng family_admins.');
      status.textContent='';form.reset();await loadData();syncAdminUI();toast('Đã đăng nhập quản trị.');
    }catch(error){status.textContent='Không đăng nhập được: '+error.message}
    finally{btn.disabled=false}
  }

  /* ADMIN EDITOR — lưu bài và bộ ảnh trong một lần nhấn */
  const opt=(id,label,selected='')=>`<option value="${ESC(id)}" ${String(id)===String(selected)?'selected':''}>${ESC(label)}</option>`;
  const input=(name,label,value='',more='')=>`<label ${more.includes('full')?'class="full"':''}>${ESC(label)}<input name="${name}" value="${ESC(value??'')}" ${more.replace(/\bfull\b/g,'')}></label>`;
  const area=(name,label,value='',long=false)=>`<label class="full">${ESC(label)}<textarea name="${name}" ${long?'class="long"':''}>${ESC(value??'')}</textarea></label>`;
  const select=(name,label,options,value='',cl='')=>`<label class="${cl}">${ESC(label)}<select name="${name}">${options.map(([v,t])=>opt(v,t,value)).join('')}</select></label>`;
  const check=(name,label,checked=false)=>`<label class="inline-check full"><input type="checkbox" name="${name}" ${checked?'checked':''}>${label}</label>`;
  function buildPersonForm(p={}){
    const candidates=state.people.filter(x=>x.id!==p.id).sort((a,b)=>a.full_name.localeCompare(b.full_name,'vi'));
    const parents=[['','Chưa xác định'],...candidates.map(x=>[x.id,`${x.full_name} · ${yearRange(x)}`])];
    const partnerOpts=parents;
    const currentPartner=state.unions.find(u=>u.person_a_id===p.id||u.person_b_id===p.id);
    const partnerId=currentPartner?(currentPartner.person_a_id===p.id?currentPartner.person_b_id:currentPartner.person_a_id):'';
    return input('full_name','Họ tên đầy đủ *',p.full_name,'required full')+
      input('alias','Tên khác / tên thường gọi',p.alias)+
      select('gender','Giới tính',[['','Chưa rõ'],['male','Nam'],['female','Nữ'],['other','Khác']],p.gender)+
      select('branch','Chi phái / nhánh họ',[['','Chưa xác định'],...new Set(['Tổ hệ','Chi trưởng','Chi thứ',...state.people.map(x=>x.branch).filter(Boolean)]).values()].map(x=>Array.isArray(x)?x:[x,x]),p.branch)+
      input('birth_year','Năm sanh (Dương lịch)',p.birth_year,'inputmode="numeric" pattern="[0-9]*"')+
      input('death_year','Năm mất (nếu có)',p.death_year,'inputmode="numeric" pattern="[0-9]*"')+
      select('father_id','Cha ruột (liên kết gia phả)',parents,p.father_id)+
      select('mother_id','Mẹ ruột (liên kết gia phả)',parents,p.mother_id)+
      select('partner_id','Thêm / giữ liên kết phối ngẫu',partnerOpts,partnerId)+
      input('date_notes','Ngày tháng Âm – Dương lịch',p.date_notes,'full')+
      area('biography','Tiểu sử, công nghiệp và sự tích',p.biography,true)+
      area('sources','Nguồn sử liệu / ghi chú đối chiếu',p.sources)+
      check('is_living','Người này còn sống – mặc định không công bố thông tin cá nhân',p.is_living!==false)+
      check('consent_public','Đã có sự chấp thuận phù hợp để công bố thông tin người còn sống',Boolean(p.consent_public))+
      check('published','Công bố hồ sơ trên website (bỏ chọn để lưu bản nháp)',Boolean(p.published));
  }
  function buildStoryForm(s={}){
    const persons=[['','Không liên kết'],...state.people.map(p=>[p.id,`${p.full_name} (${yearRange(p)})`])];
    return input('title','Tên bài Phả Ký *',s.title,'required full')+
      select('category','Chuyên mục',[...categories.map(c=>[c,c])],s.category||'Nguồn cội')+
      select('related_person_id','Nhân vật liên quan',persons,s.related_person_id)+
      area('summary','Lời dẫn / tóm tắt',s.summary)+
      area('body','Toàn văn bài Phả Ký *',s.body,true)+
      area('sources','Xuất xứ bản gốc / nguồn tham khảo',s.sources)+
      check('published','Công bố bài Phả Ký trên website (bỏ chọn để lưu bản nháp)',Boolean(s.published));
  }
  const currentRecord=()=>state.editorKind==='person'?personById(state.editorId):storyById(state.editorId);
  function editorMediaMarkup(){
    return `<fieldset class="media-fieldset"><legend>Ảnh bìa / di ảnh chính</legend><label>Chọn một ảnh JPG, PNG hoặc WebP (tối đa 6 MB)<input type="file" id="cover-input" accept="image/jpeg,image/png,image/webp"></label><p class="form-note">Ảnh chỉ được hiển thị khi hồ sơ hoặc bài Phả Ký được công bố.</p><div id="saved-cover" class="saved-media"></div></fieldset>
    <fieldset class="media-fieldset"><legend>Hình ảnh và văn kiện đính kèm</legend><label>Chọn nhiều ảnh từ album iPhone / ứng dụng Tệp<input type="file" id="gallery-input" multiple accept="image/jpeg,image/png,image/webp"></label><p class="form-note">Tối đa ${MAX_BATCH} ảnh/lượt, mỗi ảnh không quá 6 MB. Bạn có thể điền chú thích từng ảnh trước khi bấm nút lưu bên dưới.</p><div id="pending-gallery" class="new-media-list"></div><div id="saved-gallery" class="saved-media"></div></fieldset>`;
  }
  function renderEditor(){
    if(!state.admin)return;
    const kind=state.editorKind;const record=currentRecord()||{};
    $('#editor-title').textContent=state.editorId?`Sửa ${kind==='person'?'hồ sơ thành viên':'bài Phả Ký'}`:`Thêm ${kind==='person'?'thành viên gia phả':'bài Phả Ký'}`;
    $$('.editor-tabs button').forEach(b=>b.classList.toggle('is-active',b.dataset.editKind===kind));
    state.pendingCover=null;state.pendingGallery=[];
    $('#editor-form').innerHTML=(kind==='person'?buildPersonForm(record):buildStoryForm(record))+
      editorMediaMarkup()+`<div class="form-actions"><button type="submit" class="btn btn-primary" id="editor-save">${state.editorId?'Lưu thay đổi và ảnh':'Đăng / lưu tư liệu một lần'}</button><span class="form-note">Hệ thống sẽ tự tạo hồ sơ rồi gắn các ảnh vào đúng người/bài.</span></div><p class="form-status" id="editor-status" role="status" aria-live="polite"></p>`;
    $('#cover-input').addEventListener('change',e=>{state.pendingCover=e.target.files?.[0]||null;showPendingCover()});
    $('#gallery-input').addEventListener('change',e=>{
      const chosen=[...e.target.files||[]];
      if(chosen.length>MAX_BATCH){$('#editor-status').textContent=`Chỉ chọn tối đa ${MAX_BATCH} ảnh mỗi lượt.`;e.target.value='';return}
      if(state.pendingGallery.length+chosen.length>MAX_BATCH){$('#editor-status').textContent=`Số ảnh đang chọn vượt quá ${MAX_BATCH}.`;e.target.value='';return}
      for(const file of chosen)state.pendingGallery.push({file,caption:''});
      e.target.value='';renderPendingGallery();
    });
    showPendingCover();renderPendingGallery();renderSavedMedia();
  }
  function showPendingCover(){
    const el=$('#saved-cover');if(!el)return;
    const name=state.pendingCover?.name;
    if(name)el.innerHTML=`<p class="form-note">Ảnh chính đã chọn: <b>${ESC(name)}</b></p>`;
    else if(!state.editorId)el.innerHTML='<p class="form-note">Chưa chọn ảnh chính.</p>';
    else {
      const asset=assetsFor(state.editorKind,state.editorId,'cover')[0];
      el.innerHTML=asset?`<p class="form-note">Ảnh chính hiện tại: ${ESC(asset.caption||'Đã lưu')}. Chọn tệp mới để thay ảnh chính.</p>`:'<p class="form-note">Chưa có ảnh chính.</p>';
    }
  }
  function renderPendingGallery(){
    const el=$('#pending-gallery');if(!el)return;
    el.innerHTML=state.pendingGallery.map((item,i)=>`<div class="media-draft-item"><span class="draft-name">${i+1}. ${ESC(item.file.name)}</span><label class="form-note">Chú thích ảnh<input type="text" data-pending-caption="${i}" value="${ESC(item.caption)}" placeholder="Ví dụ: Trang 1 – Gia phả bản viết tay"></label><button type="button" data-remove-pending="${i}">Bỏ ảnh này</button></div>`).join('');
    $$('[data-pending-caption]',el).forEach(x=>x.addEventListener('input',()=>{const idx=+x.dataset.pendingCaption;if(state.pendingGallery[idx])state.pendingGallery[idx].caption=x.value}));
    $$('[data-remove-pending]',el).forEach(x=>x.addEventListener('click',()=>{state.pendingGallery.splice(+x.dataset.removePending,1);renderPendingGallery()}));
  }
  function renderSavedMedia(){
    const target=$('#saved-gallery');if(!target)return;
    if(!state.editorId){target.innerHTML='<p class="form-note">Chưa có ảnh đã lưu. Có thể chọn nhiều ảnh ngay lần đăng đầu tiên.</p>';return}
    const assets=assetsFor(state.editorKind,state.editorId,'gallery');
    target.innerHTML=assets.length?'<b class="form-note">Ảnh đã lưu:</b>'+assets.map(a=>`<div class="saved-media-row">${safeImage(a.signedUrl)?`<img src="${ESC(a.signedUrl)}" alt="Ảnh lưu">`:'<span>Ảnh</span>'}<div class="saved-media-copy"><b>${ESC(a.caption||'Chưa có chú thích')}</b><small>Thứ tự ${a.sort_order+1}</small></div><button type="button" data-delete-asset="${ESC(a.id)}">Gỡ</button></div>`).join(''):'<p class="form-note">Bài này chưa có ảnh đính kèm.</p>';
    $$('[data-delete-asset]',target).forEach(btn=>btn.addEventListener('click',()=>removeAsset(btn.dataset.deleteAsset)));
  }
  function renderEditorRecords(){
    const isPerson=state.editorKind==='person';
    const rows=(isPerson?state.people:state.stories).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    $('#editor-records').innerHTML=rows.length?rows.map(r=>`<div class="admin-record"><div><b>${ESC(isPerson?r.full_name:r.title)}</b><span>${r.published?'Đã đánh dấu công bố':'Bản nháp'}${isPerson&&r.is_living&&!r.consent_public?' · Người còn sống – riêng tư':''}</span></div><button type="button" data-edit-id="${ESC(r.id)}">Sửa</button></div>`).join(''):'<p class="form-note">Chưa có dữ liệu trong chuyên mục này.</p>';
    $$('[data-edit-id]',$('#editor-records')).forEach(b=>b.addEventListener('click',()=>{state.editorId=b.dataset.editId;renderEditor();$('.admin-panel').scrollTo({top:0,behavior:'smooth'})}));
  }
  function validateImages(){
    const files=[state.pendingCover?.file||state.pendingCover,...state.pendingGallery.map(x=>x.file)].filter(Boolean);
    if(state.pendingGallery.length>MAX_BATCH)throw Error(`Chỉ chọn tối đa ${MAX_BATCH} ảnh.`);
    for(const file of files)if(!imgExt[file.type]||file.size>MAX_IMAGE||file.size<=0)throw Error(`Ảnh ${file.name} phải là JPEG/PNG/WebP và không quá 6 MB.`);
  }
  function validateParent(id,father,mother){
    if(father&&mother&&father===mother)throw Error('Cha và mẹ không thể là cùng một người.');
    if(id&&(father===id||mother===id))throw Error('Không thể chọn chính mình làm cha hoặc mẹ.');
    // Bảo vệ chống vòng lặp trong gia phả ngay ở giao diện quản trị.
    const ancestors=(target,seen=new Set())=>{
      if(!target||seen.has(target))return false;
      if(target===id)return true;
      seen.add(target);const p=personById(target);if(!p)return false;
      return ancestors(p.father_id,seen)||ancestors(p.mother_id,seen);
    };
    if(id&&(ancestors(father)||ancestors(mother)))throw Error('Quan hệ cha mẹ tạo thành một vòng lặp thế hệ.');
  }
  const strOrNull=v=>v?.trim()||null;
  const numberOrNull=v=>v?.trim()?Number(v):null;
  async function uploadAsset(file,ownerType,ownerId,kind,caption='',sortOrder=0){
    const uid=(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2,14)}`;
    const path=`${ownerType}/${ownerId}/${uid}.${imgExt[file.type]}`;
    const storage=state.db.storage.from(BUCKET);
    const {error:uploadError}=await storage.upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(uploadError)throw new Error(`${file.name}: ${uploadError.message}`);
    const {error:dbError}=await state.db.from('family_assets').insert({owner_type:ownerType,owner_id:ownerId,kind,storage_path:path,caption:caption||null,sort_order:sortOrder});
    if(dbError){await storage.remove([path]).catch(()=>{});throw new Error(`${file.name}: ${dbError.message}`)}
  }
  async function replaceCover(file,ownerType,ownerId){
    await uploadAsset(file,ownerType,ownerId,'cover','',0);
    // Sau khi ảnh mới đã lưu thành công mới gỡ bản cũ; không làm mất ảnh cũ khi upload lỗi.
    const previous=assetsFor(ownerType,ownerId,'cover');
    for(const old of previous){
      const {error}=await state.db.from('family_assets').delete().eq('id',old.id);
      if(!error)await state.db.storage.from(BUCKET).remove([old.storage_path]);
    }
  }
  async function updateUnion(personId,partnerId){
    if(!partnerId)return;
    if(personId===partnerId)throw Error('Không thể tự liên kết phối ngẫu với chính mình.');
    const found=state.unions.some(u=>(u.person_a_id===personId&&u.person_b_id===partnerId)||(u.person_a_id===partnerId&&u.person_b_id===personId));
    if(found)return;
    const {error}=await state.db.from('family_unions').insert({person_a_id:personId,person_b_id:partnerId});if(error)throw error;
  }
  async function saveEditor(e){
    e.preventDefault();if(!state.admin||state.actionBusy)return;
    const form=e.currentTarget,kind=state.editorKind,editing=state.editorId;
    const fd=new FormData(form), get=name=>String(fd.get(name)||'').trim();
    const published=fd.has('published');
    let data={},partnerId='';
    try {
      validateImages();
      if(kind==='person'){
        const living=fd.has('is_living'),consent=fd.has('consent_public');
        if(living&&published&&!consent)throw Error('Để công bố hồ sơ người còn sống, phải đánh dấu sự chấp thuận. Hoặc bỏ chọn “Công bố” để lưu riêng tư.');
        const birth=numberOrNull(get('birth_year')),death=numberOrNull(get('death_year'));
        if((birth&&(!Number.isInteger(birth)||birth<1400||birth>2100))||(death&&(!Number.isInteger(death)||death<1400||death>2100)))throw Error('Năm sanh – mất chưa hợp lệ.');
        if(birth&&death&&death<birth)throw Error('Năm mất không thể sớm hơn năm sanh.');
        const father=strOrNull(get('father_id')),mother=strOrNull(get('mother_id'));
        validateParent(editing,father,mother);
        data={full_name:get('full_name'),alias:strOrNull(get('alias')),gender:strOrNull(get('gender')),branch:strOrNull(get('branch')),birth_year:birth,death_year:death,father_id:father,mother_id:mother,biography:strOrNull(get('biography')),sources:strOrNull(get('sources')),date_notes:strOrNull(get('date_notes')),is_living:living,consent_public:consent};
        partnerId=get('partner_id');
        if(partnerId===editing)throw Error('Không thể gắn chính mình làm phối ngẫu.');
        if(!data.full_name)throw Error('Bạn chưa nhập họ tên.');
      }else{
        data={title:get('title'),category:get('category')||'Gia sử',summary:strOrNull(get('summary')),body:get('body'),sources:strOrNull(get('sources')),related_person_id:strOrNull(get('related_person_id'))};
        if(!data.title||!data.body)throw Error('Bài Phả Ký cần có tiêu đề và nội dung.');
      }
    }catch(error){$('#editor-status').textContent='Chưa thể lưu: '+error.message;return}
    const button=$('#editor-save'),status=$('#editor-status');button.disabled=true;state.actionBusy=true;
    let id=editing;
    try{
      if(!id){
        status.textContent='Đang tạo bản nháp để gắn ảnh…';
        const table=kind==='person'?'family_people':'family_stories';
        const {data:row,error}=await state.db.from(table).insert({...data,published:false}).select('id').single();
        if(error)throw error;
        id=row.id;state.editorId=id;
      }else{
        // Với bài đang công bố: vẫn giữ trạng thái công khai cũ trong quá trình tải ảnh.
        const table=kind==='person'?'family_people':'family_stories';
        const {error}=await state.db.from(table).update(data).eq('id',id);
        if(error)throw error;
      }
      if(kind==='person'&&partnerId){status.textContent='Đang nối quan hệ phối ngẫu…';await updateUnion(id,partnerId)}
      if(state.pendingCover){status.textContent='Đang tải di ảnh / ảnh bìa chính…';await replaceCover(state.pendingCover,kind,id);state.pendingCover=null}
      const galleryCount=state.pendingGallery.length;
      let nextSort=assetsFor(kind,id,'gallery').reduce((max,a)=>Math.max(max,(a.sort_order||0)+1),0);
      for(let i=0;i<galleryCount;i++){
        const pending=state.pendingGallery[0];
        status.textContent=`Đang tải hình ảnh ${i+1}/${galleryCount}: ${pending.file.name}. Đừng đóng trang.`;
        await uploadAsset(pending.file,kind,id,'gallery',pending.caption,nextSort++);
        state.pendingGallery.shift();
      }
      status.textContent='Đang hoàn tất bài viết và quyền công bố…';
      const table=kind==='person'?'family_people':'family_stories';
      const {error}=await state.db.from(table).update({published}).eq('id',id);
      if(error)throw error;
      await loadData();state.editorId=null;renderEditor();
      toast(published?'Đã công bố bài và bộ ảnh thành công.':'Đã lưu bản nháp và bộ ảnh thành công.');
    }catch(error){
      status.textContent=`Chưa hoàn tất: ${error.message||error}. ${id?'Hồ sơ đã được lưu; bạn có thể bấm lại để tải những ảnh còn thiếu, không tạo hồ sơ trùng.':''}`;
      console.error('[Gia phả] Lỗi lưu:',error);
      // Không reset form; bảo toàn danh sách ảnh chưa tải để thử lại.
      if(id){state.editorId=id;await loadData();showPendingCover();renderPendingGallery();renderSavedMedia();renderEditorRecords()}
    }finally{state.actionBusy=false;button.disabled=false}
  }
  async function removeAsset(id){
    if(!state.admin||state.actionBusy)return;
    if(!confirm('Gỡ ảnh này khỏi hồ sơ? Thao tác không thể hoàn tác.'))return;
    const asset=state.assets.find(a=>a.id===id);if(!asset)return;
    try{
      const {error}=await state.db.from('family_assets').delete().eq('id',id);if(error)throw error;
      await state.db.storage.from(BUCKET).remove([asset.storage_path]);
      await loadData();renderSavedMedia();toast('Đã gỡ ảnh khỏi hồ sơ.');
    }catch(error){toast('Không gỡ được: '+error.message)}
  }

  function bindEvents(){
    $('#year').textContent=new Date().getFullYear();
    $('#menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open))});
    $$('#main-nav a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false')}));
    $('#tree-branch').addEventListener('change',e=>{state.branch=e.target.value;renderTree()});
    $('#tree-search').addEventListener('input',e=>{state.query=e.target.value;renderTree();const hit=$('.tree-person.search-hit');if(hit&&state.query.trim())hit.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})});
    const setZoom=value=>{state.treeZoom=Math.max(.65,Math.min(1.65,Math.round(value*100)/100));$('#zoom-label').textContent=Math.round(state.treeZoom*100)+'%';$('#tree-canvas').style.zoom=state.treeZoom;requestAnimationFrame(drawTreeEdges)};
    $('#zoom-in').addEventListener('click',()=>setZoom(state.treeZoom+.15));
    $('#zoom-out').addEventListener('click',()=>setZoom(state.treeZoom-.15));
    $('#zoom-reset').addEventListener('click',()=>setZoom(1));
    window.addEventListener('resize',()=>requestAnimationFrame(drawTreeEdges));
    $$('#story-filters button').forEach(b=>b.addEventListener('click',()=>{state.storyFilter=b.dataset.storyFilter;$$('#story-filters button').forEach(x=>x.classList.toggle('is-active',x===b));renderStories()}));
    document.addEventListener('click',e=>{
      const el=e.target;if(!(el instanceof Element))return;
      if(el.closest('[data-close-image]')){closeImage();return}
      const close=el.closest('[data-close]');if(close){closeOverlay(close.dataset.close);return}
      const portrait=el.closest('[data-view-image]');if(portrait){openImage(portrait.dataset.viewImage);return}
      const p=el.closest('[data-open-person]');if(p){openPerson(p.dataset.openPerson);return}
      const s=el.closest('[data-open-story]');if(s){openStory(s.dataset.openStory);return}
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#image-lightbox'))closeImage();else if(!$('#detail-overlay').hidden)closeOverlay('detail');else if(!$('#admin-overlay').hidden)closeOverlay('admin')}});
    $('#admin-open').addEventListener('click',()=>{openOverlay('admin');if(state.admin)renderEditor()});
    $('#login-form').addEventListener('submit',login);
    $('#logout-button').addEventListener('click',async()=>{if(state.db)await state.db.auth.signOut();state.admin=false;state.user=null;syncAdminUI();closeOverlay('admin');await loadData();toast('Đã đăng xuất')});
    $$('.editor-tabs button').forEach(b=>b.addEventListener('click',()=>{if(state.actionBusy)return;state.editorKind=b.dataset.editKind;state.editorId=null;renderEditor();renderEditorRecords()}));
    $('#editor-new').addEventListener('click',()=>{if(state.actionBusy)return;state.editorId=null;renderEditor()});
    $('#editor-form').addEventListener('submit',saveEditor);
    const sections=$$('main section[id]');
    if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;$$('#main-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}),{rootMargin:'-20% 0px -65% 0px'});sections.forEach(s=>io.observe(s))}
  }
  bindEvents();initDB();
})();
