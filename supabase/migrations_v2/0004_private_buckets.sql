-- Student/teacher file buckets must be PRIVATE (C6). Public URLs can expose student work.
-- Access is via short-lived signed URLs created by the authenticated owner.
update storage.buckets set public = false
  where id in ('submissions', 'uploads', 'grading-examples', 'training-data');

-- Authenticated read/write policies so owners can upload and create signed URLs.
-- (Tighten to owner-scoped path prefixes once all upload paths are uid-prefixed.)
do $$
declare b text;
begin
  foreach b in array array['uploads','grading-examples','training-data'] loop
    execute format('drop policy if exists %I on storage.objects;', b || ' auth read');
    execute format('create policy %I on storage.objects for select to authenticated using (bucket_id = %L);', b || ' auth read', b);
    execute format('drop policy if exists %I on storage.objects;', b || ' auth write');
    execute format('create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L);', b || ' auth write', b);
    execute format('drop policy if exists %I on storage.objects;', b || ' auth update');
    execute format('create policy %I on storage.objects for update to authenticated using (bucket_id = %L);', b || ' auth update', b);
  end loop;
end $$;
