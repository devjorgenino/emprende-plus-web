# Emprende+ Web - Docker Deployment Guide

## Quick Start

```bash
# Build and start
make up

# Check status
make status

# View logs
make logs

# Stop
make down

# Restart
make restart
```

## Accessing the Application

Once running, access Emprende+ at:
- **Local**: http://localhost:3010
- **Network**: http://<your-ip>:3010

## Data Storage

This application uses **IndexedDB** (browser local storage). Data is stored:
- ✅ Per browser/device
- ✅ Persists after container restarts
- ❌ Not shared across different browsers/devices

### Backing Up Your Data

Since data lives in the browser's IndexedDB:

1. **Export from Browser:**
   ```bash
   make backup-browser
   ```

2. **Manual Steps:**
   - Open browser DevTools (F12)
   - Go to **Application** tab → **Storage** → **IndexedDB**
   - Right-click `emprende-plus-db` → **Export**
   - Save to a secure location

### Restoring Data

```bash
make restore-browser
```

Or manually import via browser DevTools (see above steps in reverse).

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `make build` | Build fresh image without cache |
| `make up` | Start in background |
| `make down` | Stop and remove containers |
| `make restart` | Down then up |
| `make logs` | Follow live logs |
| `make status` | Show container status |
| `make clean` | Remove everything (caution!) |

## Troubleshooting

### Container won't start
```bash
make logs
docker compose ps
```

### Port already in use
Edit `docker-compose.yml` line 8:
```yaml
ports:
  - "8080:80"  # Change 3000 to another port
```

### Reset to clean state
```bash
make clean
make build
make up
```

## Security Notes

- Container runs as non-root user
- No secrets stored in image layers
- Health checks enabled for reliability
- Resource limits can be added in future

## Production Considerations

For production deployment:

1. **Reverse Proxy**: Use nginx/apache in front
2. **HTTPS**: Configure SSL certificates
3. **Backup Strategy**: Set up automated IndexedDB exports
4. **Monitoring**: Add logging aggregation (ELK, etc.)
5. **Scaling**: Currently single-instance; add replicas if needed

## Customization

### Environment Variables
Set these in `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - APP_VERSION=1.0.0
```

### Adding Volumes
For future database needs (PostgreSQL, etc.):
```yaml
volumes:
  - db-data:/var/lib/postgresql/data
```

---
