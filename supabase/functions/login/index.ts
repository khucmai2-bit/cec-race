import {reply,corsHeaders} from '../_shared/cors.ts';
import {db,hash,checkPin} from '../_shared/common.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 try{
  const {pin,branch,admin}=await req.json();
  if(typeof pin!=='string'||pin.length<4||pin.length>12)return reply({error:'PIN không hợp lệ'},400);
  let role='branch',branchId=branch;
  if(admin){
   const {data}=await db.from('admin_credentials').select('pin_hash').eq('id',1).single();
   if(!data||!await checkPin(pin,data.pin_hash))return reply({error:'Sai mã PIN quản trị'},401);
   role='admin';branchId=null;
  }else{
   const {data}=await db.from('branch_credentials').select('pin_hash').eq('branch_id',branch).single();
   if(!data||!await checkPin(pin,data.pin_hash))return reply({error:'Sai mã PIN cơ sở'},401);
  }
  const token=crypto.randomUUID()+crypto.randomUUID();
  await db.from('sessions').insert({token_hash:await hash(token),role,branch_id:branchId,expires_at:new Date(Date.now()+12*60*60*1000).toISOString()});
  return reply({session:token,role,branch:branchId});
 }catch(e){return reply({error:e.message||'Lỗi máy chủ'},500)}
});
