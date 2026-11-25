function reply(value,status=200,origin='') {
 return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
}
async function sheet(env,body){
 const r=await fetch(env.APPS_SCRIPT_URL,{method:'POST',body:JSON.stringify(body),redirect:'follow'});
 if(!r.ok) throw Error('sheet');return r.json();
}
export default {async fetch(req,env){
 const origin=req.headers.get('Origin')||new URL(req.url).origin;
 const path=new URL(req.url).pathname.replace(/^\/wallet-api(?=\/)/,'');
 const answer=(v,s)=>reply(v,s,origin);
 const sql=(q,...p)=>env.DB.prepare(q).bind(...p);
 try{
 if(path==='/webhook' && req.method==='POST'){
   if(!env.SEPAY_API_KEY || req.headers.get('Authorization')!=='Apikey '+env.SEPAY_API_KEY)return reply({success:false},401);
   const b=await req.json();
   const ref=String(b.content||'').toUpperCase().match(/\bTMNAP[A-F0-9]{16}\b/)?.[0];
   if(!ref || b.transferType!=='in' || String(b.accountNumber)!==env.BANK_ACCOUNT)return reply({success:true});
   if(!b.id || !Number.isSafeInteger(b.transferAmount) || b.transferAmount<=0)return reply({success:false},400);
   await sql('UPDATE deposits SET bank_id=? WHERE ref=? AND amount=? AND bank_id IS NULL AND NOT EXISTS(SELECT 1 FROM deposits WHERE bank_id=?)',String(b.id),ref,b.transferAmount,String(b.id)).run();
   return reply({success:true});
 }
 if(!origin || origin!==env.FRONTEND_ORIGIN)return reply({error:'Origin'},403);
 if(req.method==='OPTIONS')return answer({});
 if(path==='/config')return answer({auth:env.SUPABASE_URL,publicKey:env.SUPABASE_PUBLISHABLE_KEY});
 if(!env.SUPABASE_URL || !env.DB || !env.PILOT_EMAIL)return answer({error:'Chưa cấu hình máy chủ thử nghiệm.'},503);
 const authorization=req.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer '))return answer({error:'Vui lòng đăng nhập.'},401);
 const auth=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:authorization}});
 if(!auth.ok)return answer({error:'Phiên đăng nhập đã hết hạn.'},401);
 const user=await auth.json();
 if(!user.email_confirmed_at || !env.PILOT_EMAIL || user.email?.toLowerCase()!==env.PILOT_EMAIL.toLowerCase())return answer({error:'Chỉ mở cho Gmail thử nghiệm đã xác nhận.'},403);
 const uid=user.id;
 await sql('INSERT INTO accounts(uid) VALUES(?) ON CONFLICT(uid) DO NOTHING',uid).run();
 if(path==='/account' && req.method==='GET'){
 const [account,entries,deposits,purchases]=await env.DB.batch([
 sql('SELECT balance FROM accounts WHERE uid=?',uid),sql('SELECT * FROM entries WHERE uid=? ORDER BY created DESC,rowid DESC',uid),
 sql('SELECT * FROM deposits WHERE uid=? ORDER BY created DESC,rowid DESC',uid),sql('SELECT * FROM purchases WHERE uid=? ORDER BY created DESC,rowid DESC',uid)]);
 return answer({balance:account.results[0].balance,entries:entries.results,deposits:deposits.results,purchases:purchases.results});
 }
 if(path==='/plans' && req.method==='GET')return answer(await sheet(env,{action:'getPlans'}));
 if(req.method!=='POST')return answer({error:'Không tìm thấy.'},404);
 const b=await req.json();
 if(path==='/deposit'){
 if(!env.BANK_ACCOUNT||!env.BANK_CODE)return answer({error:'Chưa cấu hình tài khoản nhận tiền.'},503);
 if(!Number.isSafeInteger(b.amount)||b.amount<1000||b.amount>1000000)return answer({error:'Chọn từ 1.000đ đến 1.000.000đ cho lần thử.'},400);
 const ref='TMNAP'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();
 await sql('INSERT INTO deposits(ref,uid,amount) VALUES(?,?,?)',ref,uid,b.amount).run();
 return answer({ref,amount:b.amount,bank:env.BANK_CODE,account:env.BANK_ACCOUNT});
 }
 if(path==='/purchase'){
 if(!env.WALLET_KEY_SECRET)return answer({error:'Chưa kết nối cấp key.'},503);
 if(!/^[a-f0-9-]{36}$/.test(b.id))return answer({error:'Mã đơn không hợp lệ.'},400);
 let order=await sql('SELECT * FROM purchases WHERE id=? AND uid=?',b.id,uid).first();
 if(!order){
 const offers=await sheet(env,{action:'getPlans'});
 const plan=offers.plans?.find(p=>p.id===b.plan && p.available && p.amount===b.amount);
 if(!plan)return answer({error:'Giá hoặc tình trạng gói đã đổi.'},409);
 try{await sql('INSERT INTO purchases(id,uid,plan,amount) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',b.id,uid,plan.id,plan.amount).run();}
 catch(error){if(String(error.cause||error).includes('CHECK constraint'))return answer({error:'Số dư chưa đủ.'},409);throw error;}
 order=await sql('SELECT * FROM purchases WHERE id=? AND uid=?',b.id,uid).first();
 }
 if(!order || order.plan!==b.plan)return answer({error:'Đơn không hợp lệ.'},409);
 if(order.refunded)return answer({error:'Đơn đã hoàn tiền.'},409);
 if(!order.license){
 const issued=await sheet(env,{action:'issueWalletKey',secret:env.WALLET_KEY_SECRET,id:order.id,email:user.email,plan:order.plan,amount:order.amount});
 if(issued.status==='unavailable'){
 await sql('UPDATE purchases SET refunded=1 WHERE id=? AND uid=? AND refunded=0 AND license IS NULL',order.id,uid).run();
 return answer({error:'Gói vừa hết hoặc đổi giá. Đã hoàn tiền vào số dư.'},409);
 }
 if(!issued.key)return answer({error:'Đang chờ cấp key. Có thể thử lại từ đơn này.'},503);
 await sql('UPDATE purchases SET license=? WHERE id=? AND uid=?',issued.key,order.id,uid).run();
 }
 return answer({success:true});
 }
 return answer({error:'Không tìm thấy.'},404);
 }catch{return answer({error:'Chưa xử lý xong. Vui lòng tải lại lịch sử trước khi thử lại.'},503);}
}};