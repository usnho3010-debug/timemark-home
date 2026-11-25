const $=id=>document.getElementById(id);
const endpoint='/wallet-api';
const money=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n);
const note=t=>{$('status').textContent=t};
let state={balance:0,entries:[],deposits:[],purchases:[]},view='entries',operation,config,plans=[],busy=false;
let token=sessionStorage.getItem('tm-wallet-session')||'';
let demo=false;
function row(parent,title,detail,value){
 const a=document.createElement('article'),r=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small'),label=document.createElement('span');
 r.className='row';strong.textContent=title;label.textContent=value;small.textContent=detail;r.append(strong,label);a.append(r,small);parent.append(a);return a;
}
function paint(){
 $('balance').textContent=money(state.balance);
 for(const button of $('tabs').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.view===view));
 const list=$('items');list.replaceChildren();
 for(const item of state[view]){
 const date=new Date(item.created*1000).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 if(view==='entries')row(list,item.amount<0?'Mua gói key':item.ref.startsWith('REFUND-')?'Hoàn tiền':'Nạp tiền',date+' · '+item.ref,(item.amount>0?'+':'')+money(item.amount));
 if(view==='deposits')row(list,item.bank_id?'Đã nhận tiền':'Chờ chuyển khoản',date+' · '+item.ref,money(item.amount));
 if(view==='purchases'){
 const a=row(list,'Gói '+item.plan,date+' · '+item.id,item.refunded?'Đã hoàn tiền':item.license?'Đã cấp key':'Chờ cấp key');
 const p=document.createElement('p');p.textContent=money(item.amount)+(item.license?' · '+item.license:'');a.append(p);
 if(!item.license&&!item.refunded&&!demo){const btn=document.createElement('button');btn.textContent='Nhận key của đơn';btn.onclick=()=>act(()=>purchase(item));a.append(btn);}
 }
 }
 if(!state[view].length)list.textContent='Chưa có '+({entries:'giao dịch',deposits:'lệnh nạp',purchases:'đơn key'})[view]+'.';
}
async function api(path,body){
 const res=await fetch(endpoint+path,{method:body?'POST':'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await res.json();if(!res.ok)throw Error(data.error||'Kết nối bị gián đoạn.');return data;
}
async function refresh(){
 if(!demo&&token){state=await api('/account');$('logout').hidden=false;$('auth').hidden=true;}
 paint();
}
async function act(fn){if(busy)return;busy=true;try{await fn();}catch(e){note(e.message);}finally{busy=false;}}
function sample(){
 demo=true;$('mode').textContent='Bản xem giao diện · Dữ liệu minh họa, không nhận chuyển khoản.';
 const t=Math.floor(Date.now()/1000);state={balance:30000,entries:[{ref:'DON-MAU-01',amount:-20000,created:t},{ref:'NAP-MAU-01',amount:50000,created:t-600}],deposits:[{ref:'NAP-MAU-01',amount:50000,bank_id:'sample',created:t-600}],purchases:[{id:'DON-MAU-01',plan:'minh họa',amount:20000,license:'KEY MINH HỌA',created:t}]};paint();
}
async function start(){
 try{config=await api('/config');if(!config.auth||!config.publicKey)throw Error();}catch{sample();return}
 $('mode').textContent='Tài khoản thử nghiệm thanh toán';$('auth').hidden=!!token;
 try{await refresh();}catch(e){$('auth').hidden=false;note(e.message);}
}
$('authForm').onsubmit=e=>{e.preventDefault();const signup=e.submitter.value==='signup';act(async()=>{
 const res=await fetch(config.auth+'/auth/v1/'+(signup?'signup':'token?grant_type=password'),{method:'POST',headers:{apikey:config.publicKey,'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password:$('pass').value})});
 const data=await res.json();$('pass').value='';if(!res.ok)throw Error('Không thể đăng nhập hoặc đăng ký. Kiểm tra thông tin và email xác nhận.');
 if(!data.access_token){note('Kiểm tra Gmail để xác nhận tài khoản rồi đăng nhập.');return;}
 token=data.access_token;sessionStorage.setItem('tm-wallet-session',token);await refresh();note('Đã đăng nhập.');
});};
$('logout').onclick=()=>{sessionStorage.removeItem('tm-wallet-session');location.reload()};
$('tabs').onclick=e=>{if(e.target.dataset.view){view=e.target.dataset.view;paint()}};
$('reload').onclick=()=>act(refresh);
async function openForm(kind){
 if(demo){note('Bản xem giao diện dùng dữ liệu minh họa. Chưa mở giao dịch tiền thật tại đây.');return;}
 if(!token){$('email').focus();return;}
 operation=kind;$('instruction').textContent='';$('payment').hidden=false;$('payForm').hidden=false;
 $('operation').textContent=kind==='fund'?'Nạp tiền vào số dư':'Mua key bằng số dư';$('amountLabel').hidden=kind!=='fund';$('amount').disabled=kind!=='fund';$('planLabel').hidden=kind==='fund';
 if(kind==='key'){plans=(await api('/plans')).plans.filter(p=>p.available);$('plan').replaceChildren(...plans.map(p=>new Option(p.title+' · '+money(p.amount),p.id)));}
 $('payment').scrollIntoView({block:'center'});
}
$('fund').onclick=()=>act(()=>openForm('fund'));$('buy').onclick=()=>act(()=>openForm('key'));
async function purchase(item){
 await api('/purchase',item);sessionStorage.removeItem('tm-wallet-intent');await refresh();note('Đã cấp key. Mở mục Đơn key để xem.');
}
$('payForm').onsubmit=e=>{e.preventDefault();act(async()=>{
 if(operation==='fund'){const d=await api('/deposit',{amount:Number($('amount').value)});$('instruction').textContent='Chuyển '+money(d.amount)+' tới '+d.bank+' · STK '+d.account+' · Nội dung chính xác: '+d.ref+'. Sau khi chuyển, bấm Làm mới.';view='deposits';}
 else{const p=plans.find(p=>p.id===$('plan').value);if(!p)throw Error('Chưa có gói đang bán.');
 let item=JSON.parse(sessionStorage.getItem('tm-wallet-intent')||'null');
 if(!item||item.plan!==p.id||item.amount!==p.amount)item={id:crypto.randomUUID(),plan:p.id,amount:p.amount};
 sessionStorage.setItem('tm-wallet-intent',JSON.stringify(item));view='purchases';try{await purchase(item);}finally{await refresh();}}
 $('payForm').hidden=true;await refresh();
});};
start();