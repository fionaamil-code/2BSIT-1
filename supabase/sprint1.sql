-- Sprint 1 backend: rights, audit log, user management rules.
-- Run AFTER schema.sql, in Supabase: SQL Editor > New query > paste the contents > Run. Safe to run again.

-- 1. Rights catalogue (the 36 rights from the design) ---------------------
create table if not exists public.rights (
  code text primary key, module text not null, label text not null, sort int not null
);
insert into public.rights (code, module, label, sort) values
 ('customer.add','Customer Management','Add Customer',101),('customer.edit','Customer Management','Edit Customer',102),('customer.delete','Customer Management','Delete Customer',103),
 ('product.add','Product Management','Add Product',201),('product.edit','Product Management','Edit Product',202),('product.delete','Product Management','Delete Product',203),
 ('product.price_add','Product Management','Add Price',204),('product.price_edit','Product Management','Edit Price',205),('product.price_delete','Product Management','Delete Price',206),
 ('sale.add','Sales','Add Sale',301),('sale.edit','Sales','Edit Sale',302),('sale.delete','Sales','Delete Sale',303),('sale.view','Sales','View Sale Details',304),
 ('sale.line_add','Sales','Add Sale Detail',305),('sale.line_edit','Sales','Edit Sale Detail',306),('sale.line_delete','Sales','Delete Sale Detail',307),
 ('hr.job_add','Human Resources','Add Job',401),('hr.job_edit','Human Resources','Edit Job',402),('hr.job_delete','Human Resources','Delete Job',403),
 ('hr.dept_add','Human Resources','Add Department',404),('hr.dept_edit','Human Resources','Edit Department',405),('hr.dept_delete','Human Resources','Delete Department',406),
 ('hr.emp_add','Human Resources','Add Employee',407),('hr.emp_edit','Human Resources','Edit Employee',408),('hr.emp_delete','Human Resources','Delete Employee',409),
 ('hr.history_view','Human Resources','View Job History',410),('hr.history_add','Human Resources','Add Job History',411),('hr.history_edit','Human Resources','Edit Job History',412),('hr.history_delete','Human Resources','Delete Job History',413),
 ('report.top_customers','Reports','Top Customers',501),('report.product_master','Reports','Product Master List',502),('report.top_products','Reports','Top Products',503),
 ('report.active_employees','Reports','Active Employees',504),('report.all_employees','Reports','All Employees',505),('report.employee_history','Reports','Employee Job History',506),('report.top_sales','Reports','Top Sales',507)
on conflict (code) do update set module = excluded.module, label = excluded.label, sort = excluded.sort;

create table if not exists public.user_rights (
  user_id uuid not null references public.profiles (id) on delete cascade,
  right_code text not null references public.rights (code) on delete cascade,
  primary key (user_id, right_code)
);

-- 2. Audit log -------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb
);

-- 3. Who is asking? (only ACTIVE accounts count) ---------------------------
create or replace function public.app_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and status = 'ACTIVE'
$$;
grant execute on function public.app_role() to authenticated;

-- 4. Row Level Security ----------------------------------------------------
alter table public.rights      enable row level security;
alter table public.user_rights enable row level security;
alter table public.audit_log   enable row level security;

drop policy if exists "Read rights catalogue" on public.rights;
create policy "Read rights catalogue" on public.rights for select to authenticated using (true);

drop policy if exists "Read own rights" on public.user_rights;
create policy "Read own rights" on public.user_rights for select to authenticated using (user_id = auth.uid());
drop policy if exists "Staff read rights" on public.user_rights;
create policy "Staff read rights" on public.user_rights for select to authenticated using (public.app_role() in ('ADMIN','SUPERADMIN'));

drop policy if exists "Superadmin reads audit log" on public.audit_log;
create policy "Superadmin reads audit log" on public.audit_log for select to authenticated using (public.app_role() = 'SUPERADMIN');

drop policy if exists "Superadmin reads all profiles" on public.profiles;
create policy "Superadmin reads all profiles" on public.profiles for select to authenticated using (public.app_role() = 'SUPERADMIN');
drop policy if exists "Admin reads admins and users" on public.profiles;
create policy "Admin reads admins and users" on public.profiles for select to authenticated
  using (public.app_role() = 'ADMIN' and role in ('ADMIN','USER') and status <> 'PENDING');
