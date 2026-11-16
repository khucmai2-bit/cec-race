import {reply,corsHeaders} from '../_shared/cors.ts';
import {db,sessionFor,month} from '../_shared/common.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 try{
  const {session,branch,target}=await req.json();const s=await sessionFor(session);
  if(!s||s.role!=='admin')return reply({error:'Chỉ quản trị viên được thiết lập KPI'},403);
  const n=Number(target);if(!Number.isFinite(n)||n<0||n>1e12)return reply({error:'KPI không hợp lệ'},400);
  const {data:valid,error:branchError}=await db.from('branches').select('id').eq('id',branch).maybeSingle();
  if(branchError)throw branchError;if(!valid)return reply({error:'Cơ sở không hợp lệ'},400);
  const m=month();
  const {data:existing,error:readError}=await db.from('monthly_kpis').select('branch_id').eq('month_key',m).eq('branch_id',branch).maybeSingle();
  if(readError)throw readError;
  const result=existing
    ? await db.from('monthly_kpis').update({target:n,updated_at:new Date().toISOString()}).eq('month_key',m).eq('branch_id',branch)
    : await db.from('monthly_kpis').insert({month_key:m,branch_id:branch,target:n});
  if(result.error)throw result.error;return reply({ok:true});
 }catch(e){return reply({error:e.message||'Lỗi máy chủ'},500)}
});
