
-- Idempotency
drop policy if exists "videos_tenant_select" on storage.objects;
drop policy if exists "videos_tenant_insert" on storage.objects;
drop policy if exists "videos_tenant_update" on storage.objects;
drop policy if exists "videos_tenant_delete" on storage.objects;

-- Helper: does the current user belong to the tenant encoded in the path prefix?
create or replace function public.is_video_path_owner(_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id::text = split_part(_path, '/', 1)
  )
$$;

grant execute on function public.is_video_path_owner(text) to authenticated;

-- Storage RLS policies: path prefix must equal a tenant the user belongs to
create policy "videos_tenant_select"
on storage.objects for select to authenticated
using (bucket_id = 'videos' and public.is_video_path_owner(name));

create policy "videos_tenant_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'videos' and public.is_video_path_owner(name));

create policy "videos_tenant_update"
on storage.objects for update to authenticated
using (bucket_id = 'videos' and public.is_video_path_owner(name))
with check (bucket_id = 'videos' and public.is_video_path_owner(name));

create policy "videos_tenant_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'videos' and public.is_video_path_owner(name));
