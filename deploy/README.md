# SmritiNER deployment

The project uses two Git remotes:

- `origin`: GitHub collaboration repository.
- `vps`: bare repository on the `athergrid` SSH host.

## Deploy

Commit changes locally, then run:

```powershell
.\scripts\deploy-vps.ps1 -AlsoPushGithub
```

Every push to the VPS `main` branch runs `npm ci`, builds the Vite PWA, copies the build into a revisioned release directory, and atomically updates `/srv/apps/smritiner/current`.

Nginx serves that directory at `https://sih.athergrid.dev`.
