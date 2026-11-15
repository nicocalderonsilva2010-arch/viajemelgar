-- Additive Nexora Market schema. Safe to apply alongside the existing album tables.
-- If public.profiles already exists with a different shape, stop before changing anything
-- and review/adapt that table first; this migration never drops or renames it.
do $$
begin
  if to_regclass('public.profiles') is not null and exists (
    select required.column_name
    from (values ('user_id'), ('email'), ('coin_balance'), ('is_admin')) as required(column_name)
    where not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = 'profiles'
        and c.column_name = required.column_name
    )
  ) then
    raise exception 'Existing public.profiles needs review: expected user_id, email, coin_balance, is_admin. No changes applied.';
  end if;
  if to_regclass('public.profiles') is not null and not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attname = 'user_id' and not a.attisdropped
    where i.indrelid = 'public.profiles'::regclass and i.indisunique
      and i.indnkeyatts = 1 and a.attnum = any(i.indkey)
  ) then
    raise exception 'Existing public.profiles.user_id must be unique. Review schema before applying; no changes applied.';
  end if;
  if exists (
    select 1
    from (values
      ('coin_transactions','user_id'),('coin_transactions','delta'),('coin_transactions','reason'),
      ('store_items','id'),('store_items','slug'),('store_items','name'),('store_items','price'),('store_items','rarity'),('store_items','active'),
      ('user_inventory','user_id'),('user_inventory','item_id'),
      ('equipped_items','user_id'),('equipped_items','item_id'),
      ('market_admin_logs','actor_id'),('market_admin_logs','action')
    ) as required(table_name, column_name)
    where to_regclass('public.' || required.table_name) is not null
      and not exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = required.table_name
          and c.column_name = required.column_name
      )
  ) then
    raise exception 'An existing Nexora Market table has an incompatible shape. Review it before applying; no changes applied.';
  end if;
  if exists (
    select 1 from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('profiles','coin_transactions','store_items','user_inventory','equipped_items')
      and p.cmd in ('INSERT','UPDATE','DELETE','ALL')
  ) then
    raise exception 'Existing write policies found on Nexora Market tables. Review their permissions before applying; no changes applied.';
  end if;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  coin_balance bigint not null default 0 check (coin_balance >= 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.coin_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  delta bigint not null check (delta <> 0),
  reason text not null,
  reference_item uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price bigint not null check (price > 0),
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary')),
  active boolean not null default true,
  preview_style text not null default 'basic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  item_id uuid not null references public.store_items(id),
  purchased_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.equipped_items (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  item_id uuid references public.store_items(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_admin_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  item_id uuid,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coin_transactions_user_created_idx on public.coin_transactions (user_id, created_at desc);
create index if not exists user_inventory_user_purchased_idx on public.user_inventory (user_id, purchased_at desc);
create index if not exists store_items_active_price_idx on public.store_items (active, price);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'coin_transactions_reference_item_fkey'
  ) then
    alter table public.coin_transactions add constraint coin_transactions_reference_item_fkey
      foreign key (reference_item) references public.store_items(id);
  end if;
end $$;

create or replace function public.nexora_market_profile_on_signup()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists nexora_market_profile_created on auth.users;
create trigger nexora_market_profile_created
  after insert on auth.users
  for each row execute function public.nexora_market_profile_on_signup();

alter table public.profiles enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.store_items enable row level security;
alter table public.user_inventory enable row level security;
alter table public.equipped_items enable row level security;
alter table public.market_admin_logs enable row level security;

grant select on public.profiles, public.coin_transactions, public.user_inventory, public.equipped_items to authenticated;
grant select on public.market_admin_logs to authenticated;
grant select on public.store_items to anon, authenticated;
grant insert, update on public.store_items to authenticated;
revoke delete on public.store_items from anon, authenticated;

create or replace function public.nexora_is_market_admin()
returns boolean language sql stable security definer set search_path = public, auth, pg_temp
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and is_admin)
$$;

insert into public.profiles (user_id, email)
  select id, coalesce(email, '') from auth.users
  on conflict (user_id) do nothing;

drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.nexora_is_market_admin());

drop policy if exists "catalog visible" on public.store_items;
create policy "catalog visible" on public.store_items for select to anon, authenticated
  using (active or auth.uid() is not null);
drop policy if exists "admins manage catalog" on public.store_items;
create policy "admins manage catalog" on public.store_items for all to authenticated
  using (public.nexora_is_market_admin()) with check (public.nexora_is_market_admin());

drop policy if exists "transactions read self or admin" on public.coin_transactions;
create policy "transactions read self or admin" on public.coin_transactions for select to authenticated
  using (user_id = auth.uid() or public.nexora_is_market_admin());

drop policy if exists "inventory read self or admin" on public.user_inventory;
create policy "inventory read self or admin" on public.user_inventory for select to authenticated
  using (user_id = auth.uid() or public.nexora_is_market_admin());

drop policy if exists "equipped read self or admin" on public.equipped_items;
create policy "equipped read self or admin" on public.equipped_items for select to authenticated
  using (user_id = auth.uid() or public.nexora_is_market_admin());

