create or replace function public.mobile_update_own_employee_photo(p_photo_url text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_photo_url is null or length(p_photo_url)>1500 or p_photo_url not like '%/storage/v1/object/public/team-members/%' then
  raise exception 'Invalid team photo URL';
 end if;
 if position(auth.uid()::text in p_photo_url)=0 then raise exception 'Photo must belong to current user'; end if;
 update public.team_members set avatar_url=p_photo_url where user_id=auth.uid();
 update public.profiles set photo_url=p_photo_url,updated_at=now() where id=auth.uid();
end $$;
revoke all on function public.mobile_update_own_employee_photo(text) from public;
grant execute on function public.mobile_update_own_employee_photo(text) to authenticated;
