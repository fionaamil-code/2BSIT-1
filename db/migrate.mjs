#!/usr/bin/env node
// Hope, Inc. ERP - migration runner (no Docker, no Supabase CLI).
//
//   npm run migrate              apply every pending migration, in order
//   npm run migrate:status       show which migrations are applied / pending
//   npm run migrate:new -- name  create the next numbered migration file
//
// Migrations live in db/migrations/NNNN_description.sql and run in number order.
// Each file runs inside one transaction: it fully succeeds or changes nothing.
// Applied files are recorded in public.schema_migrations with a checksum, so an
// applied file must never be edited - add a new migration instead.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, 'migrations');
const FILE_RE = /^(\d{4})_([a-z0-9_]+)\.sql$/;
const LOCK_ID = 727001; // any constant; stops two people migrating the same DB at once

// ---- helpers --------------------------------------------------------------
function loadDotEnv() {
  const file = path.join(here, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value; // real env vars win
  }
}

const fail = (msg) => { console.error(`\n✖ ${msg}\n`); process.exit(1); };

// Line endings differ between Windows and Mac/Linux; ignore them when hashing.
const checksum = (text) =>
  crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');

function listMigrations() {
  if (!fs.existsSync(migrationsDir)) fail(`Folder not found: ${migrationsDir}`);
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const bad = files.filter((f) => !FILE_RE.test(f));
  if (bad.length) fail(`Bad file name(s): ${bad.join(', ')}\nUse NNNN_lowercase_description.sql, e.g. 0002_base_tables.sql`);
  const numbers = files.map((f) => f.slice(0, 4));
  const dup = numbers.find((n, i) => numbers.indexOf(n) !== i);
  if (dup) fail(`Two migrations share the number ${dup}. Renumber one of them.`);
  return files.map((name) => {
    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    return { name, sql, sum: checksum(sql) };
  });
}

function connectionConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) fail('DATABASE_URL is not set.\nCopy db/.env.example to db/.env and paste your Supabase connection string (see db/README.md).');
  if (/\[YOUR-PASSWORD\]/i.test(url)) fail('DATABASE_URL still contains [YOUR-PASSWORD]. Replace it with your real database password.');
  let host;
  try { host = new URL(url).hostname; } catch { fail('DATABASE_URL is not a valid URL. If your password has special characters, URL-encode them (@ becomes %40).'); }
  const local = ['localhost', '127.0.0.1'].includes(host);
  return { host, config: { connectionString: url, ssl: local ? false : { rejectUnauthorized: false } } };
}

async function connect() {
  const { host, config } = connectionConfig();
  const client = new pg.Client(config);
  try {
    await client.connect();
  } catch (e) {
    const hint =
      e.code === 'ENOTFOUND' || e.code === 'ENETUNREACH' || /EAI_AGAIN/.test(e.message)
        ? '\nHint: use the "Session pooler" string from Supabase (the direct connection is IPv6-only).'
        : /password authentication failed/i.test(e.message)
        ? '\nHint: wrong database password. In Supabase: Project Settings -> Database -> Reset database password.'
        : '';
    fail(`Could not connect to ${host}\n${e.message}${hint}`);
  }
  console.log(`Connected to ${host}`);
  return client;
}

async function ensureTrackingTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      filename   text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now(),
      applied_by text not null default current_user
    );
    -- Supabase exposes public tables through its API. RLS on + no policies = API cannot read this table.
    alter table public.schema_migrations enable row level security;
  `);
}

async function loadApplied(client) {
  const { rows } = await client.query('select filename, checksum, applied_at from public.schema_migrations order by filename');
  return new Map(rows.map((r) => [r.filename, r]));
}

// ---- commands -------------------------------------------------------------
async function up() {
  const files = listMigrations();
  const client = await connect();
  try {
    await client.query('select pg_advisory_lock($1)', [LOCK_ID]);
    await ensureTrackingTable(client);
    const applied = await loadApplied(client);

    for (const f of files) {
      const rec = applied.get(f.name);
      if (rec && rec.checksum !== f.sum) {
        fail(`${f.name} was already applied but its contents have changed.\nNever edit an applied migration - undo your edit (git checkout) and add a new migration instead.`);
      }
    }
    const missing = [...applied.keys()].filter((n) => !files.some((f) => f.name === n));
    if (missing.length) console.warn(`⚠ Applied in the database but missing from your folder (git pull?): ${missing.join(', ')}`);

    const pending = files.filter((f) => !applied.has(f.name));
    const lastApplied = [...applied.keys()].sort().pop();
    for (const f of pending) {
      if (lastApplied && f.name < lastApplied) console.warn(`⚠ ${f.name} is numbered lower than the last applied migration (${lastApplied}). Applying anyway.`);
    }
    if (!pending.length) { console.log('✔ Database is up to date. Nothing to apply.'); return; }

    for (const f of pending) {
      process.stdout.write(`→ applying ${f.name} ... `);
      try {
        await client.query('begin');
        await client.query(f.sql);
        await client.query('insert into public.schema_migrations (filename, checksum) values ($1, $2)', [f.name, f.sum]);
        await client.query('commit');
        console.log('done');
      } catch (e) {
        await client.query('rollback').catch(() => {});
        console.log('FAILED');
        const where = e.position ? ` (character ${e.position} of the file)` : '';
        fail(`${f.name} failed and was rolled back${where}:\n${e.message}\nNothing from this file was saved. Fix the SQL and run again.`);
      }
    }
    console.log(`✔ Applied ${pending.length} migration(s).`);
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

async function status() {
  const files = listMigrations();
  const client = await connect();
  try {
    await ensureTrackingTable(client);
    const applied = await loadApplied(client);
    console.log('');
    for (const f of files) {
      const rec = applied.get(f.name);
      const state = !rec ? 'pending ' : rec.checksum !== f.sum ? 'CHANGED ' : 'applied ';
      const when = rec ? rec.applied_at.toISOString().slice(0, 16).replace('T', ' ') : '';
      console.log(`  ${state} ${f.name}  ${when}`);
    }
    const pending = files.filter((f) => !applied.has(f.name)).length;
    console.log(`\n${files.length} file(s), ${files.length - pending} applied, ${pending} pending.`);
  } finally {
    await client.end();
  }
}

function create(rawName) {
  const name = (rawName || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!name) fail('Give the migration a name, e.g.:  npm run migrate:new -- base_tables');
  const nums = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).map((f) => f.match(FILE_RE)).filter(Boolean).map((m) => Number(m[1]))
    : [];
  const next = String((nums.length ? Math.max(...nums) : -1) + 1).padStart(4, '0');
  const file = `${next}_${name}.sql`;
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(
    path.join(migrationsDir, file),
    `-- ${file}\n-- What this migration does and why (one or two lines).\n-- Do not add BEGIN/COMMIT: the runner wraps the file in a transaction.\n-- Do not edit this file after it is merged and applied - add a new migration.\n\n`
  );
  console.log(`✔ Created db/migrations/${file}`);
}

// ---- main -----------------------------------------------------------------
loadDotEnv();
const [cmd = 'up', arg] = process.argv.slice(2);
if (cmd === 'up') await up();
else if (cmd === 'status') await status();
else if (cmd === 'new') create(arg);
else fail(`Unknown command "${cmd}". Use: up | status | new <name>`);
