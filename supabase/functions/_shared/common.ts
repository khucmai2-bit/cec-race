import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
export const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
export const month=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date());
export async function sessionFor(token:string){
 if(!token)return null;
 const {data}=await db.from('sessions').select('*').eq('token_hash',await hash(token)).gt('expires_at',new Date().toISOString()).maybeSingle();
 return data;
}
export async function hash(s:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function checkPin(pin:string,stored:string){
 const {data,error}=await db.rpc('verify_pin',{plain_pin:pin,stored_hash:stored});
 if(error)throw error;return data===true;
}
