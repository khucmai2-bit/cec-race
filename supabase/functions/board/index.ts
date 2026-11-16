import {reply,corsHeaders} from '../_shared/cors.ts';
import {db,sessionFor,month} from '../_shared/common.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 try{
  const {session}=await req.json();const s=await sessionFor(session);
  if(!s)return reply({error:'Phiên đăng nhập hết hạn. Hãy đăng nhập lại.'},401);
  const m=month();
  const {data:branches}=await db.from('branches').select('id,display_order').order('display_order');
  const {data:rows}=await db.from('monthly_kpis').select('branch_id,target,revenue,updated_at').eq('month_key',m);
  const map=new Map((rows||[]).map(x=>[x.branch_id,x]));
  return reply({month:m,rows:(branches||[]).map(b=>{const x=map.get(b.id)||{};const target=Number(x.target||0),revenue=Number(x.revenue||0);return {branch:b.id,target,revenue,percent:target?revenue/target*100:0,updated_at:x.updated_at||null}})});
 }catch(e){return reply({error:e.message||'Lỗi máy chủ'},500)}
});
