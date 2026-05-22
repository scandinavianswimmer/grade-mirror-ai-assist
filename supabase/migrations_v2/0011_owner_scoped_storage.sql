-- B1 (CRITICAL): the storage policies in 0002/0004 gated only on bucket_id, so any
-- authenticated teacher could read/overwrite ANY other teacher's student files. Re-scope
-- every policy to the owner via the uid path prefix. All upload paths are `${auth.uid()}/...`
-- (submissions, uploads, grading-examples, training-data). Also ensure the buckets exist and
-- are private before locking down (S2).
insert into storage.buckets (id, name, public) values
  ('submissions','submissions', false),
  ('uploads','uploads', false),
  ('grading-examples','grading-examples', false),
  ('training-data','training-data', false)
on conflict (id) do update set public = false;

-- Drop the old bucket-wide policies from 0002/0004.
do $$ declare b text;
begin
  foreach b in array array['submissions','uploads','grading-examples','training-data'] loop
    execute format('drop policy if exists %I on storage.objects;', b || ' auth read');
    execute format('drop policy if exists %I on storage.objects;', b || ' auth write');
    execute format('drop policy if exists %I on storage.objects;', b || ' auth update');
  end loop;
end $$;

-- Owner-scoped policies: the first path segment must equal the caller's uid.
do $$ declare b text;
begin
  foreach b in array array['submissions','uploads','grading-examples','training-data'] loop
    execute format($f$create policy %I on storage.objects for select to authenticated
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);$f$, b || ' owner read', b);
    execute format($f$create policy %I on storage.objects for insert to authenticated
      with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);$f$, b || ' owner write', b);
    execute format($f$create policy %I on storage.objects for update to authenticated
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);$f$, b || ' owner update', b);
    execute format($f$create policy %I on storage.objects for delete to authenticated
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);$f$, b || ' owner delete', b);
  end loop;
end $$;
