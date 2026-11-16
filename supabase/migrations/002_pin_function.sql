create or replace function public.verify_pin(plain_pin text, stored_hash text)
returns boolean language sql security definer set search_path=public
as $$ select crypt(plain_pin,stored_hash)=stored_hash; $$;
revoke all on function public.verify_pin(text,text) from public, anon, authenticated;
grant execute on function public.verify_pin(text,text) to service_role;
