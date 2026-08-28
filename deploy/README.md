# SmritiNER deployment

The project uses two Git remotes:

- `origin`: GitHub collaboration repository.
- `vps`: bare repository on the `athergrid` SSH host.

## Deploy

Commit changes locally, then run:

```powershell
.\scripts\deploy-vps.ps1 -AlsoPushGithub
```

Every push to the VPS `main` branch runs `npm ci`, builds the Vite PWA, installs the production Node service into a revisioned release, atomically updates `/srv/apps/smritiner/current`, restarts systemd, and rolls back if the API health check fails.

Nginx serves the static PWA and proxies authenticated API and memory-image requests to the local Node service on port 3050. SQLite and uploaded images live outside release directories under `/srv/apps/smritiner/data` and `/srv/apps/smritiner/uploads`.
