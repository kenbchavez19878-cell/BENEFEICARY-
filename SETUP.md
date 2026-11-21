# BENEFITRACK Setup Guide

This guide sets up a local development installation on another PC. Commands use Windows PowerShell and run from the project root unless stated otherwise.

## Project readiness

Status reviewed on **22 November 2026**:

| Area | Current state |
| --- | --- |
| Backend | Django 6.0 with Django REST Framework and PostgreSQL. The active database responds to `SELECT 1`; Django system checks pass. |
| Database schema | All application migrations through `0015_payoutproof` are applied locally. No model changes require a new migration. |
| Frontend | React, TypeScript, Vite, and Tailwind CSS. The latest completed TypeScript check and production build passed. |
| Workflow | Ordered backend transitions remain enforced for AICS and Women & Solo Parent. Program-specific staff access remains isolated. |
| Step 6 | Records release method, applicable Guarantee Letter number, payout date, and accountable payout/service officer. No payout photo or OR upload is required here. |
| Step 8 | Financial case closure requires verified payout evidence and an Official Receipt (OR) number matching the approved amount, payout date, and approval cycle. Non-financial/referral services remain exempt from financial proof requirements. |
| Evidence access | Authorized users can open evidence from completed beneficiary rows, profiles, history entries, and dashboard proof actions. Preview dialogs display the receipt/photo and OR details. |
| Latest full validation | 102 backend tests passed; TypeScript and the production build passed. The current documentation update was checked with Django system, migration, and database health checks; it does not represent a new full-suite run. |
| Local workspace | Beneficiary, case/workflow, document, and payout-proof tables are empty; upload storage is empty. Eight existing local accounts remain intact. Old build output and Vite cache were removed. Python checks can regenerate bytecode caches normally. |

The database, accounts, uploads, installed dependencies, and local `.env` are not transferred by cloning GitHub. Configure each new installation separately. The local workspace counts above are a snapshot, not initial data included in the repository.

## 1. Install prerequisites

- **Git** with access to the GitHub repository.
- **Python 3.12 or newer** compatible with the selected Django version. This checkout was verified locally with Python 3.14.2 and Django 6.0.
- **Node.js 22 or newer**, with npm. The local installation uses Node.js 25.2.1. Use a Node version supported by the dependencies in `package-lock.json`.
- **PostgreSQL 14 or newer**, including its command-line tools. Django 6.0 requires at least PostgreSQL 14. Remember the administrator password chosen during installation.

Check the tools in a new PowerShell terminal:

```powershell
git --version
python --version
node --version
npm.cmd --version
psql --version
```

The `npm.cmd` spelling avoids PowerShell script execution-policy issues with `npm.ps1`.

## 2. Clone the repository

```powershell
git clone https://github.com/kenbchavez19878-cell/BENEFEICARY-.git
cd BENEFEICARY-
```

If GitHub asks for authentication, use an account with repository access. Ensure the source PC has committed and pushed the desired changes before cloning them elsewhere.

## 3. Create a Python environment and install dependencies

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
npm.cmd ci
```

Use `npm ci` with the committed `package-lock.json`; it installs the locked frontend dependencies. Keep the virtual environment active when running `npm run dev`, because the backend script invokes `python` from the current terminal's PATH.

If activation is blocked, allow it for this PowerShell process only, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

On macOS/Linux, the equivalent activation is `source venv/bin/activate`; use `npm` instead of `npm.cmd`.

## 4. Create the PostgreSQL database

Start the PostgreSQL service, then connect using its administrator account:

```powershell
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres
```

For a new installation, enter these commands **inside psql**:

```sql
CREATE ROLE benefitrack_app WITH LOGIN;
\password benefitrack_app
CREATE DATABASE benefitrack OWNER benefitrack_app;
\q
```

The `\password` command prompts for a new password without placing it in SQL text or shell history. Use that same password in `backend/.env`. Run database/role creation only once; if they already exist, use the existing database and role rather than dropping them.

## 5. Configure backend/.env

Create the local configuration from the template:

```powershell
Copy-Item backend/.env.example backend/.env
```

Do not overwrite an existing `.env` containing working configuration. Generate a unique Django key:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Edit `backend/.env` with your own values:

```ini
DJANGO_SECRET_KEY='replace-with-the-generated-key'
DJANGO_DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=benefitrack
DB_USER=benefitrack_app
DB_PASSWORD='replace-with-the-database-role-password'
DB_HOST=127.0.0.1
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Keep secret values quoted, especially when they contain `#` or spaces. Replace every placeholder. The default upload directory is `backend/media`; `MEDIA_ROOT` is optional. If overriding it, use a writable absolute path on the new PC.

