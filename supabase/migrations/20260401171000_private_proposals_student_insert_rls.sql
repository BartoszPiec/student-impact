do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'service_orders'
      and policyname = 'Students can create private proposals'
  ) then
    create policy "Students can create private proposals"
      on public.service_orders
      for insert
      to authenticated
      with check (
        auth.uid() = student_id
        and initiated_by = 'student'
        and entry_point = 'student_private_proposal'
        and exists (
          select 1
          from public.service_packages sp
          where sp.id = package_id
            and sp.student_id = auth.uid()
        )
      );
  end if;
end
$$;
