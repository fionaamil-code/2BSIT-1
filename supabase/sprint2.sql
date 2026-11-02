-- Sprint 2 backend: Customers, Products and price history (with soft delete and stamps).
-- Run AFTER schema.sql and sprint1.sql, in Supabase: SQL Editor > New query > paste > Run. Safe to run again.

-- 1. Helpers ---------------------------------------------------------------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.app_role() in ('ADMIN','SUPERADMIN'), false)
$$;
-- Admins and Superadmins hold every right. Users hold only the rights they were given.
create or replace function public.has_right(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_staff() or (public.app_role() = 'USER' and exists
    (select 1 from public.user_rights where user_id = auth.uid() and right_code = p_code))
$$;
create or replace function public.has_access(p_prefix text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_staff() or (public.app_role() = 'USER' and exists
    (select 1 from public.user_rights where user_id = auth.uid() and right_code like p_prefix || '%'))
$$;
create or replace function public._stamp_name() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select username from public.profiles where id = auth.uid()), 'system')
$$;
create or replace function public._audit(p_action text, p_target uuid, p_detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target_id, detail) values (auth.uid(), p_action, p_target, p_detail)
$$;
grant execute on function public.is_staff(), public.has_right(text), public.has_access(text) to authenticated;
revoke all on function public._stamp_name(), public._audit(text, uuid, jsonb) from public;

-- 2. Tables ----------------------------------------------------------------
create sequence if not exists public.customer_no_seq;
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  cust_no text not null unique default ('C-' || lpad(nextval('public.customer_no_seq')::text, 3, '0')),
  name text not null,
  address text not null default '',
  pay_terms text not null check (pay_terms in ('Net 15','Net 30','Net 45','COD','Prepaid')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  stamp_action text not null default 'CREATED',
  stamp_by text not null default 'system',
  stamp_at timestamptz not null default now()
);

create sequence if not exists public.product_no_seq;
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  prod_code text not null unique default ('P-' || lpad(nextval('public.product_no_seq')::text, 3, '0')),
  description text not null,
  unit text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  stamp_action text not null default 'CREATED',
  stamp_by text not null default 'system',
  stamp_at timestamptz not null default now()
);
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  effective_date date not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  stamp_action text not null default 'CREATED',
  stamp_by text not null default 'system',
  stamp_at timestamptz not null default now()
);
create unique index if not exists product_prices_one_per_date on public.product_prices (product_id, effective_date) where status = 'ACTIVE';

-- Current price = latest active price whose date has arrived.
create or replace view public.products_view with (security_invoker = true) as
select p.*, cp.unit_price as current_price, cp.effective_date as current_effective
from public.products p
left join lateral (
  select unit_price, effective_date from public.product_prices pp
  where pp.product_id = p.id and pp.status = 'ACTIVE' and pp.effective_date <= current_date
  order by pp.effective_date desc limit 1) cp on true;
grant select on public.products_view to authenticated;

-- 3. Row Level Security: Users see active rows only, staff see everything ---
alter table public.customers      enable row level security;
alter table public.products       enable row level security;
alter table public.product_prices enable row level security;
drop policy if exists "Read customers" on public.customers;
create policy "Read customers" on public.customers for select to authenticated
  using (public.has_access('customer.') and (status = 'ACTIVE' or public.is_staff()));
drop policy if exists "Read products" on public.products;
create policy "Read products" on public.products for select to authenticated
  using (public.has_access('product.') and (status = 'ACTIVE' or public.is_staff()));
drop policy if exists "Read prices" on public.product_prices;
create policy "Read prices" on public.product_prices for select to authenticated
  using (public.has_access('product.') and (status = 'ACTIVE' or public.is_staff()));
-- No insert/update/delete policies: changes only go through the functions below.