-- No insert/update/delete policies: every change goes through the functions below.

-- 5. Actions (each one checks permission, applies the rules, and writes the audit log) --
create or replace function public.admin_set_status(p_user uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare me text := public.app_role(); t public.profiles;
begin
  if me is null or me not in ('ADMIN','SUPERADMIN') then raise exception 'NOT_ALLOWED'; end if;
  if p_status not in ('ACTIVE','BLOCKED') then raise exception 'BAD_STATUS'; end if;
  select * into t from public.profiles where id = p_user for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if me = 'ADMIN' and (t.role <> 'USER' or t.status = 'PENDING') then raise exception 'NOT_ALLOWED'; end if;
  if p_status = 'BLOCKED' then
    if t.status = 'PENDING' then raise exception 'NOT_ALLOWED'; end if;
    if p_user = auth.uid() then raise exception 'SELF_BLOCK'; end if;
    if t.role = 'SUPERADMIN' and t.status = 'ACTIVE' and
       (select count(*) from public.profiles where role = 'SUPERADMIN' and status = 'ACTIVE' and id <> p_user) = 0
    then raise exception 'LAST_SUPERADMIN'; end if;
  end if;
  update public.profiles set status = p_status where id = p_user;
  insert into public.audit_log (actor_id, action, target_id, detail) values (
    auth.uid(),
    case when t.status = 'PENDING' then 'APPROVE_USER' when p_status = 'BLOCKED' then 'BLOCK_USER' else 'UNBLOCK_USER' end,
    p_user, jsonb_build_object('from', t.status, 'to', p_status));
end $$;

create or replace function public.admin_update_user(p_user uuid, p_full_name text, p_username text, p_role text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare me text := public.app_role(); t public.profiles;
begin
  if me is null or me not in ('ADMIN','SUPERADMIN') then raise exception 'NOT_ALLOWED'; end if;
  select * into t from public.profiles where id = p_user for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if me = 'ADMIN' and t.role <> 'USER' then raise exception 'NOT_ALLOWED'; end if;
  if btrim(coalesce(p_full_name, '')) = '' or p_username !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'BAD_INPUT'; end if;
  if p_role is not null and p_role <> t.role then
    if me <> 'SUPERADMIN' or t.role = 'SUPERADMIN' or p_role not in ('ADMIN','USER') then raise exception 'NOT_ALLOWED'; end if;
  end if;
  begin
    update public.profiles set full_name = btrim(p_full_name), username = p_username, role = coalesce(p_role, role) where id = p_user;
  exception when unique_violation then raise exception 'USERNAME_TAKEN';
  end;
  if coalesce(p_role, t.role) = 'ADMIN' then delete from public.user_rights where user_id = p_user; end if;
  insert into public.audit_log (actor_id, action, target_id, detail) values (
    auth.uid(), case when p_role is not null and p_role <> t.role then 'CHANGE_ROLE' else 'EDIT_USER' end, p_user,
    jsonb_build_object('role_from', t.role, 'role_to', coalesce(p_role, t.role)));
end $$;

create or replace function public.admin_save_rights(p_user uuid, p_codes text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare me text := public.app_role(); t public.profiles; n int;
begin
  if me is null or me not in ('ADMIN','SUPERADMIN') then raise exception 'NOT_ALLOWED'; end if;
  select * into t from public.profiles where id = p_user for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if t.role <> 'USER' or t.status = 'PENDING' then raise exception 'NOT_ALLOWED'; end if;
  delete from public.user_rights where user_id = p_user;
  insert into public.user_rights (user_id, right_code) select p_user, code from public.rights where code = any(coalesce(p_codes, '{}'));
  get diagnostics n = row_count;
  insert into public.audit_log (actor_id, action, target_id, detail) values (auth.uid(), 'SAVE_RIGHTS', p_user, jsonb_build_object('count', n));
end $$;

revoke all on function public.admin_set_status(uuid, text)                  from public;
revoke all on function public.admin_update_user(uuid, text, text, text)    from public;
revoke all on function public.admin_save_rights(uuid, text[])              from public;
grant execute on function public.admin_set_status(uuid, text)               to authenticated;
grant execute on function public.admin_update_user(uuid, text, text, text) to authenticated;
grant execute on function public.admin_save_rights(uuid, text[])           to authenticated;
