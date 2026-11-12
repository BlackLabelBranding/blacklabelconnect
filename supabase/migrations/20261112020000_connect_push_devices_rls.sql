alter table public.connect_push_devices enable row level security;
create policy "connect_push_devices_select_own" on public.connect_push_devices for select to authenticated using(user_id=(select auth.uid()));
create policy "connect_push_devices_insert_own" on public.connect_push_devices for insert to authenticated with check(user_id=(select auth.uid()));
create policy "connect_push_devices_update_own" on public.connect_push_devices for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "connect_push_devices_delete_own" on public.connect_push_devices for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.connect_push_devices to authenticated;
