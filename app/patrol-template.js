/* Template 4: independent fields, assets, flags and canvas renderer. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const value = key => ($('pt' + key)?.value || '').trim();
  const enabled = key => !!$('ptToggle' + key)?.checked;
  const definitions = [
    ['Logo', 'Logo', false, '<label>Ảnh logo<input id="ptLogoFile" type="file" accept="image/*"></label>'],
    ['Title', 'Tiêu đề', true, '<label>Tiêu đề<input id="ptTitle" value="Tuần tra"></label>'],
    ['Subtitle', 'Tiêu đề phụ', true, '<label>Tiêu đề phụ<input id="ptSubtitle" value="Hồ sơ công việc"></label>'],
    ['Work', 'Nội dung công việc', false, '<label>Nội dung công việc<textarea id="ptWork" placeholder="Ví dụ: Trực ca đêm"></textarea></label>'],
    ['Employee', 'Nhân Viên Trực', false, '<label>Nhân Viên Trực<input id="ptEmployee" placeholder="Nhập họ tên"></label>'],
    ['Art', 'Kiểu chữ nghệ thuật', false, '<label>Kiểu chữ tiêu đề<select id="ptArt"><option value="condensed">Chữ cao, đậm</option><option value="italic">Chữ nghiêng</option></select></label>'],
    ['Card', 'Danh thiếp', false, '<label>Thông tin liên hệ<textarea id="ptCard" placeholder="Điện thoại, email…"></textarea></label>'],
    ['Tags', 'Thẻ', false, '<label>Nội dung thẻ<input id="ptTags" placeholder="Ví dụ: Ca đêm · Khu A"></label>'],
    ['Time', 'Thời gian', true, '<div class="patrol-pair"><label>Giờ<input id="ptTime" placeholder="16:28"></label><label>Thứ<input id="ptWeekday" placeholder="Thứ Sáu"></label></div><label>Ngày<input id="ptDate" placeholder="13 Tháng 11, 2026"></label>'],
    ['Location', 'Vị trí', true, '<label>Địa chỉ<textarea id="ptLocation" placeholder="Nhập địa chỉ"></textarea></label>'],
    ['Code', 'Mã ảnh', true, ''],
    ['Brand', 'Thương hiệu', true, '']
  ];
  let logo = null, pendingLogo = null, logoRevision = 0, fontPromise, initialized = false, gpsRevision = 0;
  function status(text) { $('ptStatus').textContent = text; }
  function controls() { for (const [key] of definitions) $('ptPanel' + key).hidden = !enabled(key); }
  function newCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(12)), n => alphabet[n % alphabet.length]).join('');
  }
  async function ready() {
    if (!fontPromise) fontPromise = Promise.all([
      document.fonts.load('400 38px PatrolText'), document.fonts.load('700 44px PatrolText'),
      document.fonts.load('400 110px PatrolClock'), document.fonts.load('600 44px PatrolClock')
    ]).catch(error => { fontPromise = null; throw error; });
    await fontPromise;
    while (pendingLogo) await pendingLogo;
  }
  function capture(photoCode) {
    const values = {}, flags = {};
    for (const [key] of definitions) flags[key] = enabled(key);
    for (const key of ['Title','Subtitle','Work','Employee','Art','Card','Tags','Time','Weekday','Date','Location','Color','Background','Opacity']) values[key] = value(key);
    return {values, flags, logo, photoCode: photoCode || newCode()};
  }
  function changed() {
    controls();
    if (getWMStyle() === 'patrol' && hasGenerated) { generatedData = capture(generatedData.photoCode); renderCanvas(); }
  }
  function activate(style) {
    const active = style === 'patrol';
    document.body.classList.toggle('patrol-active', active);
    if (active) {
      document.querySelectorAll('[data-template-one-only]').forEach(el => { el.hidden = true; });
      if (hasGenerated) generatedData = capture(generatedData.photoCode);
    }
  }
  async function readLogo(file) {
    if (!file) return;
    const revision = ++logoRevision;
    status('Đang đọc logo…');
    const job = (async () => {
      const url = URL.createObjectURL(file);
      try {
        const image = new Image(); image.src = url; await image.decode();
        if (revision !== logoRevision) return;
        logo = image; $('ptToggleLogo').checked = true; status('Đã thêm logo cho mẫu 4.');
      } catch { if (revision === logoRevision) status('Không đọc được ảnh. Hãy chọn JPG hoặc PNG.'); }
      finally { URL.revokeObjectURL(url); }
    })();
    pendingLogo = job; await job;
    if (pendingLogo === job) pendingLogo = null;
    changed();
  }
  function now() {
    const d = new Date();
    $('ptTime').value = [d.getHours(), d.getMinutes()].map(n => String(n).padStart(2,'0')).join(':');
    $('ptWeekday').value = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][d.getDay()];
    $('ptDate').value = `${d.getDate()} Tháng ${d.getMonth()+1}, ${d.getFullYear()}`; changed();
  }
  function gps() {
    if (!navigator.geolocation) { status('Thiết bị không hỗ trợ GPS.'); return; }
    const revision = ++gpsRevision, oldAddress = value('Location');
    status('Đang lấy vị trí cho mẫu 4…');
    navigator.geolocation.getCurrentPosition(async p => {
      if (revision !== gpsRevision) return;
      const coordinates = `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}&accept-language=vi`, {headers:{Accept:'application/json'}});
        if (!response.ok) throw Error('geocode');
        const result = await response.json(); if (revision !== gpsRevision) return;
        if (value('Location') === oldAddress) $('ptLocation').value = result.display_name || coordinates;
        status('Đã lấy vị trí cho mẫu 4.');
      } catch {
        if (revision !== gpsRevision) return;
        if (value('Location') === oldAddress && !oldAddress) $('ptLocation').value = coordinates;
        status('Đã lấy tọa độ; chưa lấy được tên địa chỉ. Bạn có thể nhập địa chỉ thủ công.');
      }
      changed();
    }, () => { if (revision === gpsRevision) status('Chưa lấy được GPS. Bạn có thể nhập địa chỉ thủ công.'); }, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
  }

  function draw(ctx, canvas, data, transform) {
    if (!data?.flags || !canvas.width || !canvas.height) return;
    const f = data.flags, v = data.values, unit = Math.min(canvas.width, canvas.height) / 1152;
    const W = canvas.width/unit, H = canvas.height/unit, width = 524, accent = v.Color || '#fff36a';
    const font = (size, weight=400, family='PatrolText', italic=false) => { ctx.font = `${italic?'italic ':''}${weight} ${size}px ${family}`; ctx.textBaseline='alphabetic'; };
    const text = (content,x,top,size,weight=400,color='#fff',maxWidth,family='PatrolText',italic=false) => {
      font(size,weight,family,italic);ctx.fillStyle=color;const m=ctx.measureText(content);
      ctx.fillText(content,x,top+m.actualBoundingBoxAscent,maxWidth);
    };
    function wrap(content,maxWidth,size=38,weight=400,family='PatrolText') {
      font(size,weight,family); const lines=[];
      for(const paragraph of String(content).split(/\r?\n/)) {
        let line='';
        for(const word of paragraph.split(/\s+/).filter(Boolean)) {
          if(ctx.measureText(line ? line+' '+word : word).width<=maxWidth){line=line ? line+' '+word : word;continue;}
          if(line){lines.push(line);line='';}
          for(const char of word){if(line && ctx.measureText(line+char).width>maxWidth){lines.push(line);line='';}line+=char;}
        }
        if(line)lines.push(line);
      }
      return lines;
    }
    function shield(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle='#fff';ctx.lineWidth=.08;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(0,-.45);ctx.lineTo(.38,-.25);ctx.lineTo(.3,.22);ctx.quadraticCurveTo(0,.45,-.3,.22);ctx.lineTo(-.38,-.25);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-.14,.02);ctx.lineTo(-.02,.14);ctx.lineTo(.18,-.1);ctx.stroke();ctx.restore();}
    ctx.save();
    try {
      ctx.scale(unit,unit);ctx.textAlign='left';ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;
      if(f.Code){ctx.save();ctx.translate(W-8,H*.595);ctx.rotate(-Math.PI/2);font(29);ctx.fillStyle='#fff';shield(0,-10,16);ctx.fillText(data.photoCode+'  Timemark Verified',20,0);ctx.restore();}
      if(f.Brand){font(36,600,'Arial');const a=ctx.measureText('Time').width,b=ctx.measureText('mark').width,x=W-17-a-b;text('Time',x,H-80,36,600,'#ffc533',undefined,'Arial');text('mark',x+a,H-80,36,600,'#fff',undefined,'Arial');text('100% Chân thực',x,H-40,25,400,'#eee',a+b);}
      const withLogo = f.Logo && data.logo;
      const headerX = withLogo ? 140 : 18, headerWidth = width-headerX-18;
      const titleFamily=f.Art && v.Art==='condensed' ? 'PatrolClock':'PatrolText';
      const title = f.Title ? wrap(v.Title||'',headerWidth,44,700,titleFamily) : [];
      const subtitle = f.Subtitle ? wrap(v.Subtitle||'',headerWidth,38) : [];
      const hasHeader = withLogo || title.length || subtitle.length;
      const headerHeight = hasHeader ? Math.max(130,20+title.length*54+subtitle.length*46+14) : 0;
      const rows=[];
      function row(content){if(content){const lines=wrap(content,width-84,38);if(lines.length)rows.push(lines);}}
      if(f.Work && v.Work)row('Nội dung công việc: '+v.Work);
      if(f.Employee && v.Employee)row('Nhân Viên Trực: '+v.Employee);
      if(f.Location)row(v.Location);
      if(f.Card)row(v.Card);
      if(f.Tags)row(v.Tags);
      const firstRow = (hasHeader ? headerHeight+42 : 14)+(f.Time ? 136 : 0);
      const height = firstRow + rows.reduce((n,lines)=>n+lines.length*45+18,0) + (rows.length ? 10 : 14);
      if(!hasHeader && !f.Time && !rows.length)return;
      const fit=Math.min(1,(H-32)/height,(W-32)/width), scale=(transform.scale||1)*fit;
      ctx.save();
      try {
        ctx.translate(16+(transform.x||0)/unit,H-16+(transform.y||0)/unit);ctx.scale(scale,scale);ctx.translate(0,-height);
        ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,Number(v.Opacity ?? 70)/100));ctx.fillStyle=v.Background||'#295000';ctx.beginPath();ctx.roundRect(0,0,width,height,12);ctx.fill();ctx.restore();
        if(withLogo){ctx.save();ctx.beginPath();ctx.roundRect(6,4,122,122,5);ctx.clip();const ratio=Math.min(122/data.logo.width,122/data.logo.height);ctx.drawImage(data.logo,6+(122-data.logo.width*ratio)/2,4+(122-data.logo.height*ratio)/2,data.logo.width*ratio,data.logo.height*ratio);ctx.restore();}
        let y=20;
        for(const line of title){text(line,headerX,y,44,700,accent,headerWidth,titleFamily,f.Art&&v.Art==='italic');y+=54;}
        for(const line of subtitle){text(line,headerX,y,38,400,'#fff',headerWidth);y+=46;}
        if(hasHeader){ctx.fillStyle=accent;ctx.fillRect(0,headerHeight,width,6);ctx.save();ctx.beginPath();ctx.rect(6,headerHeight+10,width-12,30);ctx.clip();text('>'.repeat(48),6,headerHeight+16,25,500,accent);ctx.restore();}
        if(f.Time){const top=(hasHeader?headerHeight+42:14)+16;const time=v.Time||'--:--';font(110,400,'PatrolClock');const m=ctx.measureText(time);ctx.save();ctx.translate(14,top);ctx.scale(169/Math.max(m.width,1),80/Math.max(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,1));ctx.fillStyle=accent;ctx.fillText(time,0,m.actualBoundingBoxAscent);ctx.restore();text([v.Weekday,v.Date].filter(Boolean).join(', '),208,top+65,26,400,'#fff',width-220);}
        y=firstRow;
        for(const lines of rows){ctx.fillStyle=accent;ctx.fillRect(17,y+5,11,23);for(const line of lines){text(line,47,y,38);y+=45;}y+=18;}
      } finally {ctx.restore();}
    } finally {ctx.restore();}
  }
  function init() {
    if(initialized)return;initialized=true;
    for(const [key,label,on,html]of definitions){const group=document.createElement('div');group.innerHTML=`<div class="patrol-row"><label class="patrol-switch"><input id="ptToggle${key}" type="checkbox" aria-label="Bật ${label} mẫu 4" ${on?'checked':''}><span></span></label><label for="ptToggle${key}">${label}</label></div><div class="patrol-fields" id="ptPanel${key}" ${on?'':'hidden'}>${html}</div>`;$(key==='Code'||key==='Brand'?'ptExtras':'ptFields').append(group);}
    const root=$('formPatrol');root.addEventListener('input',e=>{if(e.target.type!=='file')changed();});root.addEventListener('change',e=>{if(e.target.type!=='file')changed();});
    $('ptLogoFile').addEventListener('change',e=>readLogo(e.target.files[0]));
    $('ptChooseTemplate').onclick=()=>document.querySelector('.watermark-card').scrollIntoView({behavior:'smooth',block:'start'});
    $('ptDone').onclick=()=>document.querySelector('.preview-card').scrollIntoView({behavior:'smooth',block:'start'});
    controls();
  }
  window.PatrolTemplate=Object.freeze({init,ready,capture,activate,draw,now,gps});
})();
