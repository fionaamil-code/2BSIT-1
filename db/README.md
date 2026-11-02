# Hope, Inc. ERP — Database setup (no Docker)

Our database is **PostgreSQL hosted on Supabase**. Every change to it is a numbered SQL file in
`db/migrations/`, applied by one script (`migrate.mjs`). Git holds the history; the script applies it.
Anyone can rebuild an identical database from scratch by running the script.

## 1. What you need (all free)

| Tool | Check it works |
|---|---|
| Git + a GitHub account (with access to the team repo) | `git --version` |
| Node.js 18 or newer (<https://nodejs.org>, LTS) | `node -v` |
| A Supabase account (sign in with GitHub) | <https://supabase.com> |

No Docker, no Supabase CLI, no `psql` needed.

## 2. Which database do I use?

| Database | Who runs migrations on it | Use it for |
|---|---|---|
| **Your own Supabase project** (you create it, step 3) | You | Development and testing. Break it freely; rebuild any time. |
| **Team Supabase project** (shared, connected to the website) | **DB Admin only**, after a PR is merged to the integration branch | What the team demos and the Developer's site uses. |

Do not run migrations against the team project from a feature branch.

## 3. One-time setup (about 10 minutes)

1. **Clone and branch** (the Scrum Master already created the branches; use your task's branch):
   ```bash
   git clone <team-repo-url>
   cd <repo>
   git checkout <your-branch>
   ```
2. **Create your own Supabase project:** supabase.com → *New project* → name it `hope-<yourname>`,
   pick the region closest to you (e.g. Singapore), and **write down the database password** you set.
3. **Copy the connection string:** open your project → **Connect** (top bar) → choose the
   **Session pooler** string. It looks like
   `postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres`.
   Use the *Session pooler* one: the "Direct connection" string is IPv6-only and often fails at home or on campus Wi-Fi.
4. **Create your `.env`:**
   ```bash
   cd db
   cp .env.example .env        # Windows PowerShell: copy .env.example .env
   ```
   Open `db/.env`, paste the string, and replace `[YOUR-PASSWORD]` with your password.
   If the password contains `@ : / # ? %`, URL-encode it (`@` → `%40`, `#` → `%23`).
   `.env` is git-ignored. **Never commit it, paste it in chat, or screenshot it.**
5. **Install and run:**
   ```bash
   npm install
   npm run migrate
   ```
   Expected output ends with:
   ```
   → applying 0000_smoke_test.sql ... done
   ✔ Applied 1 migration(s).
   ```
6. **Check:** `npm run migrate:status` should list every file as `applied`.
   In Supabase → *Table Editor* you should now see a `schema_migrations` table.

Setup done. Running `npm run migrate` again is always safe: it only applies files not yet applied.

## 4. Everyday commands (run inside `db/`)

| Command | What it does |
|---|---|
| `npm run migrate` | Applies all pending migrations, in number order. |
| `npm run migrate:status` | Lists each file as `applied`, `pending` or `CHANGED`. |
| `npm run migrate:new -- base_tables` | Creates the next numbered file, e.g. `0002_base_tables.sql`. |

After every `git pull`, run `npm run migrate` so your database matches the code.

## 5. Rules for writing migrations (DB Admin)

1. **One migration = one purpose = one PR**, linked to its task issue.
2. **Never edit a migration after it is merged.** The runner stores a checksum and will stop with an error. Fix mistakes with a *new* migration.
3. **Name files `NNNN_lowercase_description.sql`.** The number sets the order. Use `migrate:new` so numbers never clash.
4. **No `BEGIN`/`COMMIT` in the file.** The runner wraps each file in a transaction: it fully succeeds or changes nothing.
5. **Make it re-readable:** comment what and why at the top. Prefer `create table`, not `drop table`, so you can never wipe teammates' data by accident.
6. **No passwords, keys or real personal data in any file.** Seed accounts are created without passwords (set-password link).
7. **Tables in `public` are exposed through Supabase's API.** Every new table needs `alter table ... enable row level security;` plus the right policies.

## 6. Troubleshooting

| Message | Fix |
|---|---|
| `DATABASE_URL is not set` | You skipped step 4, or `.env` is not inside the `db/` folder. |
| `still contains [YOUR-PASSWORD]` | Replace the placeholder with your real password. |
| `ENOTFOUND` / `ENETUNREACH` | You used the Direct connection. Use the **Session pooler** string. |
| `password authentication failed` | Wrong password. Supabase → Project Settings → Database → *Reset database password*, then update `.env`. |
| `not a valid URL` | A special character in the password needs URL-encoding (step 4). |
| `... was already applied but its contents have changed` | Someone edited an applied file. `git checkout -- db/migrations/<file>` and add a new migration instead. |
| `failed and was rolled back` | Read the message, fix the SQL in your new file, and run again. Nothing from that file was saved. |
| Supabase project paused | Free projects pause after about a week idle. Open the dashboard and click *Restore*. |

## 7. Starting over (your own project only)

Supabase → *SQL Editor* → run:
```sql
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
```
Then `npm run migrate` rebuilds everything from the files. **Never do this on the team project.**
