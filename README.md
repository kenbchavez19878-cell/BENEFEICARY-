
  # BENETRACK

  This is a code bundle for BENETRACK. The original project is available at https://www.figma.com/design/OHOcpXhTx05TnyBFTrO20t/BENETRACK.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Setup on another PC

Follow [SETUP.md](SETUP.md) for prerequisites, Python and Node dependencies, PostgreSQL configuration, migrations, local accounts, startup, and troubleshooting. `npm run dev` starts both Vite and Django; activate the Python virtual environment first.

## AI-assisted setup prompt

After cloning this repository, open it in your AI coding assistant and paste this prompt:

```text
Please set up and verify BENEFITRACK on this PC.

Read SETUP.md and any applicable AGENTS.md instructions first. Inspect the current repository configuration before making changes; use the actual package.json scripts, backend requirements, Django settings, and Vite proxy configuration.

1. Check Python, Node.js/npm, PostgreSQL, and Git. Identify missing prerequisites and install what you can safely within the available permissions. Explain any system-level installation or service action that needs my help.
2. Create and activate the ignored venv environment if needed. Install Python dependencies from backend/requirements.txt and frontend dependencies using npm ci.
3. Configure backend/.env only where values are missing. Generate a unique Django secret key for a new installation. Ask me for missing database connection details through a private local configuration step; never print passwords, secrets, or the contents of an existing .env. Do not overwrite working configuration or commit secrets.
4. Verify PostgreSQL connectivity. Create the application database and role only if missing and authorized, then apply existing Django migrations. Do not drop or reset databases, delete records or uploads, modify migration history, or reset existing accounts/passwords. On a new empty installation, initialize the documented local demo accounts; preserve existing account mappings elsewhere. Do not seed sample beneficiary records unless I request them.
5. Activate the Python environment and run npm run dev from the project root so Vite and Django start together. Inspect port conflicts before taking action; do not terminate unrelated processes. Preserve the existing UI, styling, workflow rules, and program-specific permissions.
6. Verify both the direct Django health endpoint and the /api/health/ endpoint through Vite. Check local API proxy, CORS, and CSRF configuration if requests fail.
7. Run Django system and migration checks, TypeScript checking, the production build, and backend tests using a separate test database. Explain any missing test-database permissions; never point tests at the application database.
8. Confirm that Step 6 records release details without requiring payout proof, and Step 8 requires verified payout evidence and an OR number before closing financial assistance. Preserve non-financial/referral handling.

Proceed with safe, reversible setup work. If a required credential, permission, or prerequisite is unavailable, report the exact blocker and continue independent checks. Finish with a concise report of actions taken, verification results, server URLs, and anything I still need to do. Clearly distinguish completed checks from instructions or unverified assumptions.
```

The prompt is a template to paste into an assistant; placing it in this README does not automatically run setup commands.

