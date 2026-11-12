/* Presentation only: reuse the original inputs, handlers and per-template state. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function init() {
    const app = document.querySelector('.app');
    const picker = document.querySelector('.watermark-card');
    const upload = document.querySelector('.upload-card');
    const preview = document.querySelector('.preview-card');
    const form = document.querySelector('.form-card');
    const settings = document.querySelector('.settings-card');
    const summaryUpdates = [];
    let activeEdit = null;
    const dialog = make('dialog', 'editor-sheet');
    dialog.setAttribute('aria-labelledby', 'editorSheetTitle');
    const head = make('div', 'editor-sheet-head');
    const heading = make('h2', ''); heading.id = 'editorSheetTitle';
    const done = make('button', 'editor-done', 'Xong'); done.type = 'button';
    const body = make('div', 'editor-sheet-body');
    head.append(heading, done); dialog.append(head, body); app.append(dialog);
    function refresh() { summaryUpdates.forEach(fn => fn()); }
    function restore() {
      if (!activeEdit) return;
      const previous = activeEdit; activeEdit = null;
      previous.marker.replaceWith(previous.panel);
      body.replaceChildren();
      document.body.classList.remove('editor-sheet-open');
      refresh(); previous.trigger.focus({preventScroll:true});
    }
    done.addEventListener('click', () => { dialog.close(); restore(); });
    dialog.addEventListener('close', () => { if (!dialog.open) restore(); });
    dialog.addEventListener('click', e => { if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientX < rect.left || e.clientX > rect.right) dialog.close();
    }});
    function open(panel, title, trigger, quick) {
      if (activeEdit) { dialog.close(); restore(); }
      const marker = document.createComment('editor-panel');
      panel.before(marker); activeEdit = {panel, marker, trigger};
      heading.textContent = title;
      if (quick) {
        const button = make('button', 'editor-quick', quick.label); button.type = 'button';
        button.addEventListener('click', quick.action); body.append(button);
      }
      body.append(panel); document.body.classList.add('editor-sheet-open');
      dialog.showModal(); done.focus({preventScroll:true});
    }
    function row(container, title, panel, summary, toggle, quick) {
      panel.classList.add('editor-source');
      const item = make('div', 'editor-item');
      const button = make('button', 'editor-edit'); button.type = 'button';
      button.setAttribute('aria-haspopup','dialog');
      const label = make('span', 'editor-item-label', title);
      const value = make('span', 'editor-item-value');
      const arrow = make('span', 'editor-chevron', '›'); arrow.setAttribute('aria-hidden','true');
      button.append(label, value, arrow);
      button.addEventListener('click', () => open(panel, title, button, quick));
      item.append(button);
      if (toggle) item.append(toggle);
      container.append(item);
      summaryUpdates.push(() => { value.textContent = summary() || 'Chưa nhập'; });
      return item;
    }
    const val = id => $(id)?.value.trim() || '';
    const timeSummary = prefix => [val(prefix ? 'attendanceTime':'time'), val(prefix ? 'attendanceDate':'date')].filter(Boolean).join(' · ');
    const quickTime = {label:'Lấy giờ thực tế', action:() => { setNow(); refresh(); }};
    const quickGPS = {label:'Lấy vị trí GPS', action:() => getGPS()};
    // Keep the original form nodes and event listeners; only move them while editing.
    const premium = $('formPremium');
    const grid = premium.querySelector('.infoGrid');
    const premiumList = make('div', 'editor-list'); premium.prepend(premiumList);
    const times = make('div','editor-field-group'); grid.prepend(times);
    ['time','date','weekday'].forEach(id => times.append($(id).parentElement));
    row(premiumList, 'Thời gian', times, () => timeSummary(false), null, quickTime);
    row(premiumList, 'Vị trí', $('address').parentElement, () => val('address'), null, quickGPS);
    row(premiumList, 'Họ tên', $('fullname').parentElement, () => val('fullname'));
    const note = $('extraNote').closest('.note-control');
    row(premiumList, 'Ghi chú', note, () => val('extraNote') || 'Thêm ghi chú');
    const logo = $('logoInput').closest('[data-template-one-only]');
    row(premiumList, 'Logo', logo, () => $('logoInput').files[0]?.name || 'Chọn logo');
    const advanced = make('details','editor-more'); advanced.append(make('summary','','Tùy chỉnh thêm')); premium.append(advanced);
    const originalAdvanced = $('advancedPanel').parentElement;
    row(advanced, 'Thành phần hiển thị', originalAdvanced, () => 'Bật / tắt từng thành phần');
    const attendance = $('formAttendance');
    const attendanceList = make('div', 'editor-list'); attendance.prepend(attendanceList);
    const extra = make('details','editor-more'); extra.append(make('summary','','Tùy chỉnh thêm')); attendance.append(extra);
    const specs = [
      ['Title','Tiêu đề',() => val('attendanceLabel')],
      ['Time','Thời gian',() => timeSummary(true),quickTime],
      ['Address','Vị trí',() => val('attendanceAddress'),quickGPS],
      ['Logo','Logo',() => $('attendanceLogoSummary').textContent],
      ['Map','Bản đồ',() => $('attendanceMapSummary').textContent],
      ['Art','Kiểu chữ nghệ thuật',() => $('attendanceArtStyle').selectedOptions[0].textContent],
      ['Tags','Thẻ',() => val('attendanceTags')],
      ['Coordinates','Tọa độ',() => [val('attendanceLatitude'),val('attendanceLongitude')].filter(Boolean).join(', ')]
    ];
    for (const [key, title, summary, quick] of specs) {
      const input = $('attendanceToggle'+key);
      const toggle = input.closest('.attendance-switch');
      const originalRow = toggle.parentElement;
      const secondary = ['Art','Tags','Coordinates'].includes(key);
      row(secondary ? extra : attendanceList, title, $('attendance'+key+'Fields'),
        () => input.checked ? summary() : 'Đang tắt', toggle, quick);
      originalRow.classList.add('editor-source');
    }
    const ancillary = attendance.querySelector('.attendance-extra');
    // The containing details is opened only inside the sheet.
    ancillary.open = true;
    row(extra, 'Thành phần phụ & màu', ancillary, () => 'Mã ảnh, thương hiệu, dòng cam kết');
    const size = settings.querySelector('.scale-control');
    row(extra, 'Kích thước thông tin', size, () => $('wmScaleSlider').value+'%');
    // One original slider is shared by the existing host; its value is restored by template switching.
    const sizeButton = make('button','editor-size','Kích thước thông tin'); sizeButton.type='button';
    sizeButton.addEventListener('click', () => open(size, 'Kích thước thông tin', sizeButton)); advanced.append(sizeButton);
    document.querySelectorAll('.style-option').forEach(button => {
      button.querySelector('strong').textContent = button.dataset.style === 'v3' ? 'Mẫu 1' : 'Mẫu 2';
      button.addEventListener('click', () => { refresh(); updateTabs(); });
    });
    function updateTabs() {
      document.querySelectorAll('.style-option').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
    }
    $('wmStyle').addEventListener('change', () => {refresh(); updateTabs();});
    const observer = new MutationObserver(refresh);
    ['attendanceLogoSummary','attendanceMapSummary'].forEach(id => observer.observe($(id),{childList:true,characterData:true,subtree:true}));
    app.addEventListener('input', refresh); app.addEventListener('change', refresh);
    // Restore layout order without replacing any image/canvas element.
    app.querySelector('.header-app').after(picker);
    picker.after(upload); upload.after(preview); preview.after(form);
    upload.querySelector('.section-title').textContent='Ảnh của bạn';
    const empty = make('p','editor-empty','Chọn ảnh để xem trước'); preview.prepend(empty);
    $('imageInput').addEventListener('change', () => { if ($('imageInput').files.length) empty.hidden=true; });
    const fileLabel = upload.querySelector('label'); fileLabel.textContent='Chọn ảnh / Đổi ảnh';
    form.querySelector('.section-title').textContent='Chỉnh sửa thông tin';
    document.querySelector('.btn-secondary-action').textContent='Lưu ảnh';
    app.classList.add('compact-editor'); refresh(); updateTabs();
  }
  window.addEventListener('load', init);
})();
