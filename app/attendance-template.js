/* Template 2 owns its inputs, assets, switches and drawing. Template 1 is not used here. */
(() => {
  'use strict';
  const scriptURL = new URL('.', document.currentScript.src);
  const byId = id => document.getElementById(id);
  const value = id => (byId(id)?.value || '').trim();
  const checked = id => !!byId(id)?.checked;
  let logoImage = null;
  let mapImage = null;
  let fontsReady;
  let activeStyle = null;
  let imageRevision = null;
  let gpsRequest = 0;
  const snapshots = new Map();
  const pendingAssets = new Map();
  const assetRevisions = new Map();
  const flags = ['Logo', 'Title', 'Art', 'Tags', 'Time', 'Address', 'Coordinates', 'Map', 'Vertical', 'Brand', 'Commitment'];

  async function ready() {
    if (!fontsReady) {
      fontsReady = Promise.all([
        ['AttendanceText', 'RobotoCondensed.ttf'], ['AttendanceClock', 'Oswald.ttf']
      ].map(async ([family, file]) => {
        const font = new FontFace(family, `url("${new URL('attendance-assets/' + file, scriptURL)}")`, {weight: '100 900'});
        document.fonts.add(await font.load());
      })).catch(error => { fontsReady = null; throw error; });
    }
    await fontsReady;
    await Promise.all(pendingAssets.values());
  }

  function status(text, error = false) {
    const el = byId('attendanceStatus');
    el.textContent = text;
    el.classList.toggle('is-error', error);
  }

  function syncControls() {
    for (const name of flags) {
      const panel = byId('attendance' + name + 'Fields');
      if (panel) panel.hidden = !checked('attendanceToggle' + name);
    }
    byId('attendanceLogoSummary').textContent = logoImage ? 'Đã thêm' : 'Chưa chọn logo';
    byId('attendanceMapSummary').textContent = mapImage ? 'Đã thêm' : 'Chưa chọn ảnh bản đồ';
  }

  function changed() {
    syncControls();
    if (getWMStyle() !== 'attendance') {
      const saved = snapshots.get('attendance');
      if (saved?.hasGenerated) saved.data = capture(saved.data.photoCode);
      return;
    }
    if (hasGenerated) {
      generatedData = capture(generatedData.photoCode);
      renderCanvas();
    }
  }

  function newPhotoCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, n => alphabet[n % alphabet.length]).join('');
  }

  function capture(photoCode) {
    const switches = {};
    for (const name of flags) switches[name.toLowerCase()] = checked('attendanceToggle' + name);
    return {
      time: value('attendanceTime'), date: value('attendanceDate'), weekday: value('attendanceWeekday'),
      attendanceLabel: value('attendanceLabel') || 'Điểm danh', address: value('attendanceAddress'),
      tags: value('attendanceTags'), latitude: value('attendanceLatitude'), longitude: value('attendanceLongitude'),
      artStyle: value('attendanceArtStyle'), accent: value('attendanceColor') || '#ffc533',
      switches, photoCode: photoCode || newPhotoCode(), fullname: '', extraNote: ''
    };
  }

  function saveHostState() {
    return {x: wmX, y: wmY, scale: wmScale, hasGenerated, data: generatedData};
  }

  function switchStyle(nextStyle) {
    if (imageRevision !== img.src) {
      snapshots.clear();
      imageRevision = img.src;
    }
    if (activeStyle) snapshots.set(activeStyle, saveHostState());
    if (activeStyle && activeStyle !== nextStyle) {
      const saved = snapshots.get(nextStyle);
      wmX = saved?.x || 0; wmY = saved?.y || 0; wmScale = saved?.scale || 1;
      hasGenerated = !!saved?.hasGenerated;
      generatedData = saved?.data || {};
      byId('wmScaleSlider').value = Math.round(wmScale * 100);
      byId('scaleDisplay').textContent = Math.round(wmScale * 100);
      isDraggingWM = false;
    }
    activeStyle = nextStyle;
    const attendance = nextStyle === 'attendance';
    document.querySelectorAll('[data-template-one-only]').forEach(el => { el.hidden = attendance; });
    document.body.classList.toggle('attendance-active', attendance);
    syncControls();
  }

  async function readAsset(kind, file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { status('Vui lòng chọn một tệp ảnh.', true); return; }
    const revision = (assetRevisions.get(kind) || 0) + 1;
    assetRevisions.set(kind, revision);
    const job = (async () => {
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (assetRevisions.get(kind) !== revision) return;
        if (kind === 'logo') logoImage = image; else mapImage = image;
        byId(kind === 'logo' ? 'attendanceToggleLogo' : 'attendanceToggleMap').checked = true;
        status(kind === 'logo' ? 'Đã thêm logo cho mẫu 2.' : 'Đã thêm bản đồ cho mẫu 2.');
      } catch (_) {
        status('Không đọc được ảnh. Vui lòng thử ảnh PNG hoặc JPEG.', true);
      } finally {
        URL.revokeObjectURL(url);
      }
    })();
    pendingAssets.set(kind, job);
    await job;
    if (pendingAssets.get(kind) === job) pendingAssets.delete(kind);
    changed();
  }

  function now() {
    const d = new Date();
    byId('attendanceTime').value = d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
    byId('attendanceDate').value = `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    const weekday = d.toLocaleDateString('vi-VN', {weekday: 'long'});
    byId('attendanceWeekday').value = weekday.replace(/(^|\s)\S/g, c => c.toLocaleUpperCase('vi-VN'));
    changed();
  }

  function gps() {
    if (!navigator.geolocation) { status('Thiết bị không hỗ trợ GPS.', true); return; }
    const request = ++gpsRequest;
    const oldAddress = value('attendanceAddress');
    status('Đang lấy vị trí cho mẫu 2…');
    navigator.geolocation.getCurrentPosition(async position => {
      if (request !== gpsRequest) return;
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      byId('attendanceLatitude').value = lat;
      byId('attendanceLongitude').value = lng;
      changed();
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`, {headers: {Accept: 'application/json'}});
        if (!response.ok) throw new Error('geocode');
        const result = await response.json();
        if (request !== gpsRequest) return;
        // Do not overwrite an address the user edited while GPS was loading.
        if (value('attendanceAddress') === oldAddress) byId('attendanceAddress').value = result.display_name || `${lat}, ${lng}`;
        status('Đã lấy tọa độ và địa chỉ cho mẫu 2.');
      } catch (_) {
        if (request !== gpsRequest) return;
        if (!value('attendanceAddress')) byId('attendanceAddress').value = `${lat}, ${lng}`;
        status('Đã lấy tọa độ; chưa lấy được tên địa chỉ.');
      }
      changed();
    }, error => {
      if (request === gpsRequest) status('Không lấy được GPS: ' + error.message, true);
    }, {enableHighAccuracy: true, timeout: 15000, maximumAge: 0});
  }

  function roundedPath(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function text(ctx, content, x, top, font, color, maxWidth = Infinity) {
    ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(content);
    const left = m.actualBoundingBoxLeft || 0;
    const right = m.actualBoundingBoxRight || m.width;
    const sx = Math.min(1, maxWidth / Math.max(1, left + right));
    ctx.save(); ctx.translate(x, top); ctx.scale(sx, 1); ctx.fillStyle = color;
    ctx.fillText(content, left, m.actualBoundingBoxAscent || parseFloat(font)); ctx.restore();
  }

  function wrap(ctx, content, maxWidth) {
    const lines = [];
    for (const paragraph of String(content).split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width <= maxWidth) { line = test; continue; }
        if (line) { lines.push(line); line = ''; }
        // Long URLs/words also stay inside the photo.
        for (const character of word) {
          if (line && ctx.measureText(line + character).width > maxWidth) { lines.push(line); line = ''; }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function shield(ctx, x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = size * .075;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -size * .45); ctx.lineTo(size * .37, -size * .28);
    ctx.lineTo(size * .34, size * .13); ctx.quadraticCurveTo(size * .30, size * .35, 0, size * .49);
    ctx.quadraticCurveTo(-size * .30, size * .35, -size * .34, size * .13);
    ctx.lineTo(-size * .37, -size * .28); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size * .16, size * .02); ctx.lineTo(-size * .03, size * .15);
    ctx.lineTo(size * .19, -size * .13); ctx.stroke(); ctx.restore();
  }

  function pattern(ctx, x, y, w, h) {
    ctx.save(); roundedPath(ctx, x, y, w, h, 28); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
    for (let family = 0; family < 2; family++) {
      ctx.strokeStyle = family ? 'rgba(163,119,181,.14)' : 'rgba(85,164,204,.24)';
      ctx.lineWidth = 2;
      for (let offset = -w; offset <= w * 2; offset += 23) {
        ctx.beginPath();
        for (let t = 0; t <= 1.001; t += .025) {
          const px = x + offset + (family ? -1 : 1) * (h * t + h * .9 * Math.sin(t * Math.PI));
          const py = y + h * t;
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function badge(ctx, data, left, bottom, availableWidth) {
    const f = data.switches;
    const withLogo = f.logo && logoImage;
    if (!f.title && !f.time && !withLogo) return 0;
    const h = withLogo ? 314 : 212;
    const y = bottom - h;
    const titleFont = f.art && data.artStyle === 'gothic' ? '600 122px AttendanceClock' : `${f.art && data.artStyle === 'italic' ? 'italic ' : ''}700 122px AttendanceText`;
    ctx.font = titleFont;
    const titleSpan = f.title ? Math.max(180, Math.min(920, ctx.measureText(data.attendanceLabel).width + 94)) : 0;
    const timeSpan = f.time ? (withLogo ? 542 : 462) : 0;
    const logoSpan = withLogo ? 510 : 0;
    const width = Math.max(90, titleSpan + timeSpan + logoSpan + (!f.title ? 22 : 0));
    const fit = Math.min(1, availableWidth / width);
    ctx.save(); ctx.translate(left, bottom); ctx.scale(fit, fit); ctx.translate(-left, -bottom);
    pattern(ctx, left, y, width, h);
    if (f.title) {
      ctx.fillStyle = data.accent; roundedPath(ctx, left + 22, y + 22, titleSpan - 42, h - 44, 14); ctx.fill();
      text(ctx, data.attendanceLabel, left + 44, y + (h - 101) / 2 - 9, titleFont, '#050505', titleSpan - 80);
    }
    if (f.time) {
      const content = data.time || '--:--';
      const targetHeight = withLogo ? 165 : 139;
      ctx.font = '500 200px AttendanceClock';
      const m = ctx.measureText(content);
      const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const sy = targetHeight / glyphHeight;
      const targetWidth = Math.min(timeSpan - 65, (withLogo ? 444 : 366) * content.length / 5);
      const sx = targetWidth / Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const x = left + titleSpan + (f.title ? 16 : 22);
      const top = y + (h - targetHeight) / 2;
      ctx.save(); ctx.translate(x, top); ctx.scale(sx, sy);
      const gradient = ctx.createLinearGradient(0, 0, 0, glyphHeight);
      gradient.addColorStop(0, '#064daa'); gradient.addColorStop(.4, '#023b88'); gradient.addColorStop(1, '#00000b');
      ctx.fillStyle = gradient; ctx.textBaseline = 'alphabetic'; ctx.fillText(content, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent); ctx.restore();
    }
    if (withLogo) {
      const x = left + width - logoSpan;
      ctx.save(); roundedPath(ctx, left, y, width, h, 28); ctx.clip();
      ctx.beginPath(); ctx.moveTo(x + 46, y); ctx.lineTo(left + width, y); ctx.lineTo(left + width, bottom); ctx.lineTo(x, bottom); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, logoSpan, h);
      const scale = Math.min((logoSpan - 30) / logoImage.naturalWidth, (h - 12) / logoImage.naturalHeight);
      const iw = logoImage.naturalWidth * scale, ih = logoImage.naturalHeight * scale;
      ctx.drawImage(logoImage, x + 18 + (logoSpan - 30 - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore();
      ctx.strokeStyle = 'rgba(120,135,147,.45)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + 46, y + 3); ctx.lineTo(x, bottom - 3); ctx.stroke();
    }
    ctx.restore();
    return h * fit;
  }

  function draw(ctx, canvas, data, transform) {
    if (!data?.switches) return;
    const s = Math.min(canvas.width, canvas.height) / 3024;
    const w = canvas.width / s, h = canvas.height / s;
    const f = data.switches;
    ctx.save(); ctx.scale(s, s); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    if (f.map && mapImage) {
      const x = 73, y = 73, size = 775;
      ctx.fillStyle = '#fff'; roundedPath(ctx, x, y, size, size, 32); ctx.fill();
      ctx.save(); roundedPath(ctx, x + 14, y + 14, size - 28, size - 28, 18); ctx.clip();
      const ratio = Math.max((size - 28) / mapImage.naturalWidth, (size - 28) / mapImage.naturalHeight);
      const iw = mapImage.naturalWidth * ratio, ih = mapImage.naturalHeight * ratio;
      ctx.drawImage(mapImage, x + (size - iw) / 2, y + (size - ih) / 2, iw, ih); ctx.restore();
    }
    if (f.vertical) {
      ctx.save(); ctx.translate(w - 43, h * .435); ctx.rotate(-Math.PI / 2);
      ctx.font = '400 77px AttendanceText'; const codeText = data.photoCode + '  Timemark Verified';
      const length = ctx.measureText(codeText).width;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
      shield(ctx, -length / 2 - 42, 0, 39, 'rgba(255,255,255,.9)'); ctx.fillText(codeText, -length / 2, 0); ctx.restore();
    }
    if (f.brand) {
      ctx.save(); ctx.font = '600 92px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText('Time').width, mw = ctx.measureText('mark').width;
      const x = w - 44 - tw - mw;
      ctx.fillStyle = data.accent; ctx.fillText('Time', x, h - 138);
      ctx.fillStyle = '#fff'; ctx.fillText('mark', x + tw, h - 138);
      text(ctx, '100% Chân thực', x, h - 104, '400 66px AttendanceText', 'rgba(255,255,255,.82)', tw + mw); ctx.restore();
    }

    const rows = [];
    const maxWidth = Math.min(2060, w - 180);
    if (f.time) {
      const dateText = [data.weekday, data.date].filter(Boolean).join(', ');
      if (dateText) rows.push({lines: [dateText], font: '700 100px AttendanceText', lineHeight: 120, after: 54});
    }
    if (f.address && data.address) {
      ctx.font = '400 100px AttendanceText';
      rows.push({lines: wrap(ctx, data.address, maxWidth), font: ctx.font, lineHeight: 120, after: 0});
    }
    if (f.tags && data.tags) {
      ctx.font = '500 90px AttendanceText';
      rows.push({lines: wrap(ctx, data.tags, maxWidth), font: ctx.font, lineHeight: 110, after: 0});
    }
    if (f.coordinates && (data.latitude || data.longitude)) {
      ctx.font = '400 85px AttendanceText';
      rows.push({lines: wrap(ctx, [data.latitude, data.longitude].filter(Boolean).join(', '), maxWidth), font: ctx.font, lineHeight: 105, after: 0});
    }
    const infoHeight = rows.length ? rows.reduce((n, row) => n + row.lines.length * row.lineHeight + row.after, 0) - 8 : 0;
    const commitmentTop = h - 158;
    const infoBottom = f.commitment ? commitmentTop - 52 : h - 80;
    const infoTop = infoBottom - infoHeight;
    const headerBottom = infoTop - (rows.length ? 66 : 0);
    const headerHeight = f.logo && logoImage ? 314 : 212;
    // Fit long content upward without clipping the bottom. User transform remains template-local.
    const blockHeight = h - 60 - (headerBottom - headerHeight);
    const fit = Math.min(1, (h - 100) / Math.max(1, blockHeight));
    const scale = transform.scale * fit;
    ctx.save(); ctx.translate(44 + transform.x / s, h - 60 + transform.y / s);
    ctx.scale(scale, scale); ctx.translate(-44, -(h - 60));
    badge(ctx, data, 44, headerBottom, w - 88);
    if (rows.length) {
      ctx.fillStyle = data.accent; roundedPath(ctx, 44, infoTop, 22, infoHeight, 3); ctx.fill();
      let y = infoTop + 12;
      for (const row of rows) {
        for (const line of row.lines) {
          text(ctx, line, 128, y, row.font, '#fff', w - 172);
          y += row.lineHeight;
        }
        y += row.after;
      }
    }
    if (f.commitment) {
      shield(ctx, 116, commitmentTop + 42, 100, 'rgba(255,255,255,.55)');
      text(ctx, 'Cam kết ngày giờ chân thực bởi Timemark', 192, commitmentTop, '400 88px AttendanceText', 'rgba(255,255,255,.55)', w - 260);
    }
    ctx.restore(); ctx.restore();
  }

  function init() {
    const root = byId('formAttendance');
    root.addEventListener('input', event => { if (event.target.type !== 'file') changed(); });
    root.addEventListener('change', event => { if (event.target.type !== 'file') changed(); });
    byId('attendanceLogoInput').addEventListener('change', e => readAsset('logo', e.target.files[0]));
    byId('attendanceMapInput').addEventListener('change', e => readAsset('map', e.target.files[0]));
    byId('attendanceDone').addEventListener('click', () => document.querySelector('.preview-card').scrollIntoView({behavior: 'smooth', block: 'start'}));
    byId('attendanceChooseTemplate').addEventListener('click', () => document.querySelector('.watermark-card').scrollIntoView({behavior: 'smooth', block: 'start'}));
    syncControls();
  }

  window.AttendanceTemplate = Object.freeze({ready, capture, switchStyle, now, gps, draw, init});
})();
