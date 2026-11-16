import {reply,corsHeaders} from '../_shared/cors.ts';
import {db,sessionFor,month} from '../_shared/common.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 try{
  const {session,revenue}=await req.json();const s=await sessionFor(session);
  if(!s||s.role!=='branch'||!s.branch_id)return reply({error:'Không có quyền cập nhật'},403);
  const n=Number(revenue);if(!Number.isFinite(n)||n<0||n>1e12)return reply({error:'Doanh thu không hợp lệ'},400);
  const m=month();
  const {data:existing,error:readError}=await db.from('monthly_kpis').select('branch_id').eq('month_key',m).eq('branch_id',s.branch_id).maybeSingle();
  if(readError)throw readError;
  const result=existing
    ? await db.from('monthly_kpis').update({revenue:n,updated_at:new Date().toISOString()}).eq('month_key',m).eq('branch_id',s.branch_id)
    : await db.from('monthly_kpis').insert({month_key:m,branch_id:s.branch_id,revenue:n});
  if(result.error)throw result.error;return reply({ok:true});
 }catch(e){return reply({error:e.message||'Lỗi máy chủ'},500)}
});
