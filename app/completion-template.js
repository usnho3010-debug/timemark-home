/* Template 3: independent DOM, assets, state, renderer and export. No legacy globals. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const definitions=[
 ['Logo','Logo',false,'<label>Ảnh logo<input id="cpLogoFile" type="file" accept="image/*"></label>'],
 ['Company','Công ty',false,'<label>Tên công ty<input id="cpCompany" placeholder="Tên công ty"></label>'],
 ['Card','Danh thiếp',false,'<label>Thông tin danh thiếp<textarea id="cpCard" placeholder="Điện thoại, email hoặc thông tin liên hệ"></textarea></label>'],
 ['Art','Kiểu chữ nghệ thuật',false,'<label>Kiểu chữ tiêu đề<select id="cpArt"><option value="bold">Chữ đậm</option><option value="italic">Chữ nghiêng</option></select></label>'],
 ['Tags','Thẻ',false,'<label>Nội dung thẻ<input id="cpTags" placeholder="Công trình A · Ca sáng"></label>'],
 ['Title','Tiêu đề',true,'<label>Nội dung tiêu đề<input id="cpTitle" value="Đã hoàn thành"></label>'],
 ['Time','Thời gian',true,'<button id="cpNow" type="button">Lấy giờ thực tế</button><div class="pair"><label>Giờ<input id="cpTime" value="06:44"></label><label>Thứ<input id="cpWeekday" value="Thứ Sáu"></label></div><label>Ngày<input id="cpDate" value="13 Tháng 11, 2026"></label>'],
 ['Location','Vị trí',true,'<button id="cpGPS" type="button">Lấy vị trí GPS</button><label>Địa chỉ<textarea id="cpLocation" placeholder="Nhập địa chỉ">Địa chỉ của bạn</textarea></label>'],
 ['Coordinates','Tọa độ',false,'<div class="pair"><label>Vĩ độ<input id="cpLatitude" inputmode="decimal"></label><label>Kinh độ<input id="cpLongitude" inputmode="decimal"></label></div>'],
 ['Altitude','Độ cao',false,'<label>Độ cao (m)<input id="cpAltitude" inputmode="decimal" placeholder="Nhập độ cao"></label>'],
 ['Direction','Phương hướng',false,'<label>Phương hướng<input id="cpDirection" placeholder="Ví dụ: Đông Bắc 45°"></label>'],
 ['Employee','Tên nhân viên',false,'<label>Tên nhân viên<input id="cpEmployee" placeholder="Họ tên nhân viên"></label>'],
 ['EmployeeId','ID nhân viên',false,'<label>ID nhân viên<input id="cpEmployeeId" placeholder="Mã nhân viên"></label>'],
 ['Portrait','Ảnh thẻ',false,'<label>Ảnh nhân viên<input id="cpPortraitFile" type="file" accept="image/*"></label>'],
 ['Code','Mã ảnh',true,'<p class="hint">Mã trang trí 12 ký tự, giữ nguyên khi chỉnh thông tin. Không kết nối dịch vụ xác minh Timemark.</p>'],
 ['Note','Ghi chú',false,'<label>Nội dung ghi chú<textarea id="cpNote" placeholder="Ví dụ: Nhân viên Sale"></textarea></label>'],
 ['Brand','Thương hiệu Timemark',true,''],['Check','Dấu tích trong khung giờ',true,'']
];
for(const [key,label,on,html] of definitions){
 const group=document.createElement('div');group.innerHTML=`<div class="field-row"><label class="switch"><input id="cpToggle${key}" type="checkbox" aria-label="Bật ${label}" ${on?'checked':''}><span></span></label><label for="cpToggle${key}">${label}</label></div><div class="field-panel" id="cpPanel${key}" ${on?'':'hidden'}>${html}</div>`;
 $(['Brand','Check'].includes(key)?'cpExtras':'cpFields').append(group);
}
const canvas=$('cpCanvas'),ctx=canvas.getContext('2d');
const state={photo:null,logo:null,portrait:null,x:0,y:0,scale:1,code:newCode(),exportUrl:null,exportFile:null,drag:null};
const pending=new Set(),versions={};let drawing=0;
function newCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>a[n%a.length]).join('');}
const val=key=>$('cp'+key)?.value.trim()||'';
const on=key=>$('cpToggle'+key)?.checked||false;
function status(message){$('cpStatus').textContent=message;}
function controls(){for(const [key] of definitions)$('cpPanel'+key).hidden=!on(key);}
const fonts=Promise.all([document.fonts.load('400 100px CompletionText'),document.fonts.load('700 128px CompletionText'),document.fonts.load('300 220px CompletionClock')]);
function rr(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function font(size,weight=400,family='CompletionText',italic=false){ctx.font=`${italic?'italic ':''}${weight} ${size}px ${family}`;ctx.textBaseline='alphabetic';}
function ink(text,x,y,size,weight=400,color='#fff',maxWidth,italic=false,family='CompletionText'){
 font(size,weight,family,italic);ctx.fillStyle=color;const m=ctx.measureText(text);ctx.fillText(text,x,y+m.actualBoundingBoxAscent,maxWidth);
}
function wrap(text,maxWidth,size=100,weight=400){
 font(size,weight);const out=[];
 for(const paragraph of String(text).split(/\n/)){
  let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){
   if(ctx.measureText(word).width>maxWidth){if(line){out.push(line);line='';}for(const ch of word){if(ctx.measureText(line+ch).width>maxWidth){out.push(line);line='';}line+=ch;}continue;}
   const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){out.push(line);line=word;}else line=next;
  }if(line)out.push(line);
 }return out;
}
function shield(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.strokeStyle='#fff';ctx.lineWidth=.075;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(0,-.45);ctx.lineTo(.38,-.25);ctx.lineTo(.30,.22);ctx.quadraticCurveTo(0,.45,-.30,.22);ctx.lineTo(-.38,-.25);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-.14,.02);ctx.lineTo(-.02,.14);ctx.lineTo(.18,-.10);ctx.stroke();ctx.restore();}
function imageBox(image,x,y,w,h,cover=false,r=10){
 ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();const factor=(cover?Math.max:Math.min)(w/image.width,h/image.height);const iw=image.width*factor,ih=image.height*factor;ctx.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih);ctx.restore();
}
function render(){
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 if(state.photo)ctx.drawImage(state.photo,0,0,w,h);else{const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#161815');g.addColorStop(1,'#030504');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 const unit=Math.min(w,h)/3024,W=w/unit,H=h/unit;ctx.save();ctx.scale(unit,unit);
 if(on('Code')){ctx.save();ctx.translate(W-20,H*.595);ctx.rotate(-Math.PI/2);font(77);ctx.fillStyle='#fff';shield(0,-27,42);ctx.fillText(state.code+'  Timemark Verified',52,0);ctx.restore();}
 if(on('Brand')){font(98,700);const a=ctx.measureText('Time').width,b=ctx.measureText('mark').width;const x=W-44-a-b;ink('Time',x,H-205,98,700,'#ffc533');ink('mark',x+a,H-205,98,700);ink('100% Chân thực',x,H-96,60,400,'#eee',a+b);}
 const bodyWidth=Math.min(1750,W-210);const rows=[];
 function row(text,size=100,weight=400,gap=70){if(text){const lines=wrap(text,bodyWidth,size,weight);rows.push({lines,size,weight,gap,height:lines.length*size*1.22});}}
 if(on('Title'))row(val('Title'),128,700,85);
 if(on('Time'))row([val('Weekday'),val('Date')].filter(Boolean).join(', '),100,400,65);
 if(on('Location'))row(val('Location'),100,400,65);
 if(on('Coordinates'))row([val('Latitude'),val('Longitude')].filter(Boolean).join(', '),86,400,40);
 if(on('Altitude')&&val('Altitude'))row('Độ cao: '+val('Altitude')+' m',86,400,40);
 if(on('Direction'))row(val('Direction'),86,400,40);
 if(on('Tags'))row(val('Tags'),86,500,40);
 if(on('Card'))row(val('Card'),86,400,40);
 for(const el of document.querySelectorAll('#cpCustom textarea'))row(el.value.trim(),90,400,40);
 const employee=[];if(on('Employee')&&val('Employee'))employee.push(val('Employee'));if(on('EmployeeId')&&val('EmployeeId'))employee.push('ID: '+val('EmployeeId'));if(on('Note')&&val('Note'))employee.push('Ghi chú: '+val('Note'));
 const hasPortrait=on('Portrait')&&state.portrait;const noteWidth=Math.min(1440,bodyWidth);const textWidth=noteWidth-90-(hasPortrait?290:0);
 const noteLines=employee.map(t=>wrap(t,textWidth,100));const noteHeight=Math.max(hasPortrait?320:0,noteLines.reduce((sum,lines)=>sum+lines.length*122+64,0)+(noteLines.length?40:0));
 let total=rows.reduce((sum,r)=>sum+r.height+r.gap,0)+(noteHeight?noteHeight:0);if(!noteHeight&&rows.length)total-=rows[rows.length-1].gap;
 const logo=on('Logo')&&state.logo,company=on('Company')&&val('Company');const clock=on('Time');const check=on('Check');
 const hasBadge=logo||company||clock||check;const badgeW=(logo?350:0)+(clock?500:0)+(check?260:0)||760;const badgeH=company?382:276;const badgeGap=90;
 const height=total+(hasBadge?badgeH+badgeGap+(logo?75:0):0);
 const fit=Math.min(1,(H-180)/Math.max(height*state.scale,1),(W-100)/(Math.max(bodyWidth+80,badgeW)*state.scale));
 const scale=state.scale*fit;ctx.save();ctx.translate(60+state.x/unit,H-90+state.y/unit);ctx.scale(scale,scale);ctx.translate(0,-total);
 if(hasBadge){const by=-badgeH-badgeGap;rr(0,by,badgeW,badgeH,30,val('Color'));let left=75;
  if(logo){rr(56,by-75,292,292,18,'#fff');imageBox(state.logo,56,by-75,292,292,false,18);left=420;}
  if(clock){font(220,300,'CompletionClock');const t=val('Time')||'--:--',m=ctx.measureText(t),targetW=380,targetH=165;ctx.save();ctx.translate(left,by+52);ctx.scale(targetW/Math.max(m.width,1),targetH/Math.max(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,1));ctx.fillStyle='#fff';ctx.fillText(t,0,m.actualBoundingBoxAscent);ctx.restore();}
  if(check){const cx=badgeW-145,cy=by+137;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,80,0,Math.PI*2);ctx.fill();ctx.strokeStyle=val('Color');ctx.lineWidth=14;ctx.lineCap='square';ctx.lineJoin='miter';ctx.beginPath();ctx.moveTo(cx-33,cy);ctx.lineTo(cx-7,cy+27);ctx.lineTo(cx+40,cy-27);ctx.stroke();}
  if(company)ink(company,75,by+278,70,400,'#fff',badgeW-140);
 }
 if(total>0)rr(0,0,14,total,0,val('LineColor'));
 let y=0;for(const r of rows){for(const line of r.lines){ink(line,74,y,r.size,r.weight,'#fff',bodyWidth,on('Art')&&val('Art')==='italic'&&r.weight===700);y+=r.size*1.22;}y+=r.gap;}
 if(noteHeight){const g=ctx.createLinearGradient(74,0,74+noteWidth,0);g.addColorStop(0,'rgba(180,180,180,.42)');g.addColorStop(1,'rgba(80,80,80,0)');rr(74,y,noteWidth,noteHeight,24,g);if(hasPortrait)imageBox(state.portrait,100,y+30,250,noteHeight-60,true,16);let ny=y+42;for(const lines of noteLines){for(const line of lines){ink(line,hasPortrait?380:119,ny,100);ny+=122;}ny+=64;}}
 ctx.restore();ctx.restore();
}
async function redraw(){const ticket=++drawing;await fonts;if(ticket===drawing)render();}
async function asset(file,kind){if(!file)return;const version=(versions[kind]||0)+1;versions[kind]=version;status('Đang đọc ảnh…');
 const job=(async()=>{const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(versions[kind]!==version)return;state[kind]=img;if(kind==='photo'){const max=4096,f=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.round(img.naturalWidth*f);canvas.height=Math.round(img.naturalHeight*f);state.x=state.y=0;state.code=newCode();}else $('cpToggle'+(kind==='logo'?'Logo':'Portrait')).checked=true;controls();await redraw();status('Đã tải ảnh.');}catch{status('Không đọc được ảnh. Vui lòng chọn JPG hoặc PNG.');}finally{URL.revokeObjectURL(url);}})();pending.add(job);try{await job;}finally{pending.delete(job);}}
$('cpPhoto').addEventListener('change',e=>asset(e.target.files[0],'photo'));$('cpLogoFile').addEventListener('change',e=>asset(e.target.files[0],'logo'));$('cpPortraitFile').addEventListener('change',e=>asset(e.target.files[0],'portrait'));
document.querySelector('main').addEventListener('input',e=>{if(e.target.type==='file')return;if(e.target.id==='cpScale'){state.scale=Number(e.target.value)/100;$('cpScaleValue').textContent=e.target.value+'%';}controls();redraw();});
$('cpReset').onclick=()=>{state.x=state.y=0;state.scale=1;$('cpScale').value=100;$('cpScaleValue').textContent='100%';redraw();};
$('cpNow').onclick=()=>{const d=new Date();$('cpTime').value=[d.getHours(),d.getMinutes()].map(x=>String(x).padStart(2,'0')).join(':');$('cpWeekday').value=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][d.getDay()];$('cpDate').value=d.getDate()+' Tháng '+(d.getMonth()+1)+', '+d.getFullYear();redraw();};
$('cpGPS').onclick=()=>{if(!navigator.geolocation){status('Trình duyệt không hỗ trợ GPS.');return;}status('Đang lấy vị trí…');navigator.geolocation.getCurrentPosition(p=>{$('cpLatitude').value=p.coords.latitude.toFixed(6);$('cpLongitude').value=p.coords.longitude.toFixed(6);if(p.coords.altitude!=null)$('cpAltitude').value=Math.round(p.coords.altitude);if(p.coords.heading!=null)$('cpDirection').value=Math.round(p.coords.heading)+'°';$('cpToggleCoordinates').checked=true;controls();redraw();status('Đã lấy tọa độ. Nhập tên địa chỉ trong ô Vị trí.');},()=>status('Chưa lấy được GPS. Bạn vẫn có thể nhập vị trí thủ công.'),{timeout:12000});};
$('cpMinimal').onclick=()=>{for(const [key] of definitions)$('cpToggle'+key).checked=['Title','Time','Location','Code','Brand','Check'].includes(key);controls();redraw();};
$('cpFull').onclick=()=>{for(const key of ['Company','Employee','Note'])$('cpToggle'+key).checked=true;if(!val('Company'))$('cpCompany').value='Công ty của bạn';if(!val('Employee'))$('cpEmployee').value='Nguyễn Văn An';if(!val('Note'))$('cpNote').value='Nhân viên Sale';if(state.logo)$('cpToggleLogo').checked=true;controls();redraw();};
$('cpAddCustom').onclick=()=>{const row=document.createElement('div');row.className='custom-row';const label=document.createElement('label');label.textContent='Thông tin bổ sung';const input=document.createElement('textarea');label.append(input);const remove=document.createElement('button');remove.type='button';remove.textContent='Xóa dòng';remove.onclick=()=>{row.remove();redraw();};row.append(label,remove);$('cpCustom').append(row);input.focus();};
canvas.addEventListener('pointerdown',e=>{if(state.drag)return;const r=canvas.getBoundingClientRect();state.drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:state.x,oy:state.y,sx:canvas.width/r.width,sy:canvas.height/r.height};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{const d=state.drag;if(!d||d.id!==e.pointerId)return;state.x=d.ox+(e.clientX-d.x)*d.sx;state.y=d.oy+(e.clientY-d.y)*d.sy;redraw();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{state.drag=null;});
$('cpGenerate').onclick=async()=>{await redraw();$('cpPreview').scrollIntoView({behavior:'smooth',block:'start'});};
$('cpSave').onclick=async()=>{const button=$('cpSave');button.disabled=true;try{await Promise.all([...pending]);await fonts;render();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();if(state.exportUrl)URL.revokeObjectURL(state.exportUrl);state.exportUrl=URL.createObjectURL(blob);state.exportFile=new File([blob],'timemark-mau3.png',{type:'image/png'});$('cpExportImage').src=state.exportUrl;$('cpDownload').href=state.exportUrl;$('cpShare').hidden=!navigator.canShare?.({files:[state.exportFile]});$('cpExport').showModal();status('Ảnh đã sẵn sàng để lưu.');}catch{status('Chưa xuất được ảnh. Vui lòng thử lại.');}finally{button.disabled=false;}};
$('cpShare').onclick=async()=>{try{await navigator.share({files:[state.exportFile],title:'Ảnh mẫu 3'});}catch(e){if(e.name!=='AbortError')status('Bạn có thể nhấn giữ ảnh để lưu hoặc chọn Tải PNG.');}};
$('cpCloseExport').onclick=()=>$('cpExport').close();
controls();redraw();
})();
