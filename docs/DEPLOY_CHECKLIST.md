# Deploy Checklist

Use this checklist before publishing a new frontend build to the Oracle VPS.

## Required Local Checks

Run from the project root:

```powershell
npm ci
npm run test:ui-all
npm run build
git status --short --branch
```

The working tree should be clean before deploy, except for intentional release commits that are already reviewed and pushed.

## Production Deploy

1. Build locally with `npm run build`.
2. Back up the existing server dist:

```bash
cd /home/ubuntu/forex-ea-dashboard/frontend
cp -a dist "dist-backup-$(date +%Y%m%d-%H%M%S)"
```

3. Upload the local `dist` contents to:

```text
/home/ubuntu/forex-ea-dashboard/frontend/dist
```

4. Restart the reverse proxy:

```bash
docker restart forex-ea-proxy
```

5. Verify production HTML points to the new asset bundle:

```powershell
(Invoke-WebRequest -UseBasicParsing http://161.118.245.238:3000/).Content
```

## Production QA

Run after deploy:

```powershell
$env:BASE_URL="http://161.118.245.238:3000"
$env:QA_ADMIN_PASSWORD="<admin password from safe secret store>"
$env:OUTPUT_DIR="$env:TEMP\the-entity-prod-qa"
npm run qa:production
```

Expected coverage:

- Admin sees `MT5 Reporter`, `System Health`, Sync, Auto sync, delete controls, and admin command palette actions.
- Demo does not see admin pages/actions, real ticket numbers, open prices, or destructive controls.
- Sensitive APIs are allowed for admin and forbidden for demo.
- Desktop and mobile views have no horizontal overflow.
- Custom period controls work on Overview and History.

Do not commit `.env`, `.htpasswd`, runtime DB files, SSH keys, API keys, or QA screenshots.
