# Suretreaven Real Estate UI

This repository is a Vite + React application.

## Run locally

```bash
npm install
npm run dev
```

The development frontend expects the API at `http://localhost:8800`.
Vite proxies `/api` and `/uploads` to that API in development.

## Build

```bash
npm run build
npm run preview
```

## Environment

- `.env.development` uses `/api` and `http://localhost:8800`.
- `.env.production` uses the production API.
- Keep secrets out of committed environment files.