The backend reads `backend/.env`, not a root frontend environment file. Existing process/system environment variables take precedence because `load_dotenv` does not override them. Never commit `.env` or real credentials. No SMS gateway or background SMS worker is required.

## 6. Apply migrations and initialize local access

```powershell
python backend/manage.py migrate
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py showmigrations api
```

The migration check should report no changes; applied migrations should display `[X]`. Do not generate new migrations merely to start an unchanged checkout.

To create the predefined local demonstration accounts on the **new database**:

```powershell
python backend/manage.py sync_demo_accounts
```

This command creates/synchronizes the three accounts defined in `backend/api/demo_accounts.json` and aligns program access:

| Username | Login role | Program access |
| --- | --- | --- |
| `staff_aics` | MSWD Staff | AICS |
| `staff_women_solo` | MSWD Staff | Women & Solo Parent |
| `barangaysecretary` | Barangay Secretary | Barangay intake and submissions for both programs |

Use the login page's Quick Demo Credentials cards to fill the configured local credentials. Synchronization resets these accounts to the predefined passwords and deactivates matching legacy demo identities; do not run it against an existing shared installation unless that behavior is intended. It does not create beneficiary records or migrate the source PC's accounts.

Optionally create a Django administration superuser:

```powershell
python backend/manage.py createsuperuser
```

A Django superuser is an administration account; application portal access additionally depends on `ApplicationAccount` role/program mapping. For an empty start, do not run the sample-profile seeder.

## 7. Start both servers

With the Python environment active and the terminal at the project root:

```powershell
npm.cmd run dev
```

The root command uses `concurrently` to start:

| Process | Address |
| --- | --- |
| React/Vite frontend | `http://localhost:5173` |
| Django API | `http://127.0.0.1:8000` |
| Database health endpoint | `http://127.0.0.1:8000/api/health/` |

Open the frontend address to sign in. Use **Ctrl+C** in the same terminal to stop both servers. If either child process exits, the root command stops the other process too.

For troubleshooting, start them separately in two terminals at the project root:

```powershell
# Terminal 1: activate the Python environment first
.\venv\Scripts\Activate.ps1
npm.cmd run dev:backend
```

```powershell
# Terminal 2
npm.cmd run dev:frontend
```

## 8. Verify the installation

With both servers running, check Django directly and through Vite:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health/
Invoke-RestMethod http://localhost:5173/api/health/
```

Both should return `status: ok` and `database: connected`. This endpoint actively queries PostgreSQL with `SELECT 1` and returns HTTP 503 if the connection fails.

Run the source checks and build:

```powershell
npx.cmd tsc --noEmit
npm.cmd run build
```

The build produces `dist/`. It does not start or bundle Django; Vite's development proxy is not included in that output.

For backend tests, the database role needs permission to create the separate test database. For a local development role, an administrator can grant it inside psql:

```sql
ALTER ROLE benefitrack_app CREATEDB;
```

Then run:

```powershell
python backend/manage.py test api --keepdb --noinput
```

Django uses a separate test database, normally `test_benefitrack`. Keep it distinct from the application database. `--keepdb` preserves that test database for later runs. The latest completed full run contained 102 passing tests; future updates may change the count.

## Troubleshooting

### PostgreSQL is not running or connection is refused

List installed services:

```powershell
Get-Service *postgres*
```

Start the correct service in an administrator terminal, replacing the example name with the one shown on your PC:

```powershell
Start-Service -Name 'postgresql-x64-17'
Test-NetConnection 127.0.0.1 -Port 5432
```

Confirm the port, database, role, and password match `.env`. Test the application login independently:

```powershell
psql -h 127.0.0.1 -p 5432 -U benefitrack_app -d benefitrack -c "SELECT 1;"
```

### psql is not recognized

Find the PostgreSQL installation's `bin` directory, typically `C:\Program Files\PostgreSQL\<version>\bin`. Either add it to PATH and open a new terminal, or invoke the executable directly:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' --version
```

