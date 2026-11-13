import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const base='4b29699723be71f54f0765ae7a49ec13ad70c0cc';
for(const file of ['app/attendance-template.js','app/attendance-template.css','app/completion-app.js','app/completion-app.css','app/theme-app.css','app/responsive-ui.css'])assert.deepEqual(readFileSync(file),execFileSync('git',['show',`${base}:${file}`]),`${file} changed`);
const nodes=new Map();
function node(id=''){
 const classes=new Set(),handlers={};const el={id,value:'',checked:false,hidden:false,style:{},dataset:{},type:'',handlers,
 classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)},
 addEventListener(k,fn){handlers[k]=fn;},append(){},scrollIntoView(){},textContent:''};
 Object.defineProperty(el,'innerHTML',{set(html){parse(html);}});return el;
}
function parse(html){for(const tag of html.matchAll(/<(input|textarea|select|div|p|button|canvas|span|small)[^>]*\bid="([^"]+)"[^>]*>/g)){const el=node(tag[2]);el.value=/\bvalue="([^"]*)"/.exec(tag[0])?.[1]||'';el.checked=/\bchecked\b/.test(tag[0]);el.type=/\btype="([^"]*)"/.exec(tag[0])?.[1]||'';nodes.set(el.id,el);}}
const html=readFileSync('app/index.html','utf8');parse(html);
let style='v3',gpsCallback;
const oneOnly=[node(),node()];
const sandbox={console,URL,crypto:webcrypto,Image:class{},FontFace:class{},getWMStyle:()=>style,
 document:{getElementById:id=>nodes.get(id),createElement:()=>node(),body:node(),currentScript:{src:'https://example.test/app/attendance-template.js'},fonts:{load:async()=>[],add(){}},querySelector:()=>node(),querySelectorAll(selector){if(selector==='[data-template-one-only]')return oneOnly;return [];}},
 navigator:{geolocation:{getCurrentPosition(cb){gpsCallback=cb;}}},fetch:async()=>({ok:true,json:async()=>({display_name:'Địa chỉ GPS mẫu 4'})}),
 wmX:0,wmY:0,wmScale:1,hasGenerated:false,generatedData:{},img:{src:'test-photo'},isDraggingWM:false,renderCanvas(){},
};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(readFileSync('app/attendance-template.js','utf8'),sandbox);
vm.runInContext(readFileSync('app/patrol-template.js','utf8'),sandbox);
const patrol=sandbox.PatrolTemplate;patrol.init();
const set=(key,v)=>{const el=nodes.get('pt'+key);if(typeof v==='boolean')el.checked=v;else el.value=v;};
set('Time','16:28');set('Date','13 Tháng 11, 2026');set('Weekday','Thứ Sáu');set('Location','Địa chỉ mẫu 4');set('Work','Trực ca đêm');set('Employee','Nguyễn Văn Nhớ');
const data=patrol.capture();assert.equal(data.photoCode.length,12);assert.equal(patrol.capture(data.photoCode).photoCode,data.photoCode);
const commands=[];let depth=0;const context=new Proxy({font:'',measureText(t){const size=Number(/([\d.]+)px/.exec(this.font)?.[1]||38);return {width:t.length*size*.45,actualBoundingBoxAscent:size*.8,actualBoundingBoxDescent:size*.2};},save(){depth++;},restore(){depth--;assert(depth>=0);}}, {get(o,k){if(k in o)return o[k];return (...args)=>commands.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});
function output(d){commands.length=0;patrol.draw(context,{width:1152,height:1536},d,{x:0,y:0,scale:1});assert.equal(depth,0);return JSON.stringify(commands);}
const original=output(data);
for(const key of ['Title','Subtitle','Time','Location','Code','Brand']){const other={...data,flags:{...data.flags,[key]:false}};assert.notEqual(output(other),original,key);}
for(const key of ['Work','Employee','Card','Tags']){const other={...data,values:{...data.values,[key]:'Thông tin thử'},flags:{...data.flags,[key]:true}};assert.notEqual(output(other),original,key);}
const withLogo={...data,logo:{width:122,height:122},flags:{...data.flags,Logo:true}};assert.notEqual(output(withLogo),original);
output({...data,flags:{},values:{}});output({...data,values:{...data.values,Location:'Dài '.repeat(300)}});
function switchTo(next){style=next;sandbox.AttendanceTemplate.switchStyle(next);patrol.activate(next);}
switchTo('v3');Object.assign(sandbox,{wmX:17,wmY:-20,wmScale:.8,hasGenerated:true,generatedData:{time:'old1'}});
switchTo('attendance');Object.assign(sandbox,{wmX:30,wmY:-40,wmScale:1.1,hasGenerated:true,generatedData:{time:'old2'}});
switchTo('completion');Object.assign(sandbox,{wmX:50,wmY:-60,wmScale:1.2,hasGenerated:true,generatedData:{time:'old3'}});
switchTo('patrol');Object.assign(sandbox,{wmX:70,wmY:-80,wmScale:.9,hasGenerated:true,generatedData:data});
for(const [next,x,time]of [['v3',17,'old1'],['attendance',30,'old2'],['completion',50,'old3']]){switchTo(next);assert.equal(sandbox.wmX,x);assert.equal(sandbox.generatedData.time,time);}
switchTo('patrol');assert.equal(sandbox.wmX,70);assert.equal(sandbox.generatedData.photoCode,data.photoCode);assert(oneOnly.every(n=>n.hidden));
patrol.gps();switchTo('completion');await gpsCallback({coords:{latitude:10,longitude:105}});assert.equal(sandbox.generatedData.time,'old3');assert.equal(nodes.get('ptLocation').value,'Địa chỉ GPS mẫu 4');
switchTo('patrol');assert.equal(sandbox.generatedData.values.Location,'Địa chỉ GPS mẫu 4');
console.log('PASS: template 1–3 assets unchanged; template 4 toggles, drawing, code, isolated snapshots and delayed GPS.');
