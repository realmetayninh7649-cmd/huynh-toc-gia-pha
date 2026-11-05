/* GIA PHẢ HỌ HUỲNH — NÂNG CẤP QUAN HỆ GIA ĐÌNH & BIỂU MẪU TINH GỌN
 * Cài một lần: <script src="./gia-pha-lien-ket-gia-dinh.js"></script>
 * Đặt dưới khối <script> ứng dụng gốc, ngay trước </body> của index.html.
 * Không thay đổi dữ liệu, bảng Supabase, hoặc các chức năng khác.
 */
(function () {
  'use strict';

  const css = `
.gp-family-panel{margin-top:26px;border:1px solid #e2d2b9;border-radius:8px;background:#fffaf0;padding:18px 20px}
.gp-family-panel>h3{margin:0 0 12px!important}.gp-family-block{padding:12px 0;border-top:1px solid #eadfcf}
.gp-family-block>strong{display:block;color:#7c3537;font:700 13px var(--serif);margin-bottom:7px}
.gp-family-people{display:grid;gap:7px}.gp-family-person{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.gp-family-person>button:first-child{border:0;background:transparent;text-align:left;padding:3px 0;color:var(--wine);font:650 13px var(--serif)}
.gp-family-person small{font:400 10px var(--sans);color:#94785b}.gp-family-empty{font-size:12px;color:#948778}
.gp-family-person .gp-mini-edit{border:1px solid #dec5a7;border-radius:5px;background:#fffdf8;padding:5px 9px;color:#805b41;font-size:11px}
.gp-family-toolbar{margin:10px 0}.gp-family-chooser{padding:12px;background:#f7efdf;border-radius:6px}
.gp-family-chooser>label{display:block;font-size:11px;font-weight:650;color:#756350;margin-bottom:7px}
.gp-family-chooser-row{display:flex;gap:8px;align-items:stretch;min-width:0}
.gp-family-chooser-row select{min-width:0;flex:1;font-size:12px;background:#fffdf8}.gp-family-chooser-row button{flex-shrink:0}
.gp-family-relation-label{margin-top:9px}.gp-family-relation-label select{max-width:230px;margin-top:5px}
.gp-simple-form .gp-form-caption{grid-column:1/-1;font:700 14px var(--serif);color:var(--wine);margin-top:2px}
.gp-form-section{grid-column:1/-1;border:1px solid #e1d5c2;border-radius:7px;overflow:hidden;background:#fffdfa}
.gp-form-section summary{cursor:pointer;padding:13px 16px;font-size:13px;font-weight:700;color:#6e342f;background:#f7f0e4}
.gp-form-section summary small{font-size:10px;font-weight:500;color:#91806d;margin-left:8px}
.gp-form-section[open] summary{border-bottom:1px solid #e9dcc8}
.gp-form-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:16px}
.gp-form-fields>.full{grid-column:1/-1}.gp-form-fields .gp-media-editor{padding:0;border:0;background:none}
.gp-draft-note{grid-column:1/-1;border-left:3px solid #b58e4c;background:#faf2df;margin:0;padding:10px 12px;font-size:12px;color:#69563e}
.gp-simple-form .form-textarea{min-height:95px}
@media(max-width:600px){.gp-family-panel{padding:14px 13px}.gp-family-chooser-row{flex-direction:column}
.gp-family-chooser-row button{align-self:flex-start}.gp-form-fields{grid-template-columns:1fr;gap:12px;padding:12px}
.gp-form-fields>.form-field{grid-column:1/-1}.gp-form-section summary small{display:block;margin-left:0;margin-top:2px}
.gp-simple-form{grid-template-columns:1fr;gap:12px}.gp-simple-form>.form-field{grid-column:1/-1}
.gp-simple-form .gp-form-section{grid-column:1/-1}.gp-family-person{align-items:flex-start}}
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  let familyDraftData = null;
  function selectOptions(exceptId) {
    return optionList('', state.persons.filter(p => p.id !== exceptId).sort(byName).map(p => ({
      value: p.id,
      label: p.name + ' · Đời ' + generation(p.id) + (p.born ? ' · ' + p.born : '')
    })), '— Chọn thành viên đã có —');
  }
  function draftFor(anchor, relation) {
    if (relation === 'spouse') return {spouseId: anchor.id, gender: anchor.gender === 'Nam' ? 'Nữ' : anchor.gender === 'Nữ' ? 'Nam' : ''};
    const side = anchor.gender === 'Nữ' ? 'motherId' : 'fatherId';
    return {[side]: anchor.id, branch: anchor.branch || '', place: anchor.place || ''};
  }

  // Chỉ thay bố cục của cửa sổ hồ sơ; các hồ sơ hiện có vẫn lưu nguyên.
  window.detailPerson = function detailPerson(id) {
    const p = person(id);
    if (!p) return;
    const children = state.persons.filter(q => q.fatherId === id || q.motherId === id).sort(byName);
    const parents = [p.fatherId, p.motherId].filter(Boolean);
    const fields = [
      ['Thế thứ', 'Đời ' + generation(id)],
      ['Năm sanh', p.born], ['Năm mất / qui vị', p.died],
      ['Ngày sanh Âm lịch', p.birthLunar], ['Ngày mất Âm lịch', p.deathLunar],
      ['Quê quán', p.place], ['Chi phái', p.branch], ['Nơi an táng', p.burial],
      ['Chức phận', p.role], ['Tình trạng khảo chứng', p.verification], ['Nguồn dẫn', p.source]
    ].filter(([k, v]) => v !== undefined && v !== null && String(v).trim() !== '');
    const memberLine = q => `<div class="gp-family-person"><button type="button" data-detail-person="${safe(q.id)}">${safe(q.name)} <small>· Đời ${generation(q.id)}</small></button>${isAdmin() ? `<button type="button" class="gp-mini-edit" data-edit-person="${safe(q.id)}">Sửa hồ sơ</button>` : ''}</div>`;
    const sp = person(p.spouseId);
    const familyPanel = `<section class="gp-family-panel"><h3>Gia đình và các mối liên hệ</h3>
      <div class="gp-family-block"><strong>Phụ thân – Mẫu thân</strong><div class="gp-family-people">${parents.length ? parents.map(pid => person(pid)).filter(Boolean).map(memberLine).join('') : '<span class="gp-family-empty">Chưa ghi</span>'}</div></div>
      <div class="gp-family-block"><strong>Vợ / chồng</strong><div class="gp-family-people">${sp ? memberLine(sp) : '<span class="gp-family-empty">Chưa ghi</span>'}</div>
      ${isAdmin() ? `<div class="gp-family-toolbar"><button type="button" class="btn btn-outline btn-small" data-family-create="spouse" data-family-person="${safe(id)}">+ Tạo hồ sơ vợ/chồng</button></div>
      <div class="gp-family-chooser"><label for="gp-family-spouse-select">Hoặc liên kết người đã có trong gia phả</label><div class="gp-family-chooser-row"><select class="form-input" id="gp-family-spouse-select">${selectOptions(id)}</select><button type="button" class="btn btn-primary btn-small" data-family-link="spouse" data-family-person="${safe(id)}">Liên kết</button></div></div>` : ''}</div>
      <div class="gp-family-block"><strong>Con cái ${children.length ? '(' + children.length + ')' : ''}</strong><div class="gp-family-people">${children.length ? children.map(memberLine).join('') : '<span class="gp-family-empty">Chưa ghi</span>'}</div>
      ${isAdmin() ? `<div class="gp-family-toolbar"><button type="button" class="btn btn-outline btn-small" data-family-create="child" data-family-person="${safe(id)}">+ Tạo hồ sơ con</button></div>
      <div class="gp-family-chooser"><label for="gp-family-child-select">Hoặc liên kết người con đã có trong gia phả</label><div class="gp-family-chooser-row"><select class="form-input" id="gp-family-child-select">${selectOptions(id)}</select><button type="button" class="btn btn-primary btn-small" data-family-link="child" data-family-person="${safe(id)}">Liên kết</button></div>
      <label class="gp-family-relation-label" for="gp-family-parent-role">Vai trò của thành viên đang xem:<select class="form-input" id="gp-family-parent-role"><option value="fatherId" ${p.gender === 'Nữ' ? '' : 'selected'}>Phụ thân (cha)</option><option value="motherId" ${p.gender === 'Nữ' ? 'selected' : ''}>Mẫu thân (mẹ)</option></select></label></div>` : ''}</div>
      </section>`;
    const stories = state.stories.filter(s => s.personId === id);
    const img = urlSafe(p.photo);
    openDetail(`<div class="detail-top"><span class="overline">HỒ SƠ GIA PHẢ · ĐỜI ${generation(id)}</span><h2>${safe(p.name)}</h2><p>${safe(years(p))}</p></div>
      <div class="detail-body">${img ? `<img class="detail-photo" src="${safe(img)}" alt="Chân dung ${safe(p.name)}">` : ''}
      <div class="detail-grid">${fields.map(([k, v]) => `<div class="detail-field"><label>${safe(k)}</label><div>${safe(v)}</div></div>`).join('')}</div>
      ${familyPanel}
      ${p.bio ? `<h3>Tiểu sử và ghi chép</h3><div class="detail-biography">${safe(p.bio)}</div>` : ''}
      ${galleryHtml('persons', id)}
      ${stories.length ? `<h3>Bài phả ký liên hệ</h3><div class="related-links">${stories.map(s => `<button type="button" data-detail-story="${safe(s.id)}">${safe(s.title)}</button>`).join('')}</div>` : ''}
      ${isAdmin() ? `<div class="detail-actions"><button class="btn btn-primary" data-edit-person="${safe(id)}">Chỉnh sửa hồ sơ</button></div>` : ''}</div>`);
  };

  // Nút "Tạo" mở biểu mẫu với quan hệ sẵn có; nút "Liên kết" chỉ sửa đúng quan hệ đã chọn.
  async function linkFamilyMember(anchorId, relation) {
    if (!isAdmin()) return toast('Cần đăng nhập quản trị để liên kết gia phả.');
    const anchor = person(anchorId);
    const select = document.getElementById(relation === 'spouse' ? 'gp-family-spouse-select' : 'gp-family-child-select');
    const target = person(select && select.value);
    if (!anchor || !target) return toast('Hãy chọn một thành viên có sẵn trong danh sách.');
    if (anchor.id === target.id) return toast('Không thể tự liên kết với chính mình.');
    try {
      if (relation === 'spouse') {
        if (anchor.spouseId === target.id) return toast('Hai hồ sơ đã liên kết vợ chồng.');
        if ((anchor.spouseId && anchor.spouseId !== target.id) || (target.spouseId && target.spouseId !== anchor.id)) {
          if (!confirm('Một trong hai hồ sơ đã có phối ngẫu. Thay đổi liên kết vợ chồng hiện tại?')) return;
        }
        await savePersonRecord({...anchor, spouseId: target.id});
      } else if (relation === 'child') {
        const side = document.getElementById('gp-family-parent-role')?.value;
        if (!['fatherId', 'motherId'].includes(side)) return toast('Hãy chọn vai trò phụ thân hoặc mẫu thân.');
        if (target[side] === anchor.id) return toast('Hồ sơ này đã ghi quan hệ cha/mẹ – con.');
        if (target[side] && target[side] !== anchor.id) throw Error('Ô cha hoặc mẹ của người được chọn đã có tên khác. Hãy mở hồ sơ người con để khảo chứng và điều chỉnh trước');
        const updated = {...target, [side]: anchor.id};
        if (updated.fatherId && updated.fatherId === updated.motherId) throw Error('Không thể ghi một người vào cả hai vai trò cha và mẹ');
        await savePersonRecord(updated);
      } else return;
      if (cloud) await loadCloud(); else renderAll();
      window.detailPerson(anchor.id);
      toast('Đã lưu liên kết gia đình vào gia phả.');
    } catch (err) {
      toast('Chưa lưu được: ' + err.message);
    }
  }

  // Giữ nguyên tên trường dữ liệu. Các trường ít dùng được thu vào details, KHÔNG bị loại bỏ.
  window.personForm = function personForm(p) {
    const x = p || familyDraftData || {};
    const choices = personOptions(x.id, x.fatherId), mchoices = personOptions(x.id, x.motherId), schoices = personOptions(x.id, x.spouseId);
    const linkedDraft = !p && (x.fatherId || x.motherId || x.spouseId);
    return `<h2>${p ? 'Chỉnh sửa' : 'Ghi thêm'} thành viên gia phả</h2><p class="admin-subtitle">Chỉ cần họ tên để bắt đầu; những mục chưa rõ có thể bổ sung sau.</p>
    <form class="editor-form gp-simple-form" id="editor-form" data-kind="person"><input type="hidden" name="id" value="${safe(x.id || '')}">
    ${linkedDraft ? `<p class="gp-draft-note">Đã chuẩn bị liên kết gia đình theo hồ sơ vừa chọn. Kiểm tra hoặc đổi lại tại mục “Quan hệ & thế thứ” bên dưới.</p>` : ''}
    <div class="gp-form-caption">Thông tin căn bản</div>
    ${field('Họ và tên *', 'name', x.name, {required: true})}
    ${field('Nam / Nữ', 'gender', null, {select: optionList(x.gender, [{value: 'Nam', label: 'Nam'}, {value: 'Nữ', label: 'Nữ'}, {value: 'Khác', label: 'Khác / chưa rõ'}])})}
    ${field('Năm sanh / ngày sanh', 'born', x.born)}
    ${field('Năm mất / ngày qui vị', 'died', x.died)}
    ${field('Quê quán', 'place', x.place, {full: true})}
    <details class="gp-form-section" ${linkedDraft ? 'open' : ''}><summary>Quan hệ gia đình & thế thứ <small>Cha mẹ, vợ chồng, chi nhánh</small></summary><div class="gp-form-fields">
      ${field('Phụ thân', 'fatherId', null, {select: choices})}
      ${field('Mẫu thân', 'motherId', null, {select: mchoices})}
      ${field('Vợ / chồng', 'spouseId', null, {select: schoices})}
      ${field('Chi / nhánh', 'branch', x.branch)}
      ${field('Chức phận, vai vế', 'role', x.role)}
      ${field('Đời khởi đầu', 'startGeneration', x.startGeneration || '', {type: 'number', hint: 'Chỉ ghi khi chưa biết cha mẹ; để trống sẽ là đời 1.'})}
    </div></details>
    <details class="gp-form-section"><summary>Thông tin bổ sung <small>Âm lịch, an táng, khảo chứng, ghi chép</small></summary><div class="gp-form-fields">
      ${field('Ngày sanh Âm lịch', 'birthLunar', x.birthLunar)}
      ${field('Ngày mất Âm lịch', 'deathLunar', x.deathLunar)}
      ${field('Nơi an táng', 'burial', x.burial, {full: true})}
      ${field('Ảnh chân dung (URL https://...)', 'photo', x.photo, {full: true})}
      ${field('Tiểu sử và ghi chép', 'bio', x.bio, {long: true, full: true, rows: 5})}
      ${field('Nguồn tài liệu / người cung cấp', 'source', x.source, {long: true, full: true, rows: 2})}
      ${field('Mức độ khảo chứng', 'verification', null, {select: optionList(x.verification, [{value: 'Đang đối chiếu', label: 'Đang đối chiếu'}, {value: 'Có tư liệu gốc', label: 'Có tư liệu gốc'}, {value: 'Gia đình lưu truyền', label: 'Gia đình lưu truyền'}])})}
    </div></details>
    <details class="gp-form-section"><summary>Hình ảnh, PDF đính kèm <small>Tùy chọn</small></summary><div class="gp-form-fields">${mediaInputPanel('persons', x.id)}</div></details>
    <div class="form-field full gp-privacy-controls">
      <label class="form-check"><input type="checkbox" name="living" ${x.living !== undefined ? (x.living ? 'checked' : '') : (!x.died ? 'checked' : '')}> Người còn sống hoặc chưa xác nhận đã mất</label>
      <label class="form-check"><input type="checkbox" name="consentPublic" ${x.consentPublic === true ? 'checked' : ''}> Đã được người còn sống đồng ý công khai</label>
      <label class="form-check"><input type="checkbox" name="public" ${x.public === true ? 'checked' : ''}> Công khai hồ sơ cho người xem</label>
      <small class="form-hint">Thông tin người còn sống được giữ riêng, trừ khi có sự đồng ý. Quyền truy cập được kiểm soát bằng Supabase RLS.</small>
    </div>${editorActions(Boolean(p))}</form>`;
  };

  const nativeOpenEdit = window.openEdit;
  window.openEdit = function (kind, id, draft) {
    familyDraftData = draft || null;
    return nativeOpenEdit(kind, id);
  };

  // Lắng nghe ở pha capture để không cần thay đổi mã các bộ phận khác của ứng dụng.
  document.addEventListener('click', async function (event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.matches('[data-family-create]')) {
      event.preventDefault(); event.stopPropagation();
      const anchor = person(button.dataset.familyPerson);
      if (anchor && isAdmin()) window.openEdit('person', null, draftFor(anchor, button.dataset.familyCreate));
      return;
    }
    if (button.matches('[data-family-link]')) {
      event.preventDefault(); event.stopPropagation();
      button.disabled = true;
      try { await linkFamilyMember(button.dataset.familyPerson, button.dataset.familyLink); }
      finally { button.disabled = false; }
      return;
    }
    if (button.matches('[data-go], [data-view], [data-edit-tab], [data-edit-record], #cancel-edit')) familyDraftData = null;
  }, true);
  document.addEventListener('submit', function (event) {
    if (event.target?.id === 'editor-form') familyDraftData = null;
  }, true);
})();