Replace `17` with the installed version. If the tools were not installed, add PostgreSQL's command-line tools through its installer.

### Port 5173 or 8000 is already in use

Stop the earlier application terminal with Ctrl+C first. Inspect listeners before terminating anything:

```powershell
Get-NetTCPConnection -LocalPort 5173,8000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalPort,OwningProcess
Get-Process -Id <owning-process-id>
```

If it is a stale process from this project, stop that specific PID with `Stop-Process -Id <owning-process-id>` and restart `npm.cmd run dev`. Do not terminate an unrelated service.

Alternatively set `server.port` to `5174` in `vite.config.ts`, change both origin lists in `backend/.env` to include `http://localhost:5174` and `http://127.0.0.1:5174`, then restart both servers. Vite uses `strictPort: true`, so it exits instead of silently choosing another port.

### Login fails with Failed to fetch or an API proxy error

1. Check the Django terminal for startup errors and verify the direct health URL.
2. Check the health URL through `http://localhost:5173/api/health/`.
3. The frontend uses relative `/api/...` URLs. `vite.config.ts` proxies them to `http://127.0.0.1:8000`; no `VITE_API_URL` variable is currently read by the application.
4. If changing the backend port, update both the `dev:backend` script in `package.json` and the `/api`, `/admin`, and `/static` proxy targets in `vite.config.ts`.
5. Match CORS and CSRF trusted origins to the frontend URL and restart after changing configuration. Keep the browser on one hostname consistently rather than switching between `localhost` and `127.0.0.1` mid-session.

For a built frontend, configure the hosting server to forward `/api` to Django on the same origin. `npm run build` alone does not supply an API server or a production proxy.

### .env changes are ignored

Confirm the file is named `backend/.env`, not `.env.txt`. Check whether conflicting environment variable names are already set without printing their values:

```powershell
Get-ChildItem Env: |
    Where-Object Name -in @('DB_NAME','DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DJANGO_DEBUG','DEBUG') |
    Select-Object -ExpandProperty Name
```

Remove only the conflicting variables from the current terminal if appropriate, for example `Remove-Item Env:DB_HOST -ErrorAction SilentlyContinue`. Restart the servers. If a system/user-level variable recreates the conflict in new terminals, update that variable through Windows environment settings.

### Django or another Python package cannot be imported

Activate `venv` in the terminal that launches `npm run dev`. Check `python -m pip --version` and reinstall with `python -m pip install -r backend/requirements.txt`. Pillow is required for payout image validation.

### Migrations or tests fail with a permission error

The configured role must own the application database or have the required schema permissions. Tests additionally need `CREATEDB` or an administrator-provisioned test database. Do not use `flush`, drop tables, or reset migrations as a routine setup repair.

### HTTP 400, 403, or 500 during workflow updates

- **400:** Read the JSON validation message. Complete the preceding workflow steps; supply the payout officer in Step 6 and verified proof plus OR number in Step 8 for financial closure.
- **403:** Confirm the selected login role, current account, and assigned program. Re-authenticate an expired tab session rather than bypassing permissions.
- **500:** Read the Django terminal traceback. Verify migrations and database connectivity before retrying; do not treat every validation/save error as a database outage.

## Existing data and non-local hosting

A Git clone does not include PostgreSQL rows or private uploaded evidence. Moving existing data requires a separate authorized database backup/restore and transfer of upload storage, while retaining file references and access controls.

This guide uses local development servers. Public hosting additionally requires a production application server, HTTPS, a same-origin API proxy, static-file serving, a unique secret key, appropriate hosts/origins, `DJANGO_DEBUG=false`, and secure database credentials. Predefined demo credentials are for isolated local use.
