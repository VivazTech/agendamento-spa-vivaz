-- Configura bucket e policies do Storage para imagens de serviços
-- Execute este script no SQL Editor do Supabase (projeto de produção/dev)

-- 1) Garantir que o bucket exista (idempotente)
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = true;

-- 2) Ajustes opcionais do bucket (mime e limite)
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png']
where id = 'service-images';

-- 3) Policies de leitura e upload para anon/authenticated
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'service-images-public-read'
  ) then
    create policy "service-images-public-read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'service-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'service-images-public-insert'
  ) then
    create policy "service-images-public-insert"
      on storage.objects
      for insert
      to public
      with check (bucket_id = 'service-images');
  end if;
end $$;
