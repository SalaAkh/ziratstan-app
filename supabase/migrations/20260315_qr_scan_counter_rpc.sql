-- Atomic QR scan counter increment helper.
create or replace function public.increment_qr_scan_count(p_qr_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scan_count integer;
begin
  update public.qr_codes
  set scan_count = coalesce(scan_count, 0) + 1
  where id = p_qr_id
    and status = 'active'
  returning scan_count into v_scan_count;

  return coalesce(v_scan_count, 0);
end;
$$;

grant execute on function public.increment_qr_scan_count(uuid) to anon, authenticated, service_role;