-- 4. Actions (each checks the right, validates, stamps the row, writes the audit log) --
create or replace function public.customer_save(p_id uuid, p_name text, p_address text, p_terms text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id;
begin
  if btrim(coalesce(p_name, '')) = '' or p_terms not in ('Net 15','Net 30','Net 45','COD','Prepaid') then raise exception 'BAD_INPUT'; end if;
  if p_id is null then
    if not public.has_right('customer.add') then raise exception 'NOT_ALLOWED'; end if;
    insert into public.customers (name, address, pay_terms, stamp_by)
      values (btrim(p_name), btrim(coalesce(p_address, '')), p_terms, public._stamp_name()) returning id into v_id;
    perform public._audit('ADD_CUSTOMER', v_id);
  else
    if not public.has_right('customer.edit') then raise exception 'NOT_ALLOWED'; end if;
    update public.customers set name = btrim(p_name), address = btrim(coalesce(p_address, '')), pay_terms = p_terms,
      stamp_action = 'EDITED', stamp_by = public._stamp_name(), stamp_at = now() where id = p_id and status = 'ACTIVE';
    if not found then raise exception 'NOT_FOUND'; end if;
    perform public._audit('EDIT_CUSTOMER', p_id);
  end if;
  return v_id;
end $$;

create or replace function public.customer_set_deleted(p_id uuid, p_deleted boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_deleted and not public.has_right('customer.delete') then raise exception 'NOT_ALLOWED'; end if;
  if not p_deleted and not public.is_staff() then raise exception 'NOT_ALLOWED'; end if;
  update public.customers set status = case when p_deleted then 'INACTIVE' else 'ACTIVE' end,
    stamp_action = case when p_deleted then 'DELETED' else 'RESTORED' end, stamp_by = public._stamp_name(), stamp_at = now() where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public._audit(case when p_deleted then 'DELETE_CUSTOMER' else 'RESTORE_CUSTOMER' end, p_id);
end $$;

create or replace function public.product_save(p_id uuid, p_description text, p_unit text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id;
begin
  if btrim(coalesce(p_description, '')) = '' or btrim(coalesce(p_unit, '')) = '' then raise exception 'BAD_INPUT'; end if;
  if p_id is null then
    if not public.has_right('product.add') then raise exception 'NOT_ALLOWED'; end if;
    insert into public.products (description, unit, stamp_by) values (btrim(p_description), btrim(p_unit), public._stamp_name()) returning id into v_id;
    perform public._audit('ADD_PRODUCT', v_id);
  else
    if not public.has_right('product.edit') then raise exception 'NOT_ALLOWED'; end if;
    update public.products set description = btrim(p_description), unit = btrim(p_unit),
      stamp_action = 'EDITED', stamp_by = public._stamp_name(), stamp_at = now() where id = p_id and status = 'ACTIVE';
    if not found then raise exception 'NOT_FOUND'; end if;
    perform public._audit('EDIT_PRODUCT', p_id);
  end if;
  return v_id;
end $$;

create or replace function public.product_set_deleted(p_id uuid, p_deleted boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_deleted and not public.has_right('product.delete') then raise exception 'NOT_ALLOWED'; end if;
  if not p_deleted and not public.is_staff() then raise exception 'NOT_ALLOWED'; end if;
  update public.products set status = case when p_deleted then 'INACTIVE' else 'ACTIVE' end,
    stamp_action = case when p_deleted then 'DELETED' else 'RESTORED' end, stamp_by = public._stamp_name(), stamp_at = now() where id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public._audit(case when p_deleted then 'DELETE_PRODUCT' else 'RESTORE_PRODUCT' end, p_id);
end $$;

create or replace function public.price_save(p_id uuid, p_product uuid, p_date date, p_price numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id;
begin
  if p_date is null or p_price is null or p_price < 0 then raise exception 'BAD_INPUT'; end if;
  begin
    if p_id is null then
      if not public.has_right('product.price_add') then raise exception 'NOT_ALLOWED'; end if;
      insert into public.product_prices (product_id, effective_date, unit_price, stamp_by)
        values (p_product, p_date, round(p_price, 2), public._stamp_name()) returning id into v_id;
      perform public._audit('ADD_PRICE', v_id);
    else
      if not public.has_right('product.price_edit') then raise exception 'NOT_ALLOWED'; end if;
      update public.product_prices set effective_date = p_date, unit_price = round(p_price, 2),
        stamp_action = 'EDITED', stamp_by = public._stamp_name(), stamp_at = now() where id = p_id and status = 'ACTIVE';
      if not found then raise exception 'NOT_FOUND'; end if;
      perform public._audit('EDIT_PRICE', p_id);
    end if;
  exception when unique_violation then raise exception 'DUPLICATE';
  end;
  return v_id;
end $$;

create or replace function public.price_set_deleted(p_id uuid, p_deleted boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_deleted and not public.has_right('product.price_delete') then raise exception 'NOT_ALLOWED'; end if;
  if not p_deleted and not public.is_staff() then raise exception 'NOT_ALLOWED'; end if;
  begin
    update public.product_prices set status = case when p_deleted then 'INACTIVE' else 'ACTIVE' end,
      stamp_action = case when p_deleted then 'DELETED' else 'RESTORED' end, stamp_by = public._stamp_name(), stamp_at = now() where id = p_id;
  exception when unique_violation then raise exception 'DUPLICATE';
  end;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform public._audit(case when p_deleted then 'DELETE_PRICE' else 'RESTORE_PRICE' end, p_id);
end $$;

revoke all on function public.customer_save(uuid, text, text, text), public.customer_set_deleted(uuid, boolean),
  public.product_save(uuid, text, text), public.product_set_deleted(uuid, boolean),
  public.price_save(uuid, uuid, date, numeric), public.price_set_deleted(uuid, boolean) from public;
grant execute on function public.customer_save(uuid, text, text, text), public.customer_set_deleted(uuid, boolean),
  public.product_save(uuid, text, text), public.product_set_deleted(uuid, boolean),
  public.price_save(uuid, uuid, date, numeric), public.price_set_deleted(uuid, boolean) to authenticated;
