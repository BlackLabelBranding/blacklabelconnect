-- Backend migration applied to Supabase project xopcttkrmjvwdddawdaa.
-- Employee clock actions are idempotent and scoped to auth.uid().
create or replace function public.mobile_clock_action(p_action text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_started timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_action not in ('in','out') then raise exception 'Invalid action'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select id,clock_in into v_id,v_started from public.time_punches where user_id=auth.uid() and clock_out is null order by clock_in desc limit 1;
 if p_action='in' then
   if v_id is not null then return jsonb_build_object('status','already_clocked_in','clock_in',v_started); end if;
   insert into public.time_punches(user_id,clock_in) values(auth.uid(),now()) returning id,clock_in into v_id,v_started;
   return jsonb_build_object('status','clocked_in','id',v_id,'clock_in',v_started);
 end if;
 if v_id is null then return jsonb_build_object('status','already_clocked_out'); end if;
 update public.time_punches set clock_out=now() where id=v_id;
 return jsonb_build_object('status','clocked_out','id',v_id);
end $$;
revoke all on function public.mobile_clock_action(text) from public;
grant execute on function public.mobile_clock_action(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('connect-employee-files','connect-employee-files',false,10485760,array['application/pdf','image/jpeg','image/png','text/plain'])
on conflict (id) do nothing;
create policy "connect_employee_files_select_own" on storage.objects for select to authenticated using(bucket_id='connect-employee-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "connect_employee_files_insert_own" on storage.objects for insert to authenticated with check(bucket_id='connect-employee-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "connect_employee_files_delete_own" on storage.objects for delete to authenticated using(bucket_id='connect-employee-files' and (storage.foldername(name))[1]=auth.uid()::text);
