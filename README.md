# The Entity Dashboard

Forex EA portfolio monitoring dashboard for MT5 reporter data.

## What is included

- React/Vite frontend in `src/`
- Broker logo and MT5 reporter assets in `public/`
- FastAPI backend entrypoint in `backend/main.py`
- Nginx reverse proxy config in `nginx/default.conf`
- Production regression tests in `scripts/production-regression.mjs`
- Graphify architecture context in `graphify-out/`

## Local frontend build

```powershell
npm install
npm run build
```

## Production regression

```powershell
$env:BASE_URL="http://161.118.245.238:3000"
npm run qa:production
```

## Sensitive files

Do not commit `.env`, `.htpasswd`, runtime databases, SSH keys, or generated QA screenshots.