drop policy if exists "market admin logs read admin" on public.market_admin_logs;
create policy "market admin logs read admin" on public.market_admin_logs for select to authenticated
  using (public.nexora_is_market_admin());

create or replace function public.nexora_log_market_admin_change()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.market_admin_logs (actor_id, item_id, action, after_state)
      values (auth.uid(), new.id, tg_op, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.market_admin_logs (actor_id, item_id, action, before_state, after_state)
      values (auth.uid(), new.id, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.market_admin_logs (actor_id, item_id, action, before_state)
      values (auth.uid(), old.id, tg_op, to_jsonb(old));
    return old;
  end if;
end;
$$;

drop trigger if exists nexora_store_items_admin_audit on public.store_items;
create trigger nexora_store_items_admin_audit after insert or update or delete on public.store_items
  for each row execute function public.nexora_log_market_admin_change();

create or replace function public.nexora_buy_item(p_item_id uuid)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_item public.store_items%rowtype;
  v_balance bigint;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  select * into v_item from public.store_items where id = p_item_id and active for share;
  if not found then raise exception 'ITEM_UNAVAILABLE' using errcode = 'P0002'; end if;
  select coin_balance into v_balance from public.profiles where user_id = v_user for update;
  if not found then raise exception 'PROFILE_REQUIRED' using errcode = 'P0002'; end if;
  if exists (select 1 from public.user_inventory where user_id = v_user and item_id = p_item_id) then
    raise exception 'ITEM_ALREADY_OWNED' using errcode = '23505';
  end if;
  if v_balance < v_item.price then raise exception 'INSUFFICIENT_COINS' using errcode = '22003'; end if;
  update public.profiles set coin_balance = coin_balance - v_item.price where user_id = v_user returning coin_balance into v_balance;
  insert into public.user_inventory (user_id, item_id) values (v_user, p_item_id);
  insert into public.coin_transactions (user_id, delta, reason, reference_item)
    values (v_user, -v_item.price, 'Compra: ' || v_item.name, p_item_id);
  return jsonb_build_object('balance', v_balance, 'item', to_jsonb(v_item));
end;
$$;

create or replace function public.nexora_equip_item(p_item_id uuid)
returns void language plpgsql security definer set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if p_item_id is not null and not exists (
    select 1 from public.user_inventory where user_id = auth.uid() and item_id = p_item_id
  ) then raise exception 'ITEM_NOT_OWNED' using errcode = '42501'; end if;
  insert into public.equipped_items (user_id, item_id, updated_at)
    values (auth.uid(), p_item_id, now())
    on conflict (user_id) do update set item_id = excluded.item_id, updated_at = now();
end;
$$;

create or replace function public.nexora_admin_adjust_coins(p_user_id uuid, p_delta bigint, p_reason text)
returns bigint language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare v_balance bigint;
begin
  if auth.uid() is null or not public.nexora_is_market_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if p_delta = 0 or length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'INVALID_ADJUSTMENT'; end if;
  update public.profiles set coin_balance = coin_balance + p_delta
    where user_id = p_user_id and coin_balance + p_delta >= 0 returning coin_balance into v_balance;
  if not found then raise exception 'PROFILE_MISSING_OR_NEGATIVE_BALANCE'; end if;
  insert into public.coin_transactions (user_id, delta, reason, created_by)
    values (p_user_id, p_delta, trim(p_reason), auth.uid());
  return v_balance;
end;
$$;

revoke all on function public.nexora_buy_item(uuid) from public;
grant execute on function public.nexora_buy_item(uuid) to authenticated;
revoke all on function public.nexora_equip_item(uuid) from public;
grant execute on function public.nexora_equip_item(uuid) to authenticated;
revoke all on function public.nexora_admin_adjust_coins(uuid,bigint,text) from public;
grant execute on function public.nexora_admin_adjust_coins(uuid,bigint,text) to authenticated;

insert into public.store_items (slug, name, description, price, rarity, preview_style) values
  ('basic', 'Marco Básico', 'Un marco limpio para cualquier recuerdo.', 20, 'common', 'basic'),
  ('crimson', 'Crimson Frame', 'Cristal oscuro con acentos carmesí.', 35, 'common', 'crimson'),
  ('neon-red', 'Neon Red', 'Luz roja precisa sobre vidrio ahumado.', 45, 'rare', 'neon'),
  ('luxury-gold', 'Luxury Gold', 'Detalles metálicos en dorado cálido.', 60, 'rare', 'gold'),
  ('glass-premium', 'Glass Premium', 'Capas translúcidas con reflejos suaves.', 80, 'epic', 'glass'),
  ('melgar-edition', 'Melgar Edition', 'Una pieza exclusiva de este viaje.', 100, 'epic', 'melgar'),
  ('memories-forever', 'Memories Forever', 'Un acabado especial para guardar por siempre.', 120, 'epic', 'memories'),
  ('nexora-exclusive', 'Nexora Exclusive', 'La edición más rara del mercado.', 200, 'legendary', 'exclusive')
on conflict (slug) do nothing;

-- Promote the first market administrator manually in the Supabase SQL editor after signup:
-- update public.profiles set is_admin = true where email = 'owner@example.com';

