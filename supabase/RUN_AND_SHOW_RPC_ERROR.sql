-- Execute the RPC and explicitly select the result to see the error message
do $$
declare
  v_result jsonb;
begin
  select public.draft_approve('4dde260e-4eae-4c43-864d-6be246d76fbe') into v_result;
  raise notice 'RPC Result: %', v_result;
end;
$$;
